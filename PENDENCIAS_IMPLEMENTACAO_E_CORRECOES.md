# PENDÊNCIAS_IMPLEMENTACAO_E_CORRECOES

Atualizado em: 2026-05-20
Branch: claude/review-project-context-1vSev

Este arquivo mantém apenas pendências reais após o deploy e a rodada final de QA/E2E.

## Resolvido neste ciclo

- [x] Erros críticos de auth no login
- [x] awardXp no frontend substituído por callable onCall
- [x] navItems carregados de appConfig
- [x] ajuste do notification center (posição + close 44x44)
- [x] chat bubbles padronizadas (usuário/IA)
- [x] refinamento de light theme no chat
- [x] suporte offline + service worker
- [x] QA v6 sem erros críticos/altos

## Pendências abertas (não bloqueantes)

1) Cloud Scheduler com 403 (2 jobs)
- Impacto: automações agendadas podem não executar.
- Ação recomendada:
  - revisar IAM da service account dos jobs
  - validar endpoint alvo/permissões de invocação
  - reexecutar testes de scheduler após ajuste

2) Dependência firebase-functions desatualizada
- Impacto: risco de incompatibilidades futuras e perda de correções.
- Ação recomendada:
  - atualizar pacote em firebase/functions
  - rodar smoke tests de callables e triggers
  - monitorar logs pós-deploy

3) Planejamento de runtime (Node 20 EOL em out/2026)
- Impacto: risco operacional no médio prazo.
- Ação recomendada:
  - definir janela de upgrade para runtime suportado
  - validar compatibilidade das Functions v2
  - executar regressão básica antes do rollout

## Critério para encerrar este documento

Encerrar quando os 3 itens acima estiverem resolvidos e validados em produção.
