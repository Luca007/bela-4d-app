# N8N Setup & Configuration — Programa 4D

> Guia passo-a-passo para configurar webhooks e testes locais

---

## 🔧 Parte 1: Firebase Functions Secrets

### Step 1.1: Definir Secrets Localmente

```bash
# No diretório firebase/functions

# Secret 1: Base URL do n8n
firebase functions:secrets:set N8N_BASE_URL
# Resposta esperada:
# $ firebase functions:secrets:set N8N_BASE_URL
# ? Enter value for N8N_BASE_URL:
# > https://seu-n8n.cloud/webhook  [ou http://localhost:5679/webhook para local]

# Secret 2: Webhook secret (use openssl para gerar)
openssl rand -hex 32
# Exemplo output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z

firebase functions:secrets:set N8N_WEBHOOK_SECRET
# $ firebase functions:secrets:set N8N_WEBHOOK_SECRET
# ? Enter value for N8N_WEBHOOK_SECRET:
# > [colar a string acima]
```

### Step 1.2: Verificar Secrets

```bash
firebase functions:secrets:list
# Deve listar:
# - N8N_BASE_URL: [REDACTED]
# - N8N_WEBHOOK_SECRET: [REDACTED]
```

### Step 1.3: Atualizar `.env.local` (para desenvolvimento)

Criar arquivo `firebase/functions/.env.local`:

```env
N8N_BASE_URL=https://seu-n8n.cloud/webhook
N8N_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z
```

---

## 🌐 Parte 2: Configurar n8n

### Step 2.1: Criar Webhook Receivers em n8n

> Assuma que n8n está rodando em `https://seu-n8n.cloud` ou `http://localhost:5679`

**Workflow 1: Process Onboarding Transcript**
- Nome: `4d-process-transcript`
- Tipo: Webhook
- Path: `/webhook/4d-process-transcript`
- Método: POST
- Auth: Header (nome: `X-Webhook-Secret`, valor: seu N8N_WEBHOOK_SECRET)

**Workflow 2: Process Blood Test**
- Path: `/webhook/4d-process-blood-test`

**Workflow 3: Generate Exam Request**
- Path: `/webhook/4d-generate-exam-request`

**Workflow 4: Chat Agent**
- Path: `/webhook/4d-chat-message`

**Workflow 5: Generate Recipe**
- Path: `/webhook/4d-generate-recipe`

### Step 2.2: Testar Webhook com curl

```bash
# Testar conexão básica
curl -X POST https://seu-n8n.cloud/webhook/4d-process-transcript \
  -H "X-Webhook-Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test_user_123",
    "transcriptText": "Teste de transcrição",
    "userProfile": {"name": "Test", "email": "test@example.com"}
  }'

# Esperado: 200 OK + response JSON do workflow
```

---

## 🧪 Parte 3: Testar Firebase Functions Localmente

### Step 3.1: Rodar emulator

```bash
# No diretório firebase/functions

firebase emulators:start --only functions
# Output:
# ✔  functions[southamerica-east1-onboardingTranscript]: http function initialized at http://localhost:5001/seu-projeto/southamerica-east1/onboardingTranscript
```

### Step 3.2: Testar function com curl

```bash
# Testar callableFunction via REST
curl -X POST http://localhost:5001/seu-projeto/southamerica-east1/onboardingTranscript \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "uid": "test_user_123",
      "transcriptText": "Meu nome é Maria, tenho 45 anos...",
      "driveFileUrl": "https://drive.google.com/file/..."
    }
  }'
```

### Step 3.3: Verificar Logs

```bash
# Logs locais aparecem no terminal do emulator
# Para produção:
firebase functions:log --follow
```

---

## 🚀 Parte 4: Deploy em Produção

### Step 4.1: Fazer Deploy da Function

```bash
# Deploy apenas functions
firebase deploy --only functions

# Output esperado:
# ✔ Deploy complete!
# Function URL: https://southamerica-east1-PROJETO.cloudfunctions.net/onboardingTranscript
```

### Step 4.2: Testar em Produção

```bash
# Usar URL de produção
curl -X POST https://southamerica-east1-PROJETO.cloudfunctions.net/onboardingTranscript \
  -H "Content-Type: application/json" \
  -d '{ "data": { ... } }'
```

### Step 4.3: Monitorar

```bash
# Ver logs em tempo real
firebase functions:log --follow

# Ou via Google Cloud Console
# https://console.cloud.google.com/functions/details/southamerica-east1/onboardingTranscript
```

---

## 📋 Checklist de Setup

- [ ] N8N_BASE_URL setado em Firebase Secrets
- [ ] N8N_WEBHOOK_SECRET setado em Firebase Secrets
- [ ] n8n webhooks criados e testados com curl
- [ ] Firebase emulator testado localmente
- [ ] Functions deployadas em produção
- [ ] Logs sendo monitorados

---

## 🔐 Segurança: Autenticação n8n

**Implementar em cada webhook n8n:**

1. **Header Validation**: Verificar `X-Webhook-Secret`
2. **HTTPS Only**: Nunca usar HTTP em produção
3. **CORS**: Restringir origin apenas ao Firebase (ou vazio)
4. **Rate Limiting**: Max 100 reqs/min por webhook
5. **Timeout**: 30s max execution time

---

## 📞 Troubleshooting

### "Connection refused"
- Verificar se n8n está rodando: `curl http://localhost:5679`
- Verificar if ngrok/tunnel está ativo (se testando localmente)

### "401 Unauthorized"
- Verificar se `X-Webhook-Secret` está correto
- Verificar se secret foi setado em ambos os lados

### "Function timed out"
- n8n workflow muito lento (aumentar timeout em Cloud Functions para 60s)
- LLM API call timeout (adicionar retry logic)

### "502 Bad Gateway"
- Firebase Functions region desatualizada
- Tentar redeploy: `firebase deploy --only functions --force`

---

**Próximo Step:** Implementar função `processOnboardingTranscript` em `firebase/functions/index.js`
