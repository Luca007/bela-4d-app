# N8N Workflows — Programa 4D

> Todos os workflows se comunicam com o app via Firebase Functions (proxy seguro).
> O frontend **nunca** chama o n8n diretamente.

---

## Arquitetura Geral

```
Frontend (GitHub Pages)
    ↓  Firebase Functions (HTTPS Callable)
Firebase Functions (southamerica-east1)
    ↓  HTTP POST com X-Webhook-Secret
n8n (autohosted ou n8n.cloud)
    ↓  Lógica de IA (Claude/GPT via API)
    ↓  Google Drive (arquivos)
    ↓  Firestore (via Admin SDK ou webhook callback)
```

---

## Variáveis de Ambiente (Firebase Functions)

```bash
firebase functions:secrets:set N8N_BASE_URL
# Valor: https://seu-n8n.cloud/webhook

firebase functions:secrets:set N8N_WEBHOOK_SECRET
# Valor: string aleatória segura (use openssl rand -hex 32)
```

---

## Workflow 1: Process Onboarding Transcript
**Endpoint:** `POST /webhook/4d-process-transcript`
**Disparo:** Guardiã faz upload da transcrição do Google Meet

### Input (payload da Firebase Function):
```json
{
  "uid": "firebase_uid",
  "userProfile": { "name": "Maria", "email": "maria@email.com" },
  "transcriptText": "... texto da transcrição ...",
  "driveFileUrl": "https://drive.google.com/file/...",
  "callbackUrl": "https://SEU-N8N.cloud/webhook/4d-transcript-callback"
}
```

### Lógica do Workflow n8n:
1. **Receber** transcrição via webhook
2. **Enviar para LLM** (Claude Sonnet) com prompt estruturado:
   - Extrair: nome, idade, sexo, peso, altura, diagnósticos, medicamentos
   - Detectar se mencionou exame de sangue recente
   - Extrair: estado emocional, expectativas, gatilhos de abandono
   - Extrair: letramento metabólico, preferências de contato
3. **Salvar no Google Drive**: arquivo de resumo da entrevista
4. **Retornar via callback** ao Firestore:

### Output esperado:
```json
{
  "hasBloodTest": true,
  "suggestedStatus": "pending_blood_test",
  "extractedHealthData": {
    "fullName": "Maria da Silva",
    "birthDate": "1985-03-15",
    "gender": "Feminino",
    "weight": "78",
    "height": "163",
    "diagnostics": ["Diabetes tipo 2", "Hipertensão arterial"],
    "medications": [
      { "name": "Metformina", "dose": "850mg", "time": "manhã" }
    ],
    "glucoseFasting": "145",
    "hba1c": "7.2"
  },
  "interviewSummary": {
    "motivationLevel": 4,
    "abandonmentRisk": "Expectativa de resultado rápido",
    "recommendedTone": "equilibrio",
    "metabolicLiteracy": "parcial"
  }
}
```

### Nós sugeridos no n8n:
```
Webhook → Set Variables → HTTP Request (Claude API) → IF (hasBloodTest?) 
  → [SIM] Update Status "pending_blood_test"
  → [NÃO] Trigger Workflow 3 (Generate Exam Request)
→ Save to Firestore (via HTTP Request para callback)
```

---

## Workflow 2: Process Blood Test
**Endpoint:** `POST /webhook/4d-process-blood-test`
**Disparo:** Usuário envia exame de sangue no app

### Input:
```json
{
  "uid": "firebase_uid",
  "bloodTestId": "firestore_doc_id",
  "driveFileUrl": "https://drive.google.com/...",
  "existingHealthData": { "diagnostics": ["Diabetes tipo 2"] },
  "callbackUrl": "https://SEU-N8N.cloud/webhook/4d-blood-test-callback"
}
```

### Lógica do Workflow n8n:
1. **Baixar arquivo** do Google Drive
2. **OCR / extração de texto** (se imagem): usar Google Vision API ou LLM multimodal
3. **Parsear marcadores** com LLM:
   - Glicose em jejum, HbA1c, colesterol total/HDL/LDL, triglicérides
   - TGO/TGP, creatinina, TSH, vitamina D, B12
   - Insulina em jejum (se disponível)
4. **Calcular alertas** (valores fora da referência)
5. **Callback** → atualiza Firestore com extracted data + muda status

### Output (callback para Firebase Function → Firestore):
```json
{
  "bloodTestId": "...",
  "extractedData": {
    "glucoseFasting": "145",
    "hba1c": "7.2",
    "cholesterolTotal": "210",
    "hdl": "45",
    "ldl": "130",
    "triglycerides": "180",
    "creatinine": "0.9",
    "tsh": "2.1",
    "vitaminD": "22",
    "alerts": [
      { "marker": "hba1c", "value": "7.2", "reference": "<5.7", "status": "alta" },
      { "marker": "vitaminD", "value": "22", "reference": ">30", "status": "baixa" }
    ],
    "collectionDate": "2026-03-15",
    "laboratory": "Fleury"
  }
}
```

### Nós sugeridos:
```
Webhook → Download from Drive → IF (PDF?) 
  → [PDF] Extract Text (PDF Tool)
  → [IMG] Google Vision OCR
→ LLM Extract Markers → Calculate Alerts → 
→ HTTP Request (Firestore callback) → Update Status "filling_health_form"
```

---

## Workflow 3: Generate Exam Request
**Endpoint:** `POST /webhook/4d-generate-exam-request`
**Disparo:** Transcrição detecta ausência de exame de sangue

### Input:
```json
{
  "uid": "firebase_uid",
  "clientData": {
    "name": "Maria da Silva",
    "age": 41,
    "gender": "Feminino",
    "diagnostics": ["Diabetes tipo 2"],
    "medications": ["Metformina 850mg"],
    "weight": "78",
    "height": "163"
  }
}
```

### Lógica do Workflow:
1. **Gerar pedido de exames** personalizado com LLM
   - Exames padrão do protocolo 4D
   - Exames adicionais baseados nos diagnósticos
2. **Preencher template PDF** com dados do cliente
3. **Salvar no Google Drive** (pasta do aluno)
4. **Retornar URL** do arquivo

### Exames padrão do protocolo 4D:
- Glicemia em jejum + insulina em jejum
- HbA1c (hemoglobina glicada)
- Perfil lipídico (CT, HDL, LDL, TG)
- TGO, TGP (transaminases)
- GGT
- Creatinina + ureia
- TSH
- Vitamina D (25-OH)
- Vitamina B12
- Hemograma completo
- Proteína C-reativa ultrassensível (PCR-us)
- Microalbuminúria (se diabetes confirmado)

### Output:
```json
{
  "driveFileUrl": "https://drive.google.com/file/...",
  "fileName": "Pedido_Exames_Maria_Silva_2026.pdf"
}
```

---

## Workflow 4: AI Recipe Agent (Chat)
**Endpoint:** `POST /webhook/4d-agent-chat`
**Disparo:** Usuário envia mensagem no chat do app

### Input:
```json
{
  "uid": "firebase_uid",
  "sessionId": "uid_timestamp",
  "message": "Preciso de uma ideia de café da manhã",
  "userContext": {
    "profile": { "name": "Maria", "xp": 450, "level": 2 },
    "healthForm": {
      "diagnostics": ["Diabetes tipo 2"],
      "medications": [{ "name": "Metformina", "dose": "850mg" }],
      "hba1c": "7.2",
      "glucoseFasting": "145"
    },
    "menuForm": {
      "greenList": { "proteins": ["Ovo", "Frango"], "vegetables": ["Brócolis"] },
      "restrictions": ["Lactose grave"],
      "objective": "weight_loss",
      "cookingTime": "até 20 min"
    }
  }
}
```

### Lógica do Agente:
1. **Recuperar histórico** de conversa (memória de curto prazo)
2. **Recuperar perfil completo** do usuário (memória de longo prazo)
3. **Detectar intenção**: receita, dúvida, apoio emocional, avaliação de alimento
4. **Gerar resposta** personalizada com LLM
5. **Se receita**: estruturar em formato JSON padronizado
6. **Salvar resposta** no chatHistory do Firestore

### Prompt do Sistema (resumo):
```
Você é o agente de nutrição personalizado do Programa 4D da Bela Nutrição.
Você conhece profundamente o histórico metabólico de [NOME]:
- Diagnóstico: [DIAGNÓSTICOS]
- Medicamentos: [MEDICAMENTOS]
- HbA1c atual: [HBA1C]%
- Alimentos favoritos: [GREEN_LIST]
- Restrições absolutas: [RESTRICTIONS]
- Objetivo: [OBJETIVO]

Suas regras:
1. NUNCA sugira alimentos da lista vermelha
2. Adapte todas as receitas ao perfil glicêmico
3. Explique o impacto glicêmico quando relevante
4. Use linguagem acolhedora e não-julgamental
5. Se detectar sinais de desânimo, ofereça apoio emocional primeiro
```

### Output:
```json
{
  "reply": "Que ótima escolha! Aqui vai um café da manhã perfeito para seu perfil...",
  "type": "recipe",
  "recipe": {
    "title": "Omelete de Brócolis com Frango Desfiado",
    "mealType": "breakfast",
    "prepTime": 15,
    "servings": 1,
    "difficulty": "fácil",
    "ingredients": [
      { "name": "Ovos", "quantity": "3", "unit": "unidades" },
      { "name": "Frango desfiado", "quantity": "80", "unit": "g" },
      { "name": "Brócolis", "quantity": "50", "unit": "g" },
      { "name": "Azeite", "quantity": "1", "unit": "colher de sopa" }
    ],
    "instructions": ["Bata os ovos...", "Aqueça o azeite...", "..."],
    "nutrition": {
      "calories": 380,
      "carbs": 8,
      "proteins": 42,
      "fats": 18,
      "glycemicIndex": 15
    },
    "tags": ["baixo-carb", "alta-proteína", "sem-lactose", "anti-inflamatório"]
  }
}
```

---

## Workflow 5: Generate Recipe (direto)
**Endpoint:** `POST /webhook/4d-generate-recipe`
**Disparo:** Usuário clica em "Gerar Receita" sem chat

Similar ao Workflow 4, mas sem contexto de conversa. Aceita parâmetros adicionais de preferência:
```json
{
  "preferences": {
    "mealType": "lunch",
    "maxPrepTime": 30,
    "avoidIngredients": ["Frango"],
    "preferIngredients": ["Salmão"]
  }
}
```

---

## Workflow 6: Evaluate Food
**Endpoint:** `POST /webhook/4d-evaluate-food`
**Disparo:** Usuário usa o Avaliador de Alimentos

### Input:
```json
{
  "uid": "firebase_uid",
  "foodName": "Pão de queijo",
  "quantity": 50,
  "userDiagnostics": ["Diabetes tipo 2"],
  "userProfile": { "hba1c": "7.2" }
}
```

### Output:
```json
{
  "evaluation": {
    "food": "Pão de queijo",
    "quantity": "50g",
    "glycemicImpact": "alto",
    "score": 2,
    "maxScore": 10,
    "verdict": "⚠️ Evitar",
    "explanation": "O pão de queijo tem alto índice glicêmico (IG ~75) e pode causar pico de glicemia...",
    "alternatives": ["Ovos mexidos", "Iogurte proteico com castanhas"],
    "whenOk": "Em ocasiões especiais, limite a 1 unidade pequena após uma refeição completa."
  }
}
```

---

## Workflow 7: Send WhatsApp Notification
**Endpoint:** `POST /webhook/4d-send-whatsapp-notification`
**Disparo:** Usuário muda status, exame é processado, ou formulário fica pronto

### Input:
```json
{
  "uid": "firebase_uid",
  "userProfile": { "name": "Maria", "phone": "+5511999999999" },
  "notification": {
    "title": "Exame de Sangue Processado ✓",
    "message": "Seus exames foram analisados. Vamos criar um plano alimentar personalizado?",
    "type": "exam_complete",
    "priority": "high",
    "actionUrl": "https://seu-app.com/?screen=health-form&uid=...",
    "emoji": "📋"
  }
}
```

### Lógica do Workflow:
1. **Validar telefone** (formato internacional +55xx)
2. **Construir mensagem** formatada para WhatsApp (máx 1000 caracteres, múltiplas mensagens se necessário)
3. **Enviar via WhatsApp API** (Twilio, WhatsApp Business API, ou n8n integrado)
4. **Registrar no Firestore** a entrega (timestamp, status: enviado/falha)
5. **Se falha**: retry exponencial até 3 tentativas

### Tipos de Notificações Esperadas:
- `onboarding_complete` - "Bem-vinda ao Programa 4D!"
- `blood_test_processed` - "Seus exames estão prontos"
- `health_form_ready` - "Vamos preencher seu formulário de saúde?"
- `menu_form_ready` - "Qual é seu tipo de cardápio?"
- `exam_results_analyzed` - "Análise completa pronta"
- `recipe_generated` - "Receita personalizada criada"
- `pending_action` - "Ação pendente aguardando você"
- `achievement_unlocked` - "Conquista desbloqueada: [NOME]"

### Output:
```json
{
  "sent": true,
  "messageId": "wame_...",
  "timestamp": "2026-05-06T14:30:00Z",
  "status": "delivered"
}
```

### Nós sugeridos:
```
Webhook → Extract Phone Number → Build Message → 
Send WhatsApp (Twilio ou similar) → 
Log to Firestore (via HTTP callback) → Success/Retry
```

---

## Google Drive — Estrutura de Pastas

```
4D - Programa Bela Nutrição/
├── Alunos/
│   └── {nome_aluno}_{uid}/
│       ├── Entrevistas/
│       │   └── Transcrição_Onboarding_{data}.txt
│       ├── Exames/
│       │   ├── Exame_Sangue_{data}.pdf          ← upload do aluno
│       │   └── Exame_Sangue_{data}_extraido.json ← dados extraídos pela IA
│       ├── Pedidos/
│       │   └── Pedido_Exames_{data}.pdf          ← gerado pela IA
│       └── Cardapios/
│           └── Cardapio_Semana_{n}_{data}.pdf
└── Templates/
    ├── Template_Pedido_Exames.docx
    └── Template_Cardapio.docx
```

---

## Testing Workflows com CURL

### 1. Test: Process Transcript
```bash
curl -X POST https://n8n-instance.cloud/webhook/4d-process-transcript \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $N8N_WEBHOOK_SECRET" \
  -d '{
    "uid": "test-uid-123",
    "userProfile": { "name": "Test User", "email": "test@test.com" },
    "transcriptText": "Meu nome é João, tenho 45 anos, fui diagnosticado com diabetes tipo 2...",
    "driveFileUrl": "https://drive.google.com/file/d/...",
    "callbackUrl": "https://southamerica-east1-PROJECT.cloudfunctions.net/n8nCallback"
  }'
```

### 2. Test: Blood Test Processing
```bash
curl -X POST https://n8n-instance.cloud/webhook/4d-process-blood-test \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $N8N_WEBHOOK_SECRET" \
  -d '{
    "uid": "test-uid-123",
    "bloodTestId": "blood-test-id",
    "driveFileUrl": "https://drive.google.com/file/d/...",
    "existingHealthData": { "diagnostics": ["Diabetes tipo 2"] },
    "callbackUrl": "https://southamerica-east1-PROJECT.cloudfunctions.net/n8nCallback"
  }'
```

### 3. Test: Chat Agent
```bash
curl -X POST https://n8n-instance.cloud/webhook/4d-agent-chat \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $N8N_WEBHOOK_SECRET" \
  -d '{
    "uid": "test-uid-123",
    "sessionId": "session-123",
    "message": "Quero um café da manhã saudável",
    "userContext": {
      "profile": { "name": "Test", "xp": 100, "level": 1 },
      "healthForm": {
        "diagnostics": ["Diabetes tipo 2"],
        "medications": [{ "name": "Metformina", "dose": "850mg" }],
        "hba1c": "7.2"
      },
      "menuForm": {
        "greenList": { "proteins": ["Ovo"] },
        "restrictions": ["Lactose"],
        "objective": "weight_loss"
      }
    }
  }'
```

### 4. Test: Send WhatsApp Notification
```bash
curl -X POST https://n8n-instance.cloud/webhook/4d-send-whatsapp-notification \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $N8N_WEBHOOK_SECRET" \
  -d '{
    "uid": "test-uid-123",
    "userProfile": { "name": "Test", "phone": "+5511999999999" },
    "notification": {
      "title": "Teste de Notificação",
      "message": "Esta é uma mensagem de teste do Programa 4D",
      "type": "test",
      "priority": "normal"
    }
  }'
```

---

## Integração com Qdrant (Memória Vetorial)

### Objetivo:
Armazenar embeddings do contexto de cada usuário para RAG (Retrieval-Augmented Generation) eficiente.

### Estrutura de Coleções:
```
qdrant-collections/
├── user_context_v1/
│   └── Pontos: embeddings de:
│       - Histórico de chat (últimas 20 mensagens)
│       - Perfil de saúde (diagnósticos, medicamentos)
│       - Exames (valores laboratoriais com alertas)
│       - Receitas preferidas
│       - Alimentos favoritos
│       - Conquistas/milestones
└── recipes_v1/
    └── Pontos: embeddings de:
        - Título + ingredientes de cada receita
        - Tags (baixo-carb, sem-lactose, etc)
```

### Fluxo de Indexação:
1. **Quando workflow 4 (chat) termina:** enviar response + contexto para Qdrant
2. **Quando workflow 2 (exame) termina:** indexar valores de exame e alertas
3. **Quando receita é criada:** indexar em recipes_v1
4. **TTL:** 60 dias para contexto de chat, permanente para saúde/receitas

### Prompt Retrieval (antes de cada resposta do agente):
```javascript
// Em firebase/functions/index.js, antes de chamar n8n:
const relevantContext = await qdrantClient.search({
  collection_name: "user_context_v1",
  vector: embedUserQuery(userMessage),
  limit: 5,
  score_threshold: 0.7
});

// Incluir no payload do n8n:
payload.retrievedContext = relevantContext;
payload.retrievalStrategy = "qdrant_reranked";
```

---

## Integração com Redis (Cache de Sessão)

### Objetivo:
Cache rápido para sessões ativas, contexto temporário e contadores.

### Chaves por Sessão:
```
session:{sessionId}:{uid}:chat_history → últimas 10 mensagens (TTL: 24h)
session:{sessionId}:{uid}:pending_actions → ações não completadas (TTL: 48h)
session:{sessionId}:{uid}:form_draft → rascunho do formulário (TTL: 7d)
session:{sessionId}:{uid}:retrieval_cache → embeddings mais recentes (TTL: 1h)

user:{uid}:xp_daily → XP acumulado do dia (TTL: 24h)
user:{uid}:notifications_sent → notificações enviadas hoje (TTL: 24h)
ranking:{date}:scores → cache de ranking diário (TTL: 24h)
```

### Lógica de Cache-Aside:
```javascript
// Pseudo-código em n8n ou Firebase Functions:
async function getContextWithCache(uid) {
  const cached = redis.get(`user:${uid}:context_full`);
  if (cached) return JSON.parse(cached);
  
  const fresh = await firestore.doc(`users/${uid}`).get();
  redis.setex(`user:${uid}:context_full`, 3600, JSON.stringify(fresh.data()));
  return fresh.data();
}
```

---

## Reranker (Qualidade de Resposta)

Após o Qdrant retornar contexto relevante, usar um reranker para ordenar por relevância máxima:

```javascript
// Usar Cohere Rerank API:
const rerankResponse = await fetch('https://api.cohere.ai/v1/rerank', {
  headers: { 'Authorization': `Bearer ${COHERE_API_KEY}` },
  body: JSON.stringify({
    model: 'rerank-english-v2.0',
    query: userMessage,
    documents: retrievedContext.map(doc => doc.payload.text),
    top_n: 3
  })
});
```

---

## Monitoramento e Logs

Todos os workflows devem logar para Firestore em `logs/{workflow_name}/`:

```json
{
  "timestamp": "2026-05-06T14:30:00Z",
  "uid": "firebase_uid",
  "workflowId": "4d-agent-chat",
  "status": "success | error | retry",
  "duration": 2450,
  "inputTokens": 450,
  "outputTokens": 180,
  "costUSD": 0.0015,
  "errorMessage": null,
  "retriedAttempts": 0
}
```

---

## Segurança dos Webhooks

Todos os webhooks do n8n devem verificar o header:
```
X-Webhook-Secret: {N8N_WEBHOOK_SECRET}
```

No n8n, configure em cada webhook: **Header Auth** → `X-Webhook-Secret`

---

## Callbacks do n8n para o Firestore

Para workflows assíncronos (exame de sangue), o n8n chama de volta uma
Firebase Function específica para atualizar o Firestore com segurança:

```
POST https://southamerica-east1-{projeto}.cloudfunctions.net/n8nCallback
Authorization: Bearer {N8N_CALLBACK_TOKEN}
Content-Type: application/json

{
  "event": "blood_test_processed",
  "uid": "firebase_uid",
  "data": { ... }
}
```

---

## Setup: Guia Passo a Passo no n8n

### Prerequisitos:
1. Conta no n8n.cloud ou instância autohosted rodando
2. Credenciais: OpenAI/Anthropic API, Google Drive API, Google Vision (OCR), Twilio (WhatsApp)
3. Firestore Admin SDK já configurado na cloud function de callback
4. Variáveis de ambiente: N8N_BASE_URL, N8N_WEBHOOK_SECRET

### Workflow 1: Process Transcript (Detalhado)

**Passo 1: Criar Webhook**
1. Novo workflow → Naming: "4d-process-transcript"
2. Add Node → Webhook
3. HTTP Method: POST
4. URL: `/webhook/4d-process-transcript`
5. Authentication: "Header Auth" → Header: `X-Webhook-Secret`

**Passo 2: Validar Payload**
1. Add Node → Set (para visualizar o input)
2. Set variables:
   ```
   uid = $json.body.uid
   userProfile = $json.body.userProfile
   transcriptText = $json.body.transcriptText
   callbackUrl = $json.body.callbackUrl
   ```

**Passo 3: Chamar Claude Sonnet**
1. Add Node → HTTP Request
2. Method: POST
3. URL: `https://api.anthropic.com/v1/messages`
4. Authentication: Bearer ${ANTHROPIC_API_KEY}
5. Headers: Content-Type: application/json
6. Body:
   ```json
   {
     "model": "claude-3-5-sonnet-20241022",
     "max_tokens": 2000,
     "system": "Você é um assistente de triagem de saúde...",
     "messages": [
       {
         "role": "user",
         "content": "Transcrição: {{$node[\"Webhook\"].json.transcriptText}}\n\nExtraia: nome, idade, sexo, diagnósticos, medicamentos..."
       }
     ]
   }
   ```

**Passo 4: Parsear Resposta JSON**
1. Add Node → Code
2. Language: JavaScript
3. Código:
   ```javascript
   const response = $json.body.content[0].text;
   try {
     // Tentar parsear JSON direto ou extrair JSON da resposta texto
     const extracted = JSON.parse(response);
     return [{
       hasBloodTest: extracted.diagnostics?.includes("exame de sangue"),
       extractedHealthData: extracted,
       interviewSummary: {
         motivationLevel: extracted.motivationLevel || 3,
         recommendedTone: "equilibrio"
       }
     }];
   } catch (e) {
     // Fallback: criar estrutura padrão
     return [{ hasBloodTest: true, extractedHealthData: {} }];
   }
   ```

**Passo 5: Callback para Firestore**
1. Add Node → HTTP Request
2. Method: POST
3. URL: `${callbackUrl}` (dinâmico)
4. Headers: Content-Type: application/json, Authorization: Bearer ${FIREBASE_CALLBACK_TOKEN}
5. Body:
   ```json
   {
     "event": "transcript_processed",
     "uid": "{{$node[\"Set\"].json.uid}}",
     "data": "{{$node[\"Code\"].json[0]}}"
   }
   ```

**Passo 6: Error Handling**
1. Add Node → Conditional (antes do Callback)
2. If: Response status !== 2xx → Retry até 3x com backoff exponencial

---

### Workflow 4: AI Chat Agent (Simplificado)

Padrão similar ao Workflow 1, mas com:

1. **Webhook** → recebe message + userContext
2. **Code Node** → formatar prompt do sistema com contexto
3. **HTTP Request (Qdrant)** → buscar contexto relevante (optional, para MVP pode ser local)
4. **HTTP Request (Claude)** → chamar LLM com prompt + histórico + contexto
5. **Code Node** → estruturar resposta em JSON (reply, type, recipe/evaluation)
6. **Firestore Callback** → salvar em users/{uid}/chatHistory/{sessionId}

**Prompt do Sistema:**
```
Você é a guardiã nutricional do Programa 4D.
Conhece profundamente {NOME}:
- Diagnósticos: {DIAGS}
- Medicações: {MEDS}
- HbA1c: {HBA1C}%
- Restrições: {RESTR}

Seu tom: acolhedor, científico, não-julgamental.
Regra 1: NUNCA sugira alimentos vermelhos.
Regra 2: Sempre explique o impacto glicêmico.
Regra 3: Promova autonomia, não dependência.

{CHAT_HISTORY}

Usuário: {MESSAGE}

Responda em JSON:
{
  "reply": "sua resposta",
  "type": "receita|avaliacao|apoio|duvida",
  "recipe": {...} se type=receita,
  "evaluation": {...} se type=avaliacao
}
```

---

### Workflow 6: Evaluate Food (Minimalista)

1. **Webhook** → recebe foodName + userDiagnostics
2. **HTTP Request** → LLM pergunta:
   ```
   "Avalie o alimento '{FOOD}' para um paciente com {DIAGS}.
   Considere impacto glicêmico, inflamação, e compatibilidade.
   Responda em JSON com score 1-10, alternativas, e quando seria ok consumir."
   ```
3. **Code Node** → estruturar resposta em score/verdict/alternatives
4. **Firestore Log** → salvar em users/{uid}/evaluations/{foodId}

---

## Deployment: Firebase Cloud Functions

### Deploy com n8n:
```bash
# 1. Configurar secrets:
firebase functions:secrets:set N8N_BASE_URL
firebase functions:secrets:set N8N_WEBHOOK_SECRET

# 2. Fazer deploy:
firebase deploy --only functions

# 3. Testar o endpoint:
curl -X POST \
  https://southamerica-east1-PROJECT.cloudfunctions.net/agentChatMessage \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"...", "sessionId":"...", "message":"..."}'
```

---

## Próximos Passos

1. **Copiar templates acima** para n8n.cloud e adaptar com suas chaves de API
2. **Testar cada workflow** com curl examples fornecidos
3. **Configurar callbacks** → Firebase Function de callback em firebase/functions/index.js
4. **Configurar Qdrant + Redis** → endereços e credenciais nos secrets do Firebase
5. **Monitorar logs** → verificar Firestore `logs/{workflow_name}` para erros
6. **Ativar workflows** → publicar e ativar webhooks
7. **Integrar no frontend** → chamar Cloud Functions (que delegam ao n8n) via JavaScript


