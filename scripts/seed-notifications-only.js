#!/usr/bin/env node
/**
 * Seed only notifications for teste@gmail.com
 * Uses the existing firestore helper pattern from seed-3-states.js
 */
const https = require('https');

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v === undefined ? true : v];
  })
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

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(val).filter(([, v]) => v !== undefined).map(([k, v]) => [k, toFirestoreValue(v)])
        ),
      },
    };
  }
  return { stringValue: String(val) };
}

function toFirestoreDoc(obj) {
  return { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toFirestoreValue(v)])) };
}

async function addDoc(idToken, collectionPath, obj) {
  const opts = {
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${collectionPath}`,
    method: 'POST',
    headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  };
  const res = await request(opts, toFirestoreDoc(obj));
  if (res.status >= 400) {
    console.error(`  ❌ POST ${collectionPath} failed (${res.status}): ${JSON.stringify(res.body).slice(0, 200)}`);
    return null;
  }
  return res.body;
}

const NOW = new Date();
function daysAgo(n) { return new Date(NOW - n * 86400000).toISOString(); }

(async () => {
  try {
    const { idToken, uid } = await signIn();
    const U = (subPath) => `users/${uid}/${subPath}`;

    console.log('\n📬 Seed de Notificações Estendidas');
    console.log(`   UID: ${uid}\n`);

    const notifications = [
      { title: '🦉 Conquista desbloqueada: Coruja Noturna', message: 'Parabéns! Você acessou entre 23h e 5h em 3 dias diferentes! +75 XP', type: 'achievement-unlocked', priority: 'high', read: false, channel: 'app', createdAt: daysAgo(7) },
      { title: '🧪 Exame pronto para coleta', message: 'Seu pedido de exames de sangue está liberado. Compareça ao laboratório.', type: 'exame-ready', priority: 'urgent', read: false, channel: 'app', createdAt: daysAgo(6) },
      { title: '💬 Nova mensagem da Guardiã', message: 'Sua Guardiã de Saúde enviou uma nova mensagem sobre seu progresso semanal.', type: 'chat-new-message', priority: 'normal', read: false, channel: 'app', createdAt: daysAgo(4) },
      { title: '📊 Relatório Semanal disponível', message: 'Seu relatório de progresso da semana já está pronto. Veja suas conquistas!', type: 'weekly-report', priority: 'normal', read: false, channel: 'app', createdAt: daysAgo(2) },
      { title: '⭐ Subiu para o Nível 4!', message: '+200 XP! Você desbloqueou o título Mestra da Saúde. Continue assim! 🎉', type: 'level-up', priority: 'urgent', read: false, channel: 'app', createdAt: daysAgo(1) },
      { title: '📋 Exame de sangue disponível', message: 'Resultado do exame recente já disponível para visualização.', type: 'exame-ready', priority: 'high', read: false, channel: 'app', createdAt: daysAgo(0) },
    ];

    let ok = 0;
    for (const n of notifications) {
      const result = await addDoc(idToken, U('notifications'), n);
      if (result) { ok++; console.log(`  ✅ ${n.type}: ${n.title}`); }
    }

    console.log(`\n📬 ${ok}/${notifications.length} notificações adicionadas.`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
})();
