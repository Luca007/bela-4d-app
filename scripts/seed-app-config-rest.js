#!/usr/bin/env node
/**
 * Seed appConfig via Firebase REST API — ZERO dependencies
 * 
 * REQUISITO: Service Account JSON key
 *   Gere em: https://console.cloud.google.com/iam-admin/serviceaccounts?project=bela-4d-app
 *   Salve como: ~/.firebase/bela-4d-app-service-account.json
 * 
 * USO:
 *   node scripts/seed-app-config-rest.js
 * 
 * Ou com caminho customizado:
 *   GOOGLE_APPLICATION_CREDENTIALS=/caminho/key.json node scripts/seed-app-config-rest.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ID = 'bela-4d-app';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Service Account JWT ─────────────────────────────────────────────────────

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

    const tokenUrl = saJson.token_uri || 'https://oauth2.googleapis.com/token';
    const https = require('https');
    const req = https.request(tokenUrl, {
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
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body.toString());
    req.end();
  });
}

// ─── Firestore REST helpers ───────────────────────────────────────────────────

function firestoreReq(token, method, docPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE}${docPath}`);
    const opts = {
      method,
      headers: { Authorization: `Bearer ${token}` },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
    }
    const https = require('https');
    const req = https.request(url, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const CONFIGS = {
  levels: { data: [
    { level:1, title:'Iniciante', name:'Iniciante', shortName:'Inic.', minXp:0, maxXp:499, color:'#8a8aa0', emoji:'🌱', icon:'🌱', rarity:'common' },
    { level:2, title:'Aprendiz', name:'Aprendiz', shortName:'Apr.', minXp:500, maxXp:1199, color:'#10b981', emoji:'🌿', icon:'🌿', rarity:'common' },
    { level:3, title:'Comprometida', name:'Comprometida', shortName:'Comp.', minXp:1200, maxXp:2199, color:'#38bdf8', emoji:'💪', icon:'💪', rarity:'uncommon' },
    { level:4, title:'Disciplinada', name:'Disciplinada', shortName:'Disc.', minXp:2200, maxXp:3399, color:'#a78bfa', emoji:'🔥', icon:'🔥', rarity:'uncommon' },
    { level:5, title:'Consistente', name:'Consistente', shortName:'Consis.', minXp:3400, maxXp:4799, color:'#f59e0b', emoji:'⭐', icon:'⭐', rarity:'rare' },
    { level:6, title:'Referência', name:'Referência', shortName:'Ref.', minXp:4800, maxXp:6499, color:'#f43f5e', emoji:'🏆', icon:'🏆', rarity:'rare' },
    { level:7, title:'Elite 4D', name:'Elite 4D', shortName:'Elite', minXp:6500, maxXp:8499, color:'#14b8a6', emoji:'💎', icon:'💎', rarity:'epic' },
    { level:8, title:'Mestra 4D', name:'Mestra 4D', shortName:'Mestra', minXp:8500, maxXp:99999, color:'#eab308', emoji:'👑', icon:'👑', rarity:'legendary' },
  ]},
  achievementsCatalog: { data: [
    { id:'first_step', title:'Primeiro Passo', description:'Completar onboarding', xp:100, icon:'🎉', condition:{ event:'ONBOARDING_COMPLETED' } },
    { id:'organized', title:'Organizado', description:'Preencher todos os 5 formulários', xp:200, icon:'📋', condition:{ event:'ALL_FORMS_COMPLETED' } },
    { id:'scientist', title:'Cientista', description:'Upload do primeiro exame', xp:50, icon:'🔬', condition:{ event:'FIRST_EXAM_UPLOADED' } },
    { id:'chef_formation', title:'Chef em Formação', description:'Gerar 3 receitas', xp:75, icon:'👨‍🍳', condition:{ event:'RECIPES_GENERATED', count:3 } },
    { id:'chef_confirmed', title:'Chef Confirmado', description:'Gerar 10 receitas', xp:150, icon:'🍽️', condition:{ event:'RECIPES_GENERATED', count:10 } },
    { id:'conversationalist', title:'Conversador', description:'Enviar 10 mensagens no chat', xp:50, icon:'💬', condition:{ event:'CHAT_MESSAGES', count:10 } },
    { id:'consistent', title:'Consistente', description:'Login por 7 dias seguidos', xp:100, icon:'📅', condition:{ event:'STREAK_DAYS', count:7 } },
    { id:'iron_fire', title:'Ferro e Fogo', description:'Login por 30 dias seguidos', xp:500, icon:'🔥', condition:{ event:'STREAK_DAYS', count:30 } },
    { id:'explorer', title:'Explorador', description:'Usar Avaliador Alimentar 5 vezes', xp:75, icon:'🧭', condition:{ event:'FOOD_EVALUATIONS', count:5 } },
    { id:'top_10', title:'Comunidade Top 10', description:'Entrar no top 10 do ranking', xp:200, icon:'🏆', condition:{ event:'TOP_RANKING', rank:10 } },
    { id:'veteran', title:'Veterano', description:'90 dias de conta ativa', xp:1000, icon:'🎖️', condition:{ event:'ACCOUNT_AGE_DAYS', count:90 } },
    { id:'gmp_master', title:'Mestre GMP', description:'Atingir nível 5', xp:1000, icon:'👑', condition:{ event:'LEVEL_REACHED', level:5 } },
  ]},
  xpEvents: { data: [
    { event:'DAILY_LOGIN', xp:10, description:'Login diário' },
    { event:'ONBOARDING_COMPLETED', xp:100, description:'Completar onboarding' },
    { event:'CHAT_MESSAGE', xp:5, description:'Mensagem no chat' },
    { event:'FOOD_EVALUATED', xp:15, description:'Avaliar alimento' },
    { event:'RECIPE_SAVED', xp:20, description:'Receita salva' },
    { event:'FORM_COMPLETED', xp:50, description:'Formulário completo' },
    { event:'ACHIEVEMENT_CLAIMED', xp:0, description:'Conquista reivindicada (XP via achievement config)' },
    { event:'COMMUNITY_LIKE', xp:2, description:'Like na comunidade' },
    { event:'STREAK_MILESTONE_7', xp:50, description:'Streak de 7 dias' },
    { event:'STREAK_MILESTONE_30', xp:200, description:'Streak de 30 dias' },
  ]},
  navItems: { data: [
    { id:'inicio', label:'Início', icon:'🏠', section:'inicio' },
    { id:'evolucao', label:'Evolução', icon:'📈', section:'evolucao' },
    { id:'comunidade', label:'Comunidade', icon:'👥', section:'comunidade' },
    { id:'receitas', label:'Receitas', icon:'🍽️', section:'receitas' },
    { id:'exames', label:'Exames', icon:'🔬', section:'exames' },
    { id:'conquistas', label:'Conquistas', icon:'🏆', section:'conquistas' },
    { id:'perfil', label:'Perfil', icon:'👤', section:'perfil' },
  ]},
  recipes: { data: [
    { id:'recipe_001', name:'Omelete de Clara com Espinafre', emoji:'🥚', macros:{calories:180,protein:22,carbs:4,fat:8}, category:'café da manhã' },
    { id:'recipe_002', name:'Salada de Frango Grelhado', emoji:'🥗', macros:{calories:350,protein:35,carbs:15,fat:18}, category:'almoço' },
    { id:'recipe_003', name:'Salmão com Legumes', emoji:'🐟', macros:{calories:420,protein:38,carbs:12,fat:24}, category:'jantar' },
    { id:'recipe_004', name:'Smoothie Verde Detox', emoji:'🥤', macros:{calories:150,protein:8,carbs:22,fat:4}, category:'lanche' },
    { id:'recipe_005', name:'Quibe de Abóbora Assado', emoji:'🎃', macros:{calories:280,protein:12,carbs:35,fat:10}, category:'almoço' },
  ]},
  ranking: { data: [] },
  dicas: { data: [
    { id:'dica_001', text:'Beba 2 litros de água por dia para manter a hidratação e o metabolismo ativo.', emoji:'💧', category:'hidratação' },
    { id:'dica_002', text:'Prefira carboidratos integrais: arroz integral, quinoa e aveia têm menor índice glicêmico.', emoji:'🌾', category:'alimentação' },
    { id:'dica_003', text:'Caminhe 30 minutos após as refeições principais para ajudar no controle glicêmico.', emoji:'🚶', category:'exercício' },
    { id:'dica_004', text:'Durma 7-8 horas por noite — o sono regula hormônios que afetam a glicose.', emoji:'😴', category:'sono' },
  ]},
  refeicoes: { data: [
    { id:'cafe_manha', label:'Café da Manhã', time:'06:00-09:00', emoji:'🌅' },
    { id:'almoco', label:'Almoço', time:'11:30-14:00', emoji:'☀️' },
    { id:'lanche_tarde', label:'Lanche da Tarde', time:'15:00-17:00', emoji:'🍎' },
    { id:'jantar', label:'Jantar', time:'18:30-21:00', emoji:'🌙' },
  ]},
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  // Find service account
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(process.env.HOME || '/root', '.firebase', 'bela-4d-app-service-account.json');
  
  let saJson;
  if (fs.existsSync(saPath)) {
    console.log(`[Seed] Service account: ${saPath}`);
    saJson = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  } else {
    console.error('[Seed] ❌ Service account não encontrada.');
    console.error(`   Esperado em: ${saPath}`);
    console.error('');
    console.error('   Para gerar:');
    console.error('   1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=bela-4d-app');
    console.error('   2. Clique na service account → Keys → Add Key → JSON');
    console.error('   3. Salve o arquivo JSON no caminho acima');
    console.error('');
    console.error('   Ou defina: export GOOGLE_APPLICATION_CREDENTIALS=/caminho/key.json');
    process.exit(1);
  }

  console.log('[Seed] Obtendo access token via service account JWT...');
  let token;
  try {
    token = await getAccessTokenFromSA(saJson);
    console.log('[Seed] ✅ Token obtido\n');
  } catch (e) {
    console.error(`[Seed] ❌ Falha ao obter token: ${e.message}`);
    process.exit(1);
  }

  let created = 0, skipped = 0, errors = [];

  for (const [docId, config] of Object.entries(CONFIGS)) {
    // Check if already exists (idempotent)
    const check = await firestoreReq(token, 'GET', `/appConfig/${docId}`);
    
    if (check.status === 200) {
      console.log(`  ⏭️  appConfig/${docId} — já existe`);
      skipped++;
      continue;
    }

    // Create document
    const body = { fields: { data: { arrayValue: { values: config.data } } } };
    const resp = await firestoreReq(token, 'PATCH', `/appConfig/${docId}`, body);
    
    if (resp.status === 200 || resp.status === 201) {
      console.log(`  ✅ appConfig/${docId} — criado`);
      created++;
    } else {
      console.log(`  ❌ appConfig/${docId} — HTTP ${resp.status}: ${resp.body.substring(0, 150)}`);
      errors.push(docId);
    }

    await new Promise(r => setTimeout(r, 300)); // rate limit
  }

  console.log(`\n[Seed] ✅ ${created} criados, ⏭️ ${skipped} skip, ${errors.length ? '❌ ' + errors.join(', ') : ''}`);
  console.log('[Seed] Concluído!');
}

main().catch(e => { console.error(e); process.exit(1); });
