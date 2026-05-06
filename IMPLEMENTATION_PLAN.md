# 🚀 Plano de Implementação GMP - Programa 4D

> Versão 1.0 — Maio 6, 2026
> Branch: `claude/review-project-context-1vSev`

---

## 📊 Estado Atual do Projeto

### ✅ Completo
- [x] Estrutura base do projeto (Vanilla JS + Firebase + GitHub Pages)
- [x] Sistema de autenticação Firebase Auth (Email/Senha)
- [x] Telas básicas: Login, Dashboard, Onboarding
- [x] Serviços: auth.js, firestore.js, n8n.js
- [x] Cloud Functions com n8n proxy
- [x] Schema Firestore documentado
- [x] Sistema de gamificação (constants.js com XP_EVENTS, LEVELS, ACHIEVEMENTS)
- [x] Merge de `feature/full-onboarding-flow` → `main`

### 🔄 Parcialmente Implementado
- [x] HealthFormScreen (837 linhas) — tela e lógica básica existem
- [x] ExamUploadScreen (441 linhas) — upload file existe
- [x] AwaitingScreen (283 linhas) — estados de espera existem
- [x] Transcrição de Google Meet — n8n workflow documentado
- [ ] Chat em tempo real com IA guardiã
- [ ] Processamento de exame de sangue por IA
- [ ] Geração de receitas personalizadas
- [ ] Classificação de alimentos
- [ ] Sistema de ranking

### ❌ Não Iniciado
- [ ] Integração Google Meet + n8n
- [ ] Dashboard com chat funcional
- [ ] Sistema de notificações (pendingActions)
- [ ] Gamificação visual (XP counter, levels, achievements modal)
- [ ] Google Sheets sync (para profesional dashboard)
- [ ] Mobile-first otimização
- [ ] GitHub Pages deployment completo
- [ ] Testes end-to-end

---

## 🎯 Fluxo do Usuário (Implementação Priority)

```
1. LOGIN (Firebase Auth)
   └─> Usuario logged in → Check status

2. AWAITING_ONBOARDING
   └─> Guardiã envia reunião Google Meet
   └─> n8n processa transcrição
   └─> Extrai dados saúde + detecta se tem exame

3. BIFURCAÇÃO:
   
   A) TEM EXAME RECENTE
      └─> Status: PENDING_BLOOD_TEST
      └─> User vê: "Upload seu exame"
      └─> Upload → Firebase Storage
      └─> n8n processa exame (OCR + extração)
      └─> Status: PROCESSING_BLOOD_TEST
      └─> Auto-preenche HealthForm com dados do exame
      └─> Status: FILLING_HEALTH_FORM
      └─> User confirma/edita respostas
      └─> Status: AWAITING_MENU_FORM
      └─> Semana 3: User preenche menuForm
      └─> Status: FILLING_MENU_FORM
      └─> n8n gera cardápio + receitas
      └─> Status: ACTIVE
   
   B) NÃO TEM EXAME
      └─> Status: EXAM_REQUEST_SENT
      └─> n8n gera documento "Pedido de Exame"
      └─> Email enviado para médico com PDF
      └─> User vê: "Aguardando pedido do médico"
      └─> [Médico retorna com exame]
      └─> [Continua fluxo A]

4. ACTIVE (Acesso Completo)
   └─> Chat com IA guardiã
   └─> Ver receitas personalizadas
   └─> Ver histórico de exames
   └─> Ver progresso (gamificação)
   └─> Classificar alimentos
   └─> Gerar novas receitas
```

---

## 📋 Tarefas Ordenadas por Prioridade

### FASE 1: Conexão n8n + Uploads (Crítico)

#### Task 1.1: Setup n8n Webhooks
- [ ] Criar variáveis de ambiente Firebase Functions
  - `N8N_BASE_URL`
  - `N8N_WEBHOOK_SECRET`
- [ ] Testar comunicação Functions ↔ n8n com curl
- [ ] Documentar: `N8N_SETUP.md`

#### Task 1.2: Implementar processamento de transcrição
- [ ] Firebase Function: `processOnboardingTranscript()`
  - Recebe: transcriptText, driveFileUrl
  - Chama: n8n webhook `/4d-process-transcript`
  - Salva: extractedHealthData em Firestore
  - Atualiza: status do usuário
- [ ] Handlers de erro e retry logic
- [ ] Testes com dados reais do Google Meet

#### Task 1.3: Implementar processamento de exame
- [ ] Firebase Function: `processBloodTest()`
  - Recebe: file upload, exame type
  - Envia: n8n webhook `/4d-process-exam`
  - Parse: OCR + extração de valores
  - Auto-preenche: healthForm com glicose, HbA1c, etc
- [ ] Status updates: PROCESSING_BLOOD_TEST → FILLING_HEALTH_FORM

#### Task 1.4: Implementar geração de pedido de exame
- [ ] Firebase Function: `generateExamRequest()`
  - Recebe: uid, diagnostics
  - Cria: Google Doc template
  - Envia: via n8n para médico
  - Salva: link no Firestore

### FASE 2: Chat & Recipes (Core Product)

#### Task 2.1: Implementar chat com IA guardiã
- [ ] Firebase Function: `agentChatMessage()`
  - Recebe: mensagem do user
  - Context: perfil, health form, exame, recipes anteriores
  - Chama: n8n chat endpoint
  - Salva: chat history + awards XP
- [ ] UI: Chat screen com message history
- [ ] Real-time listeners no Firestore

#### Task 2.2: Implementar geração de receitas
- [ ] Firebase Function: `generateRecipe()`
  - Recebe: preferences, dietary restrictions
  - Chama: n8n recipe generator
  - Salva: em recipes collection
  - Awards: XP para "recipe_generated"
- [ ] UI: Cards de receitas com prepare time, ingredients, macros
- [ ] Filtros: por restrição, por tempo, por ingrediente

#### Task 2.3: Implementar classificação de alimentos
- [ ] Firebase Function: `evaluateFood()`
  - Recebe: foodName, quantity
  - Classifica: em verde/amarelo/vermelho
  - Retorna: macros, compatibilidade com diagnóstico
- [ ] UI: Food search input com autocomplete
- [ ] Real-time feedback

### FASE 3: Gamificação & Dashboard (Engajamento)

#### Task 3.1: Implementar XP visual
- [ ] Counter animado: XP atual + progress to next level
- [ ] Notificação quando completa ação (chat, recipe, etc)
- [ ] Histórico: o que fez hoje, essa semana, esse mês

#### Task 3.2: Implementar achievements modal
- [ ] Grid de conquistas (locked/unlocked)
- [ ] Animation ao desbloquear
- [ ] Share button para redes sociais

#### Task 3.3: Implementar ranking
- [ ] Firestore collection: `globalRanking`
- [ ] Atualização periódica (daily cron via n8n)
- [ ] UI: Top 10 + sua posição

### FASE 4: Integrações Externas (Análise)

#### Task 4.1: Google Sheets sync
- [ ] n8n workflow: sync dados do user para Google Sheets
- [ ] Profesional dashboard: ler planilha com dados agregados
- [ ] Triggers: quando user completa forms, semanal

#### Task 4.2: Notificações push
- [ ] Firebase Cloud Messaging setup
- [ ] Triggers: novo cardápio gerado, chat pendente, milestone XP
- [ ] Templates: por tipo de notificação

### FASE 5: Deployment & QA (Produção)

#### Task 5.1: GitHub Pages setup
- [ ] Configurar `gh-pages` branch
- [ ] Auto-deploy via GitHub Actions
- [ ] Custom domain (se aplicável)

#### Task 5.2: Segurança & Performance
- [ ] Firestore security rules (já documentadas?)
- [ ] Rate limiting n8n calls
- [ ] CDN caching para CSS/JS estático

#### Task 5.3: Testes E2E
- [ ] User flow: login → health form → chat → recipe
- [ ] Error cases: network error, timeout, validation
- [ ] Gamificação: XP tracking, level up, achievements

---

## 🗂️ Estrutura de Código por Implementação

### Arquivos a Criar/Modificar

```
assets/js/
├── config/
│   ├── n8n.js          [NOVO] Endpoints e payloads n8n
│   └── notifications.js [NOVO] Templates e triggers

├── services/
│   ├── firestore.js     [MODIFICAR] Adicionar gamificação listeners
│   ├── storage.js       [NOVO] Firebase Storage wrapper
│   ├── chat.js          [NOVO] Chat AI service
│   └── recipes.js       [NOVO] Recipe generation service

├── screens/
│   ├── chat.js          [NOVO] Chat screen com AI guardiã
│   ├── recipes.js       [NOVO] Recipe gallery + details
│   ├── food-search.js   [NOVO] Food classifier interface
│   ├── ranking.js       [NOVO] Leaderboard
│   ├── achievements.js  [NOVO] Achievements modal
│   └── exam-upload.js   [MODIFICAR] Adicionar processamento

└── utils/
    ├── gamification.js  [NOVO] XP tracking, level calculation
    └── notifications.js [NOVO] Toast/modal notifications

firebase/functions/
├── index.js             [MODIFICAR] Adicionar endpoints
├── recipes.js           [NOVO] Recipe logic
├── exams.js             [NOVO] Exam processing
├── chat.js              [NOVO] Chat logic
└── gamification.js      [NOVO] XP awards, ranking

_docs/
├── N8N_SETUP.md         [NOVO] Como configurar webhooks
├── IMPLEMENTATION.md    [NOVO] Logs de progresso
└── API_ENDPOINTS.md     [NOVO] Cloud Functions endpoints
```

---

## 📦 Dependências & Requisitos

### Firebase
- ✅ Authentication (Email/Senha) — já configurado
- ✅ Firestore (NoSQL) — já configurado
- ✅ Cloud Functions — já parcialmente implementado
- ✅ Cloud Storage — documentado, needs integration
- ⚠️ Cloud Messaging — opcional para notificações

### Serviços Externos
- n8n (autohosted ou cloud)
  - Workflows: Transcrição, Exame, Chat, Recipes, Food, Ranking
  - LLM: Claude Sonnet ou GPT-4
  - Google Drive: Para documentos
  - Google Sheets: Para sync dados

### Client Libraries
- ✅ firebase/app
- ✅ firebase/auth
- ✅ firebase/firestore
- firebase/storage (para upload exames)
- firebase/functions (para callable)

---

## ⚠️ Riscos & Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| n8n timeout em processamento de exame | Alta | Implementar polling + timeout handlers |
| Inconsistência de dados (user edita form enquanto IA processa) | Média | Adicionar field `lockedUntil` timestamp |
| XP desync em operações simultâneas | Baixa | Usar transaction em `awardXp()` |
| GitHub Pages rate limit (muitos requests) | Muito Baixa | Already on CDN |

---

## 📅 Timeline Sugerida

- **Semana 1**: FASE 1 (n8n + uploads)
- **Semana 2**: FASE 2 (chat + recipes)
- **Semana 3**: FASE 3 (gamificação)
- **Semana 4**: FASE 4 + 5 (integrações + deployment)

---

## 🔗 Documentação Relacionada

- [UPDATED_SCHEMA.md](UPDATED_SCHEMA.md) — Firestore structure
- [N8N_WORKFLOWS.md](N8N_WORKFLOWS.md) — Workflow payloads
- [FIREBASE_FUNCTIONS.md](FIREBASE_FUNCTIONS.md) — Cloud Functions
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — GitHub Pages setup
- [SECURITY_GUIDE.md](SECURITY_GUIDE.md) — Firestore rules + secrets

---

**Próximo Passo:** Começar com Task 1.1 - Setup n8n Webhooks
