#!/usr/bin/env node
/**
 * Reseta dados de uma conta de teste para simular usuário novo (zerada).
 *
 * Uso: node scripts/seed-fresh-user.js [--email=teste@gmail.com]
 *
 * O que faz:
 *   1. Autentica com email/senha
 *   2. Apaga TODOS os documentos do usuário (achievements, notifications,
 *      recipes, chat, forms, etc.)
 *   3. Reseta o documento principal `users/{uid}` para o estado de novo usuário
 *   4. Não dispara notificação de boas-vindas — `ensureUserDocument` no app
 *      vai criar quando o usuário fizer login pela primeira vez
 */

const https = require('https');

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => { const [k, v] = a.slice(2).split('='); return [k, v === undefined ? true : v]; })
);

const CONFIG = {
  apiKey: 'AIzaSyBPIZCJq9DVn8MT4hjkRRIuktOfUgW97yw',
  projectId: 'bela-4d-app',
  email: args.email || 'teste@gmail.com',
  password: args.password || 'Teste@01',
};

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function signIn() {
  const res = await request({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${CONFIG.apiKey}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: CONFIG.email, password: CONFIG.password, returnSecureToken: true });

  if (res.status !== 200) throw new Error(`Auth failed: ${JSON.stringify(res.body)}`);
  console.log(`[Auth] ${CONFIG.email} (uid: ${res.body.localId})`);
  return { idToken: res.body.idToken, uid: res.body.localId };
}

async function listDocs(idToken, collectionPath, pageSize = 100) {
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${collectionPath}?pageSize=${pageSize}`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  if (res.status === 404 || res.status === 200 && !res.body.documents) return [];
  return res.body.documents || [];
}

async function deleteDocByName(idToken, fullName) {
  // fullName is like: projects/.../documents/users/UID/notifications/abc123
  const path = fullName.replace(/^.*\/documents\//, '');
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  return res.status < 400;
}

async function deleteCollection(idToken, collectionPath) {
  let total = 0;
  while (true) {
    const docs = await listDocs(idToken, collectionPath, 100);
    if (!docs.length) break;
    for (const d of docs) {
      await deleteDocByName(idToken, d.name);
      total++;
    }
    if (docs.length < 100) break;
  }
  return total;
}

async function deleteUserDoc(idToken, uid) {
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/users/${uid}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${idToken}` },
  });
  return res.status < 400;
}

(async () => {
  try {
    const { idToken, uid } = await signIn();

    console.log(`\n[Reset] Apagando dados do usuário ${uid}...`);

    const subcollections = [
      'achievements', 'notifications', 'pendingActions', 'recipes',
      'chatHistory', 'foodEvaluations', 'bloodTests', 'examRequests',
      'sectionVisits', 'xpLog',
    ];

    let totalDeleted = 0;
    for (const sub of subcollections) {
      const path = `users/${uid}/${sub}`;
      const count = await deleteCollection(idToken, path);
      if (count > 0) {
        console.log(`  ✓ ${sub}: ${count} docs apagados`);
        totalDeleted += count;
      }
    }

    // Apagar documentos únicos das subcoleções 'data'
    const singletonPaths = [
      `users/${uid}/healthForm/data`,
      `users/${uid}/menuForm/data`,
      `users/${uid}/onboardingInterview/data`,
    ];
    for (const path of singletonPaths) {
      const res = await request({
        hostname: 'firestore.googleapis.com',
        path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${path}`,
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      if (res.status < 400) {
        console.log(`  ✓ ${path}: apagado`);
        totalDeleted++;
      }
    }

    // Apagar documento principal — `ensureUserDocument` recria no próximo login
    await deleteUserDoc(idToken, uid);
    console.log(`  ✓ users/${uid}: apagado`);

    console.log(`\n✅ Reset completo. ${totalDeleted + 1} documentos apagados.`);
    console.log(`   No próximo login, ensureUserDocument criará perfil zerado.`);
    console.log(`   Status inicial: awaiting_onboarding (vai cair na tela de onboarding)`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
})();
