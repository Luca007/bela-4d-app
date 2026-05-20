# CHANGELOG

## 2026-05-19

Resumo dos 17 commits publicados no ciclo de estabilização/deploy (branch `claude/review-project-context-1vSev`).

### feat

- `cd8e100` feat(functions): awardXp como onCall + remover write direto do frontend
- `381a458` feat(C1): offline support - connection indicator, loading states, queue integration, service worker
- `4af2496` feat: add theme toggle button to header (previously only in drawer)

### fix

- `d6da4f6` fix(auth): normalize email no login e evitar log crítico para credenciais inválidas esperadas
- `2a63eac` fix(auth): serialize login attempts and throttle rapid retries
- `18da234` fix(login): prevent duplicate auth attempts on submit
- `a93dac8` fix(notification): reposicionar painel abaixo header + close button 44x44
- `20b2e59` fix(ranking): getTopRanking lê de globalRanking + safe-map em dashboard-v2
- `f60826b` fix: define dashSkeleton in dashboard-v2 modules (QA bug LOW)
- `19bade1` fix(critical): await aiLoading em processBloodTest, generateRecipe, evaluateFood
- `8f97bed` fix(dashboard): adicionar import ConnectionIndicator + bump SW cache
- `cc6be94` fix(functions): sync seedAppConfig achievements with ACHIEVEMENTS_CATALOG + remove duplicate badges
- `606c03f` fix: remove GA4 analytics to eliminate g/collect ERR_ABORTED warnings

### refactor

- `4184253` refactor(chat): bubbles left/right with .chat-message--ai/--user classes
- `736ba54` refactor(C2): navItems via Firestore appConfig

### style

- `c112c18` style(chat): refine light theme — bubbles, header, input, scrollbar (WCAG AA)

### chore

- `b2448e3` chore: gitignore + scripts auxiliares de seed/QA

## Notas

- Este changelog cobre o pacote de 17 commits citado no fechamento da rodada.
- Estado validado por QA v6 e E2E final sem issues CRITICAL/HIGH.
