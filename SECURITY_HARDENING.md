# Security Hardening — Bela 4D

Steps recomendados fora do código (Console GCP/Firebase). Não bloqueiam deploy, mas reduzem risco.

## 1. Restringir a Firebase Web API key

A chave em `assets/js/config/firebase.js` (`AIzaSy…W97yw`) é a **API key pública** do cliente — esperada pelo design do Firebase Web SDK. A segurança real vem das Firestore Rules + Firebase Auth + restrições da própria key.

Mesmo assim, hardening recomendado:

1. Abra https://console.cloud.google.com/apis/credentials?project=bela-4d-app
2. Edite a chave **"Browser key (auto created by Firebase)"**
3. Em **Application restrictions** → marque **HTTP referrers (web sites)** e adicione:
   - `https://bela-4d-app.web.app/*`
   - `https://bela-4d-app.firebaseapp.com/*`
   - `http://localhost:5000/*` (emulator)
   - qualquer custom domain de produção
4. Em **API restrictions** → marque **Restrict key** e selecione apenas:
   - Identity Toolkit API
   - Token Service API
   - Cloud Firestore API
   - Firebase Installations API
   - Firebase Management API (opcional)
   - Cloud Functions API (se chamadas client-side)
   - FCM Registration API (se push notifications)
5. **Save**.

Resultado: a chave continua pública, mas só funciona nos domínios listados e só para as APIs marcadas. Tentativas de uso fora desse escopo recebem 403.

## 2. Firestore Rules — checklist anual

Validar `firestore.rules` cobre:
- `users/{uid}` → `isOwner(uid)` ✓
- `users/{uid}/{sub}/{doc}` → `isOwner(uid)` ✓
- `appConfig/{docId}` → leitura autenticada, write false ✓ (admin via Cloud Functions)
- `globalRanking/{uid}` → leitura autenticada, write false ✓

Testes recomendados: `firebase emulators:exec --only firestore "npm run test:rules"` quando suite de testes for criada.

## 3. Cloud Functions Webhook secrets

Webhooks n8n callbacks usam `X-Webhook-Secret`. Confirme em produção que:
- `N8N_WEBHOOK_SECRET` está set via `firebase functions:config:set`
- Não está hardcoded em nenhum lugar do repo (já validado: 0 ocorrências)
- Rotacionar a cada 90 dias

## 4. App Check (opcional, recomendado em prod)

Em escala, ativar Firebase App Check com reCAPTCHA v3 para impedir uso da API key fora de browsers reais. Doc: https://firebase.google.com/docs/app-check/web/recaptcha-provider

## 5. Storage Rules

Quando `storage.rules` for definido (atualmente não está no repo):
- Negar leitura/escrita pública
- `match /users/{uid}/bloodTests/{file}` → `isOwner(uid) && request.resource.size < 20 * 1024 * 1024`
- Validar Content-Type (PDF, image/*)

## 6. Build-time secrets

Nenhum secret no client-side. Variáveis sensíveis ficam só em Cloud Functions config. ✓
