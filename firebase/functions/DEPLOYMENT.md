# Cloud Functions — DEPLOYMENT

Programa 4D Bela Nutrição · Firebase Project `bela-4d-app` · Node 20

---

## 1. Funções exportadas

| # | Função | Tipo | Região | Secrets | Disparo |
|---|--------|------|--------|---------|---------|
| 1 | `processOnboardingTranscript` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('processOnboardingTranscript')` — proxy p/ n8n processar transcrição do onboarding |
| 2 | `processBloodTest` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('processBloodTest')` — proxy p/ n8n processar exame de sangue |
| 3 | `generateExamRequest` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('generateExamRequest')` — proxy p/ n8n gerar pedido de exame |
| 4 | `agentChatMessage` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('agentChatMessage')` — proxy p/ n8n processar mensagem do chat IA |
| 5 | `generateRecipe` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('generateRecipe')` — proxy p/ n8n gerar receita personalizada |
| 6 | `deleteRecipe` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('deleteRecipe')` — proxy p/ n8n deletar receita |
| 7 | `claimAchievement` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('claimAchievement')` — processa reivindicação de conquista (Firestore local) |
| 8 | `evaluateFood` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('evaluateFood')` — proxy p/ n8n avaliar alimento |
| 9 | `downloadExamPdf` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('downloadExamPdf')` — proxy p/ n8n baixar PDF do exame |
| 10 | `onTranscriptCallback` | `onRequest` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `POST https://southamerica-east1-bela-4d-app.cloudfunctions.net/onTranscriptCallback` — callback do n8n pós-transcrição |
| 11 | `onBloodTestCallback` | `onRequest` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `POST https://southamerica-east1-bela-4d-app.cloudfunctions.net/onBloodTestCallback` — callback do n8n pós-processamento de exame |
| 12 | `sendPatientNotification` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('sendPatientNotification')` — envia notificação WhatsApp p/ paciente |
| 13 | `onBloodTestCreated` | `onDocumentCreated` | `southamerica-east1` | — (nenhum) | Automático: dispara ao criar doc em `users/{uid}/bloodTests/{testId}` com `driveFileUrl` |
| 14 | `onUserStatusUpdated` | `onDocumentUpdated` | `southamerica-east1` | — (nenhum) | Automático: dispara ao atualizar `users/{uid}` com mudança de `status` |
| 15 | `updateGlobalRanking` | `onSchedule` | `southamerica-east1` | — (nenhum) | Schedule: `every 24 hours` (America/Sao_Paulo) — atualiza top 100 do ranking |
| 16 | `recordSectionVisit` | `onCall` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `functions.httpsCallable('recordSectionVisit')` — registra visita a aba do dashboard (conquista polymath) |
| 17 | `evaluateTimeBasedAchievements` | `onSchedule` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | Schedule: `every 24 hours` (America/Sao_Paulo) — avalia conquistas baseadas em tempo/veteranía |
| 18 | `seedAppConfig` | `onRequest` | `southamerica-east1` | N8N_BASE_URL, N8N_WEBHOOK_SECRET | `POST https://southamerica-east1-bela-4d-app.cloudfunctions.net/seedAppConfig` — popula appConfig no Firestore (idempotente) |

> **Nota:** As funções Firestore triggers (`onDocumentCreated`, `onDocumentUpdated`) e `onSchedule` NÃO usam secrets porque rodam dentro do contexto Firebase Admin (acesso direto ao Firestore). As demais usam secrets para autenticar chamadas ao n8n.

---

## 2. Secrets

Os secrets são definidos no topo do `index.js` via `defineSecret()` e injetados nas funções via `secrets: SECRETS`.

### N8N_BASE_URL
- **Propósito:** URL base do servidor n8n (ex: `https://SEU-N8N.cloud/webhook`). Usada para todas as chamadas HTTP ao n8n (proxies onCall) e construção de callback URLs.
- **Fallback:** `process.env.N8N_BASE_URL` ou `'https://SEU-N8N.cloud/webhook'`
- **Criar/atualizar:**
  ```bash
  firebase functions:secrets:set N8N_BASE_URL
  ```
  Insira a URL completa do webhook do n8n (sem barra final). Exemplo: `https://n8n.seudominio.com/webhook`

### N8N_WEBHOOK_SECRET
- **Propósito:** Token de autenticação compartilhado entre as Cloud Functions e o n8n. Enviado como header `X-Webhook-Secret` nas chamadas ao n8n e verificado nos callbacks (`onTranscriptCallback`, `onBloodTestCallback`) e no `seedAppConfig`.
- **Fallback:** `process.env.N8N_WEBHOOK_SECRET` ou `'TROQUE-EM-PRODUCAO'`
- **Criar/atualizar:**
  ```bash
  firebase functions:secrets:set N8N_WEBHOOK_SECRET
  ```
  Use um valor aleatório longo (ex: `openssl rand -hex 32`). Este MESMO valor deve ser configurado no n8n como variável de ambiente ou header de verificação.

### Verificar secrets existentes
```bash
firebase functions:secrets:access N8N_BASE_URL
firebase functions:secrets:access N8N_WEBHOOK_SECRET
```

---

## 3. Checklist pré-deploy

- [ ] **Node e dependências:**
  ```bash
  cd firebase/functions
  npm install
  ```
- [ ] **Todos os secrets configurados:**
  ```bash
  firebase functions:secrets:access N8N_BASE_URL
  firebase functions:secrets:access N8N_WEBHOOK_SECRET
  ```
- [ ] **Login ativo:**
  ```bash
  firebase login
  ```
- [ ] **Projeto correto:**
  ```bash
  firebase use bela-4d-app
  ```
- [ ] **n8n acessível:** Confirme que o n8n está rodando e o `N8N_BASE_URL` está correto.

---

## 4. Comandos de deploy

### Deploy completo (todas as funções)
```bash
cd firebase && firebase deploy --only functions
```

### Deploy de função única
```bash
cd firebase && firebase deploy --only functions:NOME_DA_FUNCAO
```
Exemplos:
```bash
firebase deploy --only functions:agentChatMessage
firebase deploy --only functions:seedAppConfig
firebase deploy --only functions:updateGlobalRanking
```

### Pós-deploy: semear appConfig

Após o primeiro deploy (ou após limpar o Firestore), execute `seedAppConfig` **UMA VEZ** para popular os dados de configuração (levels, achievements, xpEvents, navigation, foodDatabase, etc.):

```bash
curl -X POST https://southamerica-east1-bela-4d-app.cloudfunctions.net/seedAppConfig \
  -H "X-Webhook-Secret: VALOR_DO_N8N_WEBHOOK_SECRET"
```

A função é idempotente — só insere se o documento `appConfig` ainda não existir no Firestore.

---

## 5. Rollback

### Listar versões disponíveis
```bash
firebase functions:list
```

### Reverter pelo Cloud Console
1. Acesse [Google Cloud Console → Cloud Functions](https://console.cloud.google.com/functions)
2. Selecione a função desejada
3. Aba "Revisions" — localize a revisão anterior
4. Clique em "Rollback" na revisão alvo

### Via gcloud CLI (alternativa)
```bash
gcloud functions deploy NOME_DA_FUNCAO \
  --region=southamerica-east1 \
  --source=firebase/functions \
  --trigger-http  # ajuste conforme o trigger type
```

---

## 6. Monitoramento

### Logs em tempo real
```bash
firebase functions:log --only NOME_DA_FUNCAO
```

### Todas as funções
```bash
firebase functions:log
```

### Via npm script
```bash
cd firebase/functions && npm run logs
```

---

## 7. Estrutura do projeto

```
firebase/functions/
├── index.js              # Todas as 18 Cloud Functions + helpers (1184 linhas)
├── package.json          # firebase-admin, firebase-functions, axios
└── DEPLOYMENT.md         # Este arquivo
```

---

## 8. Troubleshooting rápido

| Sintoma | Causa provável | Ação |
|---------|---------------|------|
| Erro `INVALID_ARGUMENT` nas funções onCall | `requireAuth()` falhou (token inválido/expirado) | Verificar autenticação Firebase Auth no frontend |
| Erro `ECONNREFUSED` / timeout nas chamadas n8n | n8n fora do ar ou `N8N_BASE_URL` errado | Verificar `N8N_BASE_URL` e saúde do n8n |
| `UNAUTHENTICATED` nos callbacks/seedAppConfig | `X-Webhook-Secret` incorreto ou ausente | Conferir `N8N_WEBHOOK_SECRET` no Firebase e no n8n |
| Funções Firestore trigger não disparam | Índices compostos faltando | Verificar `firestore.indexes.json` e deploy de índices |
| `seedAppConfig` não popula nada | Documento `appConfig` já existe | É idempotente — delete o doc manualmente se precisar re-semear |
