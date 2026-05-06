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

*Última atualização: Maio 2026 — Programa 4D · Bela Nutrição*
