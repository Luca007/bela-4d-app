# Firestore Security Rules — Guia de Deploy e Decisões

**Última revisão:** 2026-05-19 · Branch: `claude/review-project-context-1vSev`
**Bug raiz que motivou esta revisão:** 8 `Missing or insufficient permissions` em `appConfig/*` no primeiro login (ver `BUG_REPORT_2026-05-19.md` §2.1).

---

## 1. Por que as regras antigas estavam quebrando o app

As regras atualmente em produção (que você colou):

```javascript
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
  match /onboarding/...   { allow read, write: if request.auth.uid == uid; }
  match /chatHistory/...  { allow read, write: if request.auth.uid == uid; }
  match /recipes/...      { allow read, write: if request.auth.uid == uid; }
  match /achievements/... { allow read: if request.auth.uid == uid; allow write: if false; }
  match /{document=**}    { allow read, write: if request.time < timestamp.date(2026, 6, 4); }
}
```

### Problemas
| # | Problema | Impacto |
|---|---|---|
| 1 | **Sem rule para `appConfig`** | 8 erros `getAppConfig(levels|xpEvents|achievementsCatalog|navItems|dicas|refeicoes|ranking|recipes)` toda vez que alguém loga. Dashboard cai em fallback hardcoded. |
| 2 | **Sem rule para `globalRanking`** | Ranking público quebrado. |
| 3 | **Bypass por data (`< 2026-06-04`)** | **Bomba-relógio**: em 4 jun 2026 (16 dias) TODA escrita falha. |
| 4 | Subcoleções faltando explicitamente | `bloodTests`, `examRequests`, `notifications`, `pendingActions`, `xpLog`, etc. caem no wildcard frágil. |
| 5 | `getTopRanking` queries `users` collection | Lista todos os usuários — listagem nesse nível falha (não tem `list` permission) e expõe e-mails se permitida. |

---

## 2. Solução: regras definitivas

Já estão escritas em `firestore.rules` na raiz do repo. Resumo da arquitetura:

```
/appConfig/{docId}              → read: signed-in · write: ❌ (só Admin SDK / Cloud Functions)
/globalRanking/{uid}            → read: signed-in · write: ❌ (mantido por Function)
/users/{uid}                    → read/write: owner
  /onboardingInterview          → read/write: owner
  /healthForm /menuForm         → read/write: owner
  /formProgress                 → read/write: owner
  /bloodTests /examRequests     → read/write: owner
  /examTracking                 → read/write: owner
  /chatHistory                  → read/write: owner
  /recipes                      → read/write: owner
  /foodEvaluations              → read/write: owner
  /notifications /pendingActions→ read/write: owner
  /achievements                 → read: owner · write: ❌  (Function-only)
  /xpLog /xpEvents              → read: owner · write: ❌  (Function-only)
```

### Decisões de segurança
1. **`appConfig` é leitura pública para autenticados** — não tem dados sensíveis, é só catálogo (níveis, conquistas, navItems, etc.). Sem isso, o app não renderiza ao logar.
2. **`achievements`, `xpLog`, `xpEvents` são write-protected** — impede o usuário de auto-conceder XP. Functions usam Admin SDK que ignora rules.
3. **Sem mais bypass por data** — removida a bomba-relógio `2026-06-04`.
4. **Subcoleções explícitas** — cada coleção que o código usa tem rule própria. Mais legível e auditável que wildcard.

---

## 3. Novo usuário: como o fluxo funciona

> **Importante:** o app **não tem signup** — só `signInWithEmailAndPassword`. Usuários são criados externamente (Firebase Console, Cloud Function de onboarding via Guardiã, ou Admin SDK). As regras suportam o fluxo abaixo:

1. **Conta criada externamente** (Firebase Auth) → usuário recebe credenciais.
2. **Primeiro login** → `signInWithEmailAndPassword` autentica. `request.auth.uid` passa a existir.
3. **`app.js:259` chama `ensureUserDocument(uid, email)`** que:
   - Tenta `getDoc(users/{uid})` — passa pela rule `allow read: if isOwner(uid)` ✅
   - Se não existe, faz `setDoc(users/{uid}, initialData)` com `status: 'awaiting_onboarding'` — passa por `allow write: if isOwner(uid)` ✅
   - Cria também 1ª notificação em `users/{uid}/notifications/{auto-id}` ✅
4. **App pré-carrega `appConfig/*`** — passa pela rule de leitura signed-in ✅
5. **Roteamento** baseado em `status` → `AwaitingScreen` (ou onde for) renderiza.

Sem ajustes adicionais necessários para novos usuários — as regras suportam tudo.

---

## 4. Deploy

```bash
cd /home/luca/bela-4d-app

# 1. Validar localmente (opcional, requer firebase emulator)
# firebase emulators:start --only firestore

# 2. Deploy
firebase deploy --only firestore:rules

# 3. Verificar
firebase firestore:rules:get
```

Após deploy, validar no navegador:
1. Logar com `teste@gmail.com`.
2. Abrir DevTools → Console.
3. Confirmar que NÃO aparece mais `Missing or insufficient permissions` em `getAppConfig(*)`.

---

## 5. Pendência relacionada (não bloqueia deploy das rules)

**`getTopRanking()` em `firestore.js:1111`** ainda lê `collection('users')` com `orderBy('xp')`. Isso falha com estas regras (não há `list` permission em `/users`). Duas opções:

| Opção | Trade-off |
|---|---|
| **A. Refatorar para usar `globalRanking`** (recomendado) — manter uma Cloud Function `updateGlobalRanking` que escreve em `/globalRanking/{uid}` sempre que XP muda. Front lê só dessa collection. | Não expõe e-mail/dados sensíveis; precisa criar a Function. |
| **B. Adicionar `match /users/{uid} { allow list: if isSignedIn(); }`** | Expõe todos os campos do users/{uid} (inclui email, profile) para qualquer autenticado. ❌ |

**Recomendação: A.** Já há rule prontas para `globalRanking`; só falta o código.

---

## 6. Checklist após deploy

- [ ] `firebase deploy --only firestore:rules` rodou sem erro
- [ ] Login com `teste@gmail.com` carrega dashboard sem erros de permissão no console
- [ ] Conquistas + XP funcionam (via Cloud Functions, não direto do client)
- [ ] Ranking exibe (após implementar opção A acima)
- [ ] Notificação de boas-vindas aparece para novo usuário
