# Bela 4D App

Aplicação web do Programa 4D para onboarding metabólico, acompanhamento diário, chat com IA, receitas e gamificação.

Produção: https://bela-4d-app.web.app
Branch de referência: claude/review-project-context-1vSev
Última atualização deste README: 2026-05-20

## Estado atual (pós deploy)

- Frontend publicado no Firebase Hosting
- 19 Cloud Functions deployadas (incluindo awardXp v2 onCall e claimAchievement)
- Firestore Rules deployadas (ruleset 4accf569-...)
- QA v6 concluído com 0 console errors, 0 page errors, 0 click failures (114 screenshots)
- E2E final (t_40a939e3): 0 CRITICAL, 0 HIGH
- Correções já integradas:
  - awardXp via Cloud Function onCall
  - navItems carregados via appConfig
  - toggle de tema no header
  - bolhas de chat L/R padronizadas
  - notification center reposicionado abaixo do header (close 44x44)
  - refinamentos de light theme no chat
  - suporte offline + service worker

## Stack

- Frontend: Vanilla JavaScript (ES Modules) + CSS
- Backend: Firebase (Auth, Firestore, Functions, Hosting)
- Integrações: n8n (webhooks), scripts de seed e QA
- Testes E2E/QA: Playwright

## Quickstart (dev local)

Pré-requisitos:
- Node.js 20+
- Firebase CLI

1) Instalar dependências

- Raiz do projeto:
  npm install

- Cloud Functions:
  cd firebase/functions
  npm install
  cd ../..

2) Rodar frontend local

python -m http.server 8000

Abrir: http://localhost:8000

3) Emulação Firebase (opcional para fluxo completo)

firebase emulators:start --only auth,functions,firestore,hosting

## Deploy

Frontend:

firebase deploy --only hosting

Functions:

firebase deploy --only functions

Rules:

firebase deploy --only firestore:rules

## Contas de teste seedadas

- teste-fresh@bela.com (awaiting_onboarding)
- teste-waiting@bela.com (waiting)
- teste@gmail.com (active, XP 1500, nível 3, 6 conquistas, 8 mensagens chat, 4 receitas)

## Pendências não-bloqueantes atuais

- Cloud Scheduler retornando 403 em 2 jobs
- Dependência firebase-functions desatualizada
- Planejar migração de Node 20 (EOL out/2026)

## Documentos-chave

- IMPLEMENTATION_PROGRESS.md
- DEPLOYMENT_CHECKLIST.md
- PROJECT_STATUS.md
- PENDENCIAS_IMPLEMENTACAO_E_CORRECOES.md
- CHANGELOG.md
