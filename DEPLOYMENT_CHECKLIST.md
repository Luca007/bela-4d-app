# DEPLOYMENT_CHECKLIST

Atualizado em: 2026-05-20
Escopo: checklist real pós-deploy do Bela 4D

## 1) Status atual (já concluído)

- [x] Hosting publicado em https://bela-4d-app.web.app
- [x] 19 Cloud Functions deployadas
- [x] Firestore Rules deployadas
- [x] Seed de usuários de teste concluído
- [x] QA v6 sem erros críticos/altos

## 2) Pré-requisitos de IAM (obrigatórios)

Garantir os bindings abaixo para a service account usada no deploy/execução:

- [x] Service Account User (`roles/iam.serviceAccountUser`)
- [x] Service Account Token Creator (`roles/iam.serviceAccountTokenCreator`)
- [x] Cloud Run Invoker (`roles/run.invoker`)
- [x] Eventarc Event Receiver (`roles/eventarc.eventReceiver`)
- [x] Cloud Billing API habilitada no projeto

Observação: ausência desses bindings tende a quebrar deploy/invocação de Functions v2 e fluxos acionados por Eventarc.

## 3) Comandos de deploy

Functions:

firebase deploy --only functions

Rules:

firebase deploy --only firestore:rules

Hosting:

firebase deploy --only hosting

## 4) Verificação pós-deploy

- [x] Funções críticas disponíveis (awardXp, claimAchievement e demais callables)
- [x] Regras de Firestore ativas
- [x] Login e navegação principal operacionais
- [x] Chat, receitas e ranking sem erros críticos
- [x] Fluxo offline com service worker ativo

## 5) Pendências não-bloqueantes atuais

- [ ] Cloud Scheduler 403 em 2 jobs
- [ ] Dependência firebase-functions desatualizada
- [ ] Planejar migração de Node 20 antes de out/2026
