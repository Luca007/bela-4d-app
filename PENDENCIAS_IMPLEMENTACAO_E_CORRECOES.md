# Pendencias de Implementacao e Correcao - Programa 4D

Data de referencia: 2026-05-08
Branch: claude/review-project-context-1vSev

## Escopo deste documento
Este documento consolida:
- O que foi implementado no ciclo atual.
- O que ainda falta implementar para fechar o plano combinado no chat.
- O que ainda falta corrigir/validar antes de producao.

## Ja implementado neste ciclo

### Frontend
- Integracao de notificacoes em tempo real por `pendingActions` no app:
  - toast por tipo de evento
  - marcacao de acao como `seen`
  - roteamento apos evento critico
- Award de XP diario no login (`awardDailyLoginXp`).
- Tela de cardapio conectada ao Firestore:
  - carrega dados salvos
  - permite editar horarios habilitados/desabilitados
  - salva formulario de cardapio
  - redireciona para dashboard ao concluir
- Chat com navegacao para receita via dashboard (`initialNav` + `recipeId`).
- Dashboard aceita navegacao inicial e receita inicial por parametro.
- Formulario de saude:
  - fallback de `uid` via sessao
  - validacao minima de campos obrigatorios e diagnosticos.

### Services
- `FirestoreService`:
  - URL de Functions agora usa `projectId` real do config.
  - novos metodos de gamificacao e eventos:
    - `awardDailyLoginXp`
    - `_updateStreak`
    - `unlockAchievement`
    - `getTopRanking`
    - `markActionSeen`
    - `onXpLogChange`

### Backend (Firebase Functions)
- Retry exponencial para chamadas n8n (`callN8nWithRetry`).
- Uso de retry em endpoints principais (`processOnboardingTranscript`, `generateExamRequest`, `agentChatMessage`, `generateRecipe`, `deleteRecipe`, `evaluateFood`).
- Endpoints HTTP de callback n8n -> Firebase:
  - `onTranscriptCallback`
  - `onBloodTestCallback`
- Validacao de segredo para webhook (`X-Webhook-Secret`).

### Infra Firebase e estrutura
- Arquivos de projeto Firebase adicionados:
  - `.firebaserc`
  - `firebase.json`
  - `firestore.rules`
  - `firestore.indexes.json`
- Estrutura inicial `n8n-workflows/README.md` para versionamento de fluxos.

## Pendencias de Implementacao (ainda falta)

### 1) Fluxos n8n e automacoes criticas
- Versionar os JSON reais de todos os workflows em `n8n-workflows/` (atualmente so README).
- Criar/validar workflow dedicado para notificacoes importantes via WhatsApp, com:
  - regras de prioridade (critico, alerta, informativo)
  - fallback e retentativa no provedor
  - log padronizado de entrega e falha
- Garantir contrato de payload unico entre Functions e n8n para todos os endpoints.

### 2) Fechamento de features da UI nova com backend real
- Revisar todas as telas novas e remover pontos ainda mockados (quando houver).
- Garantir persistencia completa de estados de comunidade (scroll/like/dislike) no Firestore.
- Completar conexao dos fluxos restantes com Firebase (inclusive watchers/eventos que ainda nao foram ligados).

### 3) Gamificacao end-to-end
- Validar distribuicao de XP sem duplicidade em todos os eventos de negocio.
- Sincronizar ranking global (`globalRanking`) com rotina de atualizacao consistente.
- Completar gatilhos de conquistas faltantes alem das atuais (7 dias e 30 dias).

### 4) Dados de teste e seed
- Seed completo de usuario de teste com:
  - perfil
  - onboarding
  - exames
  - chat
  - receitas
  - conquistas
  - notificacoes
  - pending actions
- Documentar payloads de seed e limpar dados fake antigos.

### 5) Hardening de producao
- Migrar segredos para `defineSecret`/Secret Manager em todas as Functions sensiveis.
- Revisar politicas de CORS, rate-limit e validacao de input nos callbacks HTTP.
- Adicionar observabilidade minima (logs estruturados, correlacao por requestId).

## Pendencias de Correcao / Validacao

### Critico
- Validar comportamento do drawer toggle (ainda listado como pendente).
- Corrigir consistencia do scroll e estado de like na comunidade (pendente).

### Alto
- Validar navegacao cruzada chat -> dashboard -> receita com dados reais de Firestore.
- Garantir que `pendingActions` nao gerem toasts duplicados em reconexao/reload.
- Revisar regras/indexes Firestore com queries reais de producao para evitar falha por indice ausente.

### Medio
- Revisar mensagens de erro e feedback de submit nos formularios para cenarios offline/timeout.
- Auditar ortografia/rotulos em constantes e textos de UI.

## Checklist final antes de deploy
- Executar fluxo completo: login -> onboarding -> exames -> formulario saude -> dashboard -> chat -> receitas.
- Rodar emuladores Firebase (auth/functions/firestore/hosting) com smoke tests.
- Validar callbacks n8n assinados com segredo correto.
- Revisar regras Firestore com usuario autenticado e nao autenticado.
- Confirmar rollout dos workflows n8n em ambiente alvo.

## Observacoes
- Este documento representa o estado atual do que foi combinado no chat e do que ja aparece implementado no branch.
- Conforme novos itens forem entregues, atualizar este arquivo para manter rastreabilidade de pendencias.
