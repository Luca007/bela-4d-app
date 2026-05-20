# PROJECT_STATUS

Atualizado em: 2026-05-20
Branch: claude/review-project-context-1vSev
Commit de referência: b2448e3

## Status executivo

Deploy técnico concluído. Projeto em fase de aprovação visual final.

## Estado atual

- Produção online: https://bela-4d-app.web.app
- Cloud Functions: 19 deployadas
- Firestore Rules: deployadas
- Usuários seedados: 3 contas de teste em estados distintos
- QA v6: 0 erros de console/página/click
- E2E final: 0 CRITICAL, 0 HIGH

## O que foi resolvido no ciclo

- auth/invalid-credential CRITICAL no fluxo de login esperado
- migração de awardXp para callable onCall
- navItems via appConfig
- ajustes de UX: tema, chat bubbles, notification center
- offline support + service worker

## Risco residual (não bloqueante)

- Cloud Scheduler 403 (2 jobs)
- Tech debt de dependências (firebase-functions)
- Janela de planejamento para Node 20 EOL (out/2026)

## Próxima decisão

Aguardar aprovação visual/humana final para fechar o ciclo e seguir com backlog de tech debt.
