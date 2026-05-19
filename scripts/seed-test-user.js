#!/usr/bin/env node
/**
 * Seed test user data via Firebase REST API — ZERO dependencies
 * 
 * Usa a Firebase Auth REST API + Firestore REST API via service account.
 * Cria/atualiza o usuário de teste no Firestore com dados completos.
 * 
 * REQUISITO: Service Account JSON em ~/.firebase/bela-4d-app-service-account.json
 * 
 * USO:
 *   node scripts/seed-test-user.js [--reset]
 *   --reset: apaga e recria o usuário (default: idempotente, só atualiza)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ID = 'bela-4d-app';
const FIREBASE_API_KEY = 'AIzaSyBPIZCJq9DVn8MT4hjkRRIuktOfUgW97yw';
const TEST_EMAIL = 'teste@gmail.com';
const TEST_PASSWORD = 'Teste@01';
const TEST_UID = 'test_user_001'; // UID fixo para facilitar debug

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getAccessTokenFromSA(saJson) {
  return new Promise((resolve, reject) => {
    const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
    const now = Math.floor(Date.now() / 1000);
    const claim = base64url(Buffer.from(JSON.stringify({
      iss: saJson.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: saJson.token_uri || 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })));
    const unsigned = `${header}.${claim}`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsigned);
    const signature = base64url(sign.sign(saJson.private_key));
    const jwt = `${unsigned}.${signature}`;

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    const https = require('https');
    const req = https.request(saJson.token_uri || 'https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error(`Token error: ${data}`));
        } catch (e) { reject(new Error(`Parse error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(body.toString());
    req.end();
  });
}

function firestoreReq(token, method, docPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}${docPath}`);
    const opts = { method, headers: { Authorization: `Bearer ${token}` } };
    if (body) opts.headers['Content-Type'] = 'application/json';
    const https = require('https');
    const req = https.request(url, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Firebase Auth REST API — sign in to get ID token, then verify/create user in Firestore
function firebaseAuthReq(endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${FIREBASE_API_KEY}`);
    const data = JSON.stringify(body);
    const https = require('https');
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const reset = process.argv.includes('--reset');
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(process.env.HOME || '/root', '.firebase', 'bela-4d-app-service-account.json');

  if (!fs.existsSync(saPath)) {
    console.error('[SeedUser] ❌ Service account não encontrada:', saPath);
    console.error('   Gere em: https://console.cloud.google.com/iam-admin/serviceaccounts?project=bela-4d-app');
    process.exit(1);
  }

  const saJson = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  console.log('[SeedUser] Obtendo access token...');
  const token = await getAccessTokenFromSA(saJson);
  console.log('[SeedUser] ✅ Token obtido\n');

  // Step 1: Sign in / create test user via Firebase Auth REST API
  console.log(`[SeedUser] Autenticando ${TEST_EMAIL}...`);
  let idToken, localId;
  
  // Try sign in first
  const signInResp = await firebaseAuthReq('accounts:signInWithPassword', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    returnSecureToken: true,
  });

  if (signInResp.status === 200) {
    idToken = signInResp.body.idToken;
    localId = signInResp.body.localId;
    console.log(`[SeedUser] ✅ Login OK (uid: ${localId})`);
  } else if (signInResp.body?.error?.message === 'EMAIL_NOT_FOUND') {
    // Create user
    console.log('[SeedUser] Usuário não existe. Criando...');
    const signUpResp = await firebaseAuthReq('accounts:signUp', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      returnSecureToken: true,
    });
    if (signUpResp.status === 200) {
      idToken = signUpResp.body.idToken;
      localId = signUpResp.body.localId;
      console.log(`[SeedUser] ✅ Criado (uid: ${localId})`);
    } else {
      console.error('[SeedUser] ❌ Falha ao criar:', JSON.stringify(signUpResp.body));
      process.exit(1);
    }
  } else {
    console.error('[SeedUser] ❌ Erro auth:', JSON.stringify(signInResp.body));
    process.exit(1);
  }

  // Step 2: Write user document via Firestore REST (admin access)
  const userData = {
    fields: {
      email:  { stringValue: TEST_EMAIL },
      name:   { stringValue: reset ? '' : 'Teste Usuária' },
      status: { stringValue: 'awaiting_onboarding' },
      xp:     { integerValue: 0 },
      level:  { integerValue: 1 },
      streak: { integerValue: 0 },
      onboardingCompleted: { booleanValue: false },
      createdAt: { timestampValue: new Date().toISOString() },
    }
  };

  if (reset) {
    // Delete and recreate
    console.log('[SeedUser] 🗑️ Reset — apagando dados existentes...');
    await firestoreReq(token, 'DELETE', `/users/${localId}`);
    // Delete subcollections
    const subs = ['onboardingInterview','healthForm','menuForm','formProgress','bloodTests','examRequests','examTracking','chatHistory','recipes','foodEvaluations','notifications','pendingActions','achievements','xpLog','xpEvents'];
    for (const sub of subs) {
      await firestoreReq(token, 'DELETE', `/users/${localId}/${sub}`);
    }
    console.log('[SeedUser] 🗑️ Dados antigos removidos');
  }

  console.log(`[SeedUser] Gravando perfil (status: awaiting_onboarding)...`);
  const resp = await firestoreReq(token, 'PATCH', `/users/${localId}`, userData);
  
  if (resp.status === 200 || resp.status === 201) {
    console.log('[SeedUser] ✅ Perfil criado/atualizado');
  } else {
    console.error(`[SeedUser] ❌ Erro: HTTP ${resp.status}: ${resp.body}`);
    process.exit(1);
  }

  console.log('\n[SeedUser] ✅ Pronto!');
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Senha: ${TEST_PASSWORD}`);
  console.log(`   UID: ${localId}`);
  console.log(`   Status: awaiting_onboarding (verá tela de agendamento após login)`);
  console.log('\n   Fluxo esperado:');
  console.log('   1. Login → Onboarding (4 passos) → Agendamento de reunião');
  console.log('   2. Após agendar → Aguardando confirmação da Guardiã');
  console.log('   3. Guardiã marca reunião como concluída → Dashboard');
}

main().catch(e => { console.error(e); process.exit(1); });
