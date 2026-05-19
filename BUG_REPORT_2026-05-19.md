# Bela 4D — Bug Report (Sessão 2026-05-19)

Branch: `claude/review-project-context-1vSev`
Kanban task: `t_f617e1eb`
Conta teste: `teste@gmail.com / Teste@01`
Servidor local: `python3 -m http.server 8090` em `127.0.0.1`
Screenshots: `/tmp/app-screenshots/`
Audit raw: `/tmp/app-audit/` (`console.json`, `network.json`, `pageerrors.json`, `summary.md`)

---

## 1. Bugs visuais (críticos)

### 1.1 Toasts de "Conquista +XP" empilham e cobrem o dashboard inteiro
Severidade: **CRITICAL**
Evidência: `/tmp/app-screenshots/03-after-login-mobile.png`, `12-dashboard-desktop.png`, `13-dashboard-desktop-fullpage.png`
Comportamento observado: ao logar com `teste@gmail.com`, são disparados ~6 toasts de conquista
("+80 XP", "+100 XP", "+75 XP", "+50 XP", "+100 XP", "+100 XP") simultaneamente. No mobile eles
ocupam o viewport inteiro; no desktop ficam na coluna direita encobrindo as ações do header.
Hipótese: lógica de unlock retroativo dispara TODOS os achievements pendentes no primeiro login,
sem rate-limit/queue/stagger e sem dismiss automático.
Onde olhar:
- `assets/js/screens/dashboard-v2.js` — busca por `showAchievementToast`/`xp-popup` e o loop de
  pendingActions/notifications.
- `assets/js/services/firestore.js:1080` — `claimAchievement` (chamada do dashboard:1152).
Sugestão: limitar a 1 toast por vez; usar fila com auto-dismiss em ~3s; agrupar conquistas
disparadas no mesmo tick em um único "+X XP combinado".

### 1.2 Toast verde "Bem-vinda!" cobre o header
Evidência: `03-after-login-mobile.png` — toast `.toast-success` sobreposto sobre o título "Guia
Metabólico Personalizado" e o avatar.
Sugestão: posicionar abaixo do header ou usar `safe-area-inset-top`.

---

## 2. Console errors (17 erros, 0 warnings, 0 JS page errors)

### 2.1 Firestore: `Missing or insufficient permissions` em **TODOS** os `getAppConfig`
Severidade: **CRITICAL**
Erros (mobile + desktop):

```
[Firestore] getAppConfig(levels):             FirebaseError: Missing or insufficient permissions.
[Firestore] getAppConfig(xpEvents):           ...
[Firestore] getAppConfig(achievementsCatalog):...
[Firestore] getAppConfig(navItems):           ...
[Firestore] getAppConfig(dicas):              ...
[Firestore] getAppConfig(refeicoes):          ...
[Firestore] getAppConfig(ranking):            ...
[Firestore] getAppConfig(recipes):            ...
```

O frontend pré-carrega 8 docs (`assets/js/services/firestore.js:1212`) logo após o login.
`firestore.rules:13-16` permite `read` em `appConfig/{docId}` se `isSignedIn()`. Mesmo assim
TODAS as leituras são bloqueadas → significa um destes três:
1. As regras locais **não estão deployadas** (regras em produção bloqueiam) — verificar
   `firebase deploy --only firestore:rules`.
2. O usuário teste **não está realmente autenticado** após o submit (a UI mostra dashboard, mas
   `request.auth` é nulo em runtime — pode acontecer se há erro silencioso no Auth e a UI usa
   estado local em cache).
3. Os documentos não existem na collection `appConfig` — porém aí o erro seria "not found",
   não "permission denied". Descartado.

Impacto: o dashboard renderiza sem dados de gamificação, ranking, dicas etc. — provavelmente
caindo em fallback hardcoded do `constants.js`.

### 2.2 GA4 (`google-analytics.com/g/collect`) — `ERR_ABORTED`
Severidade: low
Apenas analytics; provavelmente bloqueado por content-security ou política do Chromium headless.
Não afeta funcionalidade.

---

## 3. Auditoria n8n workflows ↔ Firebase Functions

Frontend chama Functions via `httpsCallable` (`assets/js/services/n8n.js`). As Functions ficam
em `firebase/functions/index.js` e proxyiam para webhooks n8n em
`{N8N_BASE_URL}/{path}`. Mapeamento:

| Frontend (`n8nService.*`)     | Function (`exports.*`)            | n8n webhook path              | Workflow JSON                       |
|--------------------------------|------------------------------------|--------------------------------|--------------------------------------|
| `processOnboardingTranscript`  | `processOnboardingTranscript`     | `4d-process-transcript`        | `01-meet-processor.json` ✅          |
| `processBloodTest`             | `processBloodTest`                | `4d-process-blood-test`        | `02-exam-processor.json` ✅          |
| `generateExamRequest`          | `generateExamRequest`             | `4d-generate-exam-request`     | `06-exam-request-generator.json` ✅  |
| `sendChatMessage`              | `agentChatMessage`                | `4d-agent-chat`                | `03-chat-processor.json` ✅          |
| `generateRecipe`               | `generateRecipe`                  | `4d-generate-recipe`           | `04-recipe-generator.json` ⚠️ ver 3.1|
| `deleteRecipe`                 | `deleteRecipe`                    | `4d-delete-recipe`             | **AUSENTE** ❌                       |
| `evaluateFood`                 | `evaluateFood`                    | `4d-evaluate-food`             | `05-food-classifier.json` ✅         |
| `downloadExamPdf`              | `downloadExamPdf`                 | (n8n path não confirmado)      | **AUSENTE** ❌                       |
| —                              | `sendPatientNotification`         | `4d-send-whatsapp-notification`| `07-whatsapp-notifications.json` ✅  |

### 3.1 [BUG] Workflow 04 chama Function inexistente `saveRecipe`
Severidade: **HIGH**
`n8n-workflows/04-recipe-generator.json:91` aponta para `${FIREBASE_FUNCTIONS_URL}/saveRecipe`,
mas `firebase/functions/index.js` **não exporta** `saveRecipe`. O nó "HTTP Request: Save
Recipe" sempre falhará (continueOnFail=true esconde o erro).
Consequência: receitas geradas pelo workflow 04 não passam pelo callback de save — porém o
próprio `generateRecipe` Function (linhas 449-456) já salva a receita após receber o `result`
do n8n. Logo é caminho duplicado / dead code.
Correção: remover o nó "HTTP Request: Save Recipe" OU criar `exports.saveRecipe` e remover
a escrita no `generateRecipe`.

### 3.2 [BUG] Workflow `4d-delete-recipe` referenciado mas não existe
Severidade: **HIGH**
`firebase/functions/index.js:491` chama `callN8nWithRetry('4d-delete-recipe', …)` mas não
existe arquivo `n8n-workflows/*delete*.json`.
Consequência: deletar receita falhará no Function com timeout/404 do n8n. Como `deleteRecipe`
Function não tem fallback de delete local, a receita não some.

### 3.3 [BUG] `downloadExamPdf` Function sem workflow correspondente
Severidade: medium
Function existe (`index.js:595`) e é exposta no frontend; precisa confirmar qual webhook n8n
ela invoca (não está em nenhum dos 7 JSONs). Pode ser orfã.

### 3.4 [INFO] Duplicação intencional/redundante
Não é bug, mas confunde a leitura do código:
- `claimAchievement`: Function existe (`index.js:518`) e frontend tem versão direta
  (`firestore.js:1080`). O dashboard usa a **direta** (`dashboard-v2.js:1152`). A Function
  parece dead code.
- `recordSectionVisit`: idem — Function existe e frontend tem versão Firestore-direta.
- `sendPatientNotification`: Function existe; frontend não chama. Provavelmente é invocada por
  triggers/schedulers (`onUserStatusUpdated`, `evaluateTimeBasedAchievements`).
Sugestão: remover Functions duplicadas OU consolidar tudo via Functions (mais seguro do ponto
de vista de rules).

### 3.5 [INFO] Workflow 07 (WhatsApp) escreve direto no Firestore via REST
`n8n-workflows/07-whatsapp-notifications.json` faz `PATCH
firestore.googleapis.com/v1/projects/.../documents/users/{uid}/notifications/...` com auth
genérica. Funciona se o service account está configurado, mas bypassa as regras (admin auth).
OK desde que o secret esteja protegido.

---

## 4. Interações não-cobertas pelo script

O script tentou clicar `[data-nav="home|receitas|conquistas|perfil|chat"]`, porém o dashboard
real usa `[data-nav-item="..."]` dentro de um drawer que precisa ser aberto via
`[data-open-drawer]` antes (`dashboard-v2.js:804,974`). Por isso as screenshots `04-08` não
foram geradas. Próxima iteração do script deve:

1. Clicar `[data-open-drawer]` primeiro.
2. Listar `[data-nav-item]` reais (lidos de Firestore `appConfig/navItems` — atualmente vazio
   por causa do bug 2.1, então provavelmente vem do fallback em `constants.js`).
3. Aguardar fim das animações de toast antes de capturar para evitar overlap.

---

## 5. Recomendações prioritárias

| # | Severidade | Ação | Owner sugerido |
|---|------------|------|----------------|
| 1 | CRITICAL  | Implantar `firestore.rules` (`firebase deploy --only firestore:rules`) e validar que `teste@gmail.com` autentica de fato (logar `auth.currentUser` no console) | backend |
| 2 | CRITICAL  | Limitar fila de toasts no dashboard: máx 1 ativo, auto-dismiss 3s, agrupar conquistas simultâneas | frontend |
| 3 | HIGH      | Decidir entre remover nó "Save Recipe" do workflow 04 OU criar `exports.saveRecipe` | backend |
| 4 | HIGH      | Criar workflow `04b-delete-recipe.json` OU mudar `deleteRecipe` Function para escrita Firestore-direta | backend |
| 5 | MEDIUM    | Confirmar destino do webhook `downloadExamPdf` ou marcar Function como deprecated | backend |
| 6 | MEDIUM    | Atualizar script de screenshots para usar `[data-nav-item]` e abrir drawer antes | qa |
| 7 | INFO      | Remover Functions duplicadas (`claimAchievement`, `recordSectionVisit`) ou migrar frontend pra usá-las | refactor |
| 8 | INFO      | Reposicionar toast "Bem-vinda" abaixo do header | frontend |

---

## Anexos
- Screenshots: `/tmp/app-screenshots/` (6 imagens, mobile + desktop)
- Console raw: `/tmp/app-audit/console.json` (57 entradas, 17 erros)
- Network raw: `/tmp/app-audit/network.json` (2 falhas)
- Page errors: `/tmp/app-audit/pageerrors.json` (0)
- Summary auto: `/tmp/app-audit/summary.md`
