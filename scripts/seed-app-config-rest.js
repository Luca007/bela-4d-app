#!/usr/bin/env node
/**
 * Seed appConfig via Firebase REST API — dados COMPLETOS do index.js (Cloud Function oficial)
 * Usa JWT com service account, zero dependências.
 * 
 * REQUISITO: Service Account JSON em ~/.firebase/bela-4d-app-service-account.json
 * USO: node scripts/seed-app-config-rest.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ID = 'bela-4d-app';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Auth ─────────────────────────────────────────────────────────────────────

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
      exp: now + 3600, iat: now,
    })));
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(header + '.' + claim);
    const jwt = header + '.' + claim + '.' + base64url(sign.sign(saJson.private_key));

    const https = require('https');
    const url = saJson.token_uri || 'https://oauth2.googleapis.com/token';
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${encodeURIComponent(jwt)}`;
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { const p = JSON.parse(data); resolve(p.access_token); }
        catch (e) { reject(new Error('Token parse error')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsReq(url, opts, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = require('https').request(u, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function valueToFirestore(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(v => valueToFirestore(v)) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = valueToFirestore(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// ─── DATA ─ Copiado EXATAMENTE de firebase/functions/index.js lines 1009-1148 ─

const CONFIGS = {

  // 8 níveis (igual ao cloud function)
  levels: [
    { level:1, title:'Iniciante', name:'Iniciante', shortName:'Inic.', minXp:0, maxXp:499, color:'#8a8aa0', emoji:'🌱', rarity:'common' },
    { level:2, title:'Aprendiz', name:'Aprendiz', shortName:'Apr.', minXp:500, maxXp:1199, color:'#10b981', emoji:'🌿', rarity:'common' },
    { level:3, title:'Comprometida', name:'Comprometida', shortName:'Comp.', minXp:1200, maxXp:2199, color:'#38bdf8', emoji:'💪', rarity:'uncommon' },
    { level:4, title:'Disciplinada', name:'Disciplinada', shortName:'Disc.', minXp:2200, maxXp:3399, color:'#a78bfa', emoji:'🔥', rarity:'uncommon' },
    { level:5, title:'Consistente', name:'Consistente', shortName:'Consis.', minXp:3400, maxXp:4799, color:'#f59e0b', emoji:'⭐', rarity:'rare' },
    { level:6, title:'Referência', name:'Referência', shortName:'Ref.', minXp:4800, maxXp:6499, color:'#f43f5e', emoji:'🏆', rarity:'rare' },
    { level:7, title:'Elite 4D', name:'Elite 4D', shortName:'Elite', minXp:6500, maxXp:8499, color:'#14b8a6', emoji:'💎', rarity:'epic' },
    { level:8, title:'Mestra 4D', name:'Mestra 4D', shortName:'Mestra', minXp:8500, maxXp:99999, color:'#eab308', emoji:'👑', rarity:'legendary' },
  ],

  // 20 conquistas (cloud function tem 20)
  achievementsCatalog: [
    { id:'b1', emoji:'🌟', name:'Primeiro Passo', description:'Completou o cadastro inicial', xp:50, category:'Sistema' },
    { id:'b2', emoji:'📅', name:'7 Dias no Ritmo', description:'Seguiu o cardápio por 7 dias', xp:150, category:'Alimentação' },
    { id:'b3', emoji:'📉', name:'Glicemia em Queda', description:'Reduziu a glicemia em 20%', xp:200, category:'Saúde' },
    { id:'b4', emoji:'💬', name:'Curiosa', description:'Fez 10 perguntas ao Chat IA', xp:80, category:'Sistema' },
    { id:'b5', emoji:'🔥', name:'30 Dias Ativa', description:'Usou o sistema por 30 dias', xp:300, category:'Sistema' },
    { id:'b6', emoji:'🏆', name:'Top 10', description:'Entrou no top 10 do ranking', xp:250, category:'Ranking' },
    { id:'b7', emoji:'💪', name:'Semana Vencida', description:'Completou a primeira semana', xp:100, category:'Alimentação' },
    { id:'b8', emoji:'📊', name:'Monitor Assídua', description:'Registrou glicemia por 30 dias', xp:280, category:'Saúde' },
    { id:'b9', emoji:'🌙', name:'Sono de Qualidade', description:'Registrou sono 5+ por 7 noites', xp:130, category:'Saúde' },
    { id:'b10', emoji:'🤝', name:'Comunidade', description:'Reagiu a 10 conquistas', xp:90, category:'Social' },
    { id:'b11', emoji:'⚡', name:'Velocista', description:'Iniciou rapidamente no sistema', xp:60, category:'Sistema' },
    { id:'b12', emoji:'🎯', name:'Meta Batida', description:'Atingiu primeira meta de peso', xp:220, category:'Saúde' },
    { id:'b13', emoji:'🥕', name:'Colorida', description:'Completou 5 pratos com vegetais', xp:90, category:'Alimentação' },
    { id:'b14', emoji:'🧊', name:'Hidratação em Dia', description:'Registrou água por 14 dias', xp:110, category:'Saúde' },
    { id:'b15', emoji:'🚶', name:'Passos Firmes', description:'Manteve rotina ativa por 10 dias', xp:130, category:'Saúde' },
    { id:'b16', emoji:'🍽️', name:'Prato Completo', description:'Seguiu o plano completo por 3 dias', xp:120, category:'Alimentação' },
    { id:'b17', emoji:'💤', name:'Ritmo do Sono', description:'Dormiu 7h+ por 7 noites', xp:140, category:'Saúde' },
    { id:'b18', emoji:'💬', name:'Parceira da IA', description:'Interagiu 50 vezes com o chat', xp:180, category:'Sistema' },
    { id:'b19', emoji:'🎉', name:'Comunidade Ativa', description:'Recebeu 25 curtidas em conquistas', xp:170, category:'Social' },
    { id:'b20', emoji:'🚀', name:'Virada 4D', description:'Ultrapassou 5000 XP', xp:300, category:'Ranking' },
  ],

  // XP events (objeto, não array)
  xpEvents: {
    DAILY_LOGIN:10, HEALTH_FORM_COMPLETED:150, BLOOD_TEST_UPLOADED:200,
    MENU_FORM_COMPLETED:100, CHAT_MESSAGE_SENT:5, RECIPE_SAVED:15,
    RECIPE_TRIED:25, EXAM_UPLOADED:50, STREAK_7_DAYS:75,
    STREAK_14_DAYS:150, STREAK_30_DAYS:300, PROFILE_COMPLETE:50,
    FIRST_RECIPE:30, SHARE_ACHIEVEMENT:20,
  },

  // 7 itens de navegação com sub
  navItems: [
    { id:'inicio', label:'Início', icon:'🏠', sub:'Chat · Receita · Cardápio' },
    { id:'evolucao', label:'Evolução', icon:'📊', sub:'Gráficos · Progresso' },
    { id:'receitas', label:'Receitas', icon:'🥗', sub:'Cardápio personalizado' },
    { id:'exames', label:'Exames', icon:'🔬', sub:'Pedidos · Resultados' },
    { id:'conquistas', label:'Conquistas', icon:'🏆', sub:'Ranking · Comunidade' },
    { id:'chat', label:'Chat IA', icon:'💬', sub:'Dúvidas alimentares' },
    { id:'perfil', label:'Meu Perfil', icon:'👤', sub:'Avatar · Configurações' },
  ],

  // Banco de alimentos (~45 itens)
  foodDatabase: {
    frango:{status:'g',note:'Proteína magra ideal — base do programa'},
    peixe:{status:'g',note:'Ômega-3 anti-inflamatório e proteína de alto valor'},
    salmao:{status:'g',note:'Ômega-3 que melhora sensibilidade à insulina'},
    atum:{status:'g',note:'Proteína sem carboidratos'},
    sardinha:{status:'g',note:'Cálcio, ômega-3 e proteína'},
    tilapia:{status:'g',note:'Peixe branco magro, ótimo para o programa'},
    ovo:{status:'g',note:'Proteína completa, zero impacto glicêmico'},
    ovos:{status:'g',note:'Proteína completa, zero impacto glicêmico'},
    brocolis:{status:'g',note:'Fibras e antioxidantes que regulam a glicemia'},
    abobrinha:{status:'g',note:'Vegetal de baixíssimo índice glicêmico'},
    espinafre:{status:'g',note:'Magnésio melhora sensibilidade à insulina'},
    couve:{status:'g',note:'Fibras reguladoras e alto valor nutricional'},
    rucula:{status:'g',note:'Baixo IG, rico em nutrientes'},
    tomate:{status:'g',note:'Licopeno e baixo índice glicêmico'},
    abacate:{status:'g',note:'Gordura boa que suaviza picos glicêmicos'},
    morango:{status:'g',note:'Fruta de baixo IG, rica em vitamina C'},
    amendoa:{status:'g',note:'Gordura e proteína que estabilizam a glicose'},
    azeite:{status:'g',note:'Anti-inflamatório, melhora perfil lipídico'},
    arroz:{status:'a',note:'Prefira integral — máx. 2 colheres de sopa por refeição'},
    batata_doce:{status:'a',note:'IG médio — 1 unidade pequena com proteína'},
    banana:{status:'a',note:'IG moderado — 1 unidade pequena com oleaginosas'},
    maca:{status:'a',note:'1 unidade média com amêndoas'},
    laranja:{status:'a',note:'Vitamina C, mas frutose — 1 unidade por vez'},
    iogurte:{status:'a',note:'Preferir natural sem açúcar ou grego'},
    queijo:{status:'a',note:'Laticínio — 1 a 2 fatias por refeição'},
    feijao:{status:'a',note:'Fibras boas — máx. 4 colheres de sopa'},
    lentilha:{status:'a',note:'Carboidrato de baixo IG em porção controlada'},
    acucar:{status:'r',note:'Eleva a glicemia imediatamente. Substituir por stevia'},
    refrigerante:{status:'r',note:'Alto teor de açúcar — fortemente contraindicado'},
    pao:{status:'r',note:'Se branco/francês, IG altíssimo. Use pão de sementes'},
    farinha:{status:'r',note:'Carboidrato refinado — usar farinha de amêndoa'},
    macarrao:{status:'r',note:'Carboidrato refinado de alto IG'},
    bolo:{status:'r',note:'Açúcar + farinha refinada = pico glicêmico elevado'},
    biscoito:{status:'r',note:'Ultra processado com açúcar oculto'},
    sorvete:{status:'r',note:'Açúcar + gordura = pico de insulina'},
    chocolate:{status:'r',note:'Se ao leite ou branco, alto açúcar. Use 70%+ cacau'},
    margarina:{status:'r',note:'Gordura trans — substituir por manteiga ou azeite'},
    salsicha:{status:'r',note:'Ultra processado com conservantes inflamatórios'},
    mel:{status:'r',note:'Açúcar natural de alto IG — substituir por stevia'},
    suco:{status:'r',note:'Remove fibras e concentra o açúcar da fruta'},
    cerveja:{status:'r',note:'Carboidrato líquido + álcool que interferem na glicose'},
    tapioca:{status:'r',note:'Amido puro com IG altíssimo — evitar'},
    pizza:{status:'r',note:'Farinha refinada + gordura elevam glicemia'},
    fritura:{status:'r',note:'Gordura trans e oxidação aumentam inflamação'},
    miojo:{status:'r',note:'Ultra processado — sódio alto e carboidrato refinado'},
  },

  // 6 receitas completas com ingredientes + steps
  recipes: [
    { id:'r1', emoji:'🥚', name:'Omelete de Legumes', time:'15 min', kcal:280, category:'Café da manhã', difficulty:'Fácil', ingredients:['3 ovos','Abobrinha','Tomate','Sal e ervas'], steps:['Bata os ovos com sal.','Refogue legumes no azeite.','Despeje e tampe 3 min.','Sirva com folhas verdes.'] },
    { id:'r2', emoji:'🐟', name:'Salmão com Aspargos', time:'20 min', kcal:380, category:'Almoço', difficulty:'Médio', ingredients:['200g salmão','Aspargos','Azeite','Limão'], steps:['Tempere o salmão.','Grelhe 4 min/lado.','Refogue aspargos.','Sirva com limão.'] },
    { id:'r3', emoji:'🥗', name:'Bowl Low-Carb Frango', time:'25 min', kcal:320, category:'Almoço', difficulty:'Fácil', ingredients:['150g frango','Rúcula','Abacate','Azeite'], steps:['Grelhe o frango.','Monte bowl com rúcula.','Adicione abacate.','Regue com azeite.'] },
    { id:'r4', emoji:'🍳', name:'Frittata de Espinafre', time:'20 min', kcal:260, category:'Jantar', difficulty:'Fácil', ingredients:['4 ovos','Espinafre','Queijo minas','Alho'], steps:['Refogue espinafre.','Bata ovos com queijo.','Combine na frigideira.','Forno 10 min 180°C.'] },
    { id:'r5', emoji:'🥑', name:'Mousse de Abacate', time:'10 min', kcal:200, category:'Lanche', difficulty:'Fácil', ingredients:['1 abacate','Cacau em pó','Stevia'], steps:['Amasse o abacate.','Adicione cacau e stevia.','Misture bem.','Sirva gelado.'] },
    { id:'r6', emoji:'🍲', name:'Caldo de Frango', time:'40 min', kcal:180, category:'Ceia', difficulty:'Médio', ingredients:['Frango','Chuchu','Cenoura','Ervas'], steps:['Cozinhe frango 30 min.','Adicione legumes.','Tempere.','Coe e sirva.'] },
  ],

  // 20 badges (conquistas, mesmo formato)
  badges: [
    { id:'b1', emoji:'🌟', name:'Primeiro Passo', description:'Completou o cadastro inicial', xp:50, category:'Sistema' },
    { id:'b2', emoji:'📅', name:'7 Dias no Ritmo', description:'Seguiu o cardápio por 7 dias', xp:150, category:'Alimentação' },
    { id:'b3', emoji:'📉', name:'Glicemia em Queda', description:'Reduziu a glicemia em 20%', xp:200, category:'Saúde' },
    { id:'b4', emoji:'💬', name:'Curiosa', description:'Fez 10 perguntas ao Chat IA', xp:80, category:'Sistema' },
    { id:'b5', emoji:'🔥', name:'30 Dias Ativa', description:'Usou o sistema por 30 dias', xp:300, category:'Sistema' },
    { id:'b6', emoji:'🏆', name:'Top 10', description:'Entrou no top 10 do ranking', xp:250, category:'Ranking' },
    { id:'b7', emoji:'💪', name:'Semana Vencida', description:'Completou a primeira semana', xp:100, category:'Alimentação' },
    { id:'b8', emoji:'📊', name:'Monitor Assídua', description:'Registrou glicemia por 30 dias', xp:280, category:'Saúde' },
    { id:'b9', emoji:'🌙', name:'Sono de Qualidade', description:'Registrou sono 5+ por 7 noites', xp:130, category:'Saúde' },
    { id:'b10', emoji:'🤝', name:'Comunidade', description:'Reagiu a 10 conquistas', xp:90, category:'Social' },
    { id:'b11', emoji:'⚡', name:'Velocista', description:'Iniciou rapidamente no sistema', xp:60, category:'Sistema' },
    { id:'b12', emoji:'🎯', name:'Meta Batida', description:'Atingiu primeira meta de peso', xp:220, category:'Saúde' },
    { id:'b13', emoji:'🥕', name:'Colorida', description:'Completou 5 pratos com vegetais', xp:90, category:'Alimentação' },
    { id:'b14', emoji:'🧊', name:'Hidratação em Dia', description:'Registrou água por 14 dias', xp:110, category:'Saúde' },
    { id:'b15', emoji:'🚶', name:'Passos Firmes', description:'Manteve rotina ativa por 10 dias', xp:130, category:'Saúde' },
    { id:'b16', emoji:'🍽️', name:'Prato Completo', description:'Seguiu o plano completo por 3 dias', xp:120, category:'Alimentação' },
    { id:'b17', emoji:'💤', name:'Ritmo do Sono', description:'Dormiu 7h+ por 7 noites', xp:140, category:'Saúde' },
    { id:'b18', emoji:'💬', name:'Parceira da IA', description:'Interagiu 50 vezes com o chat', xp:180, category:'Sistema' },
    { id:'b19', emoji:'🎉', name:'Comunidade Ativa', description:'Recebeu 25 curtidas em conquistas', xp:170, category:'Social' },
    { id:'b20', emoji:'🚀', name:'Virada 4D', description:'Ultrapassou 5000 XP', xp:300, category:'Ranking' },
  ],

  // Ranking com 10 usuários mock
  ranking: [
    { position:1, name:'Ana Beatriz', nick:'@anabea', emoji:'👑', color:'#eab308', xp:1420, streak:45 },
    { position:2, name:'Carla Mendes', nick:'@carlinha', emoji:'🔥', color:'#f0059a', xp:1180, streak:38 },
    { position:3, name:'Priscila S.', nick:'@prisilva', emoji:'💎', color:'#a78bfa', xp:980, streak:31 },
    { position:4, name:'Fernanda L.', nick:'@ferlima', emoji:'🌺', color:'#1fcc74', xp:820, streak:28 },
    { position:5, name:'Juliana C.', nick:'@juju', emoji:'⭐', color:'#38bdf8', xp:710, streak:22 },
    { position:6, name:'Mariana A.', nick:'@mari', emoji:'🌸', color:'#fb7185', xp:640, streak:19 },
    { position:7, name:'Tatiane R.', nick:'@tati', emoji:'🦋', color:'#34d399', xp:580, streak:17 },
    { position:8, name:'Você', nick:'@voce', emoji:'🌙', color:'#f0059a', xp:520, streak:14, isMe:true },
    { position:9, name:'Roberta D.', nick:'@robi', emoji:'🍀', color:'#fbbf24', xp:480, streak:12 },
    { position:10, name:'Simone N.', nick:'@sisi', emoji:'🌿', color:'#6ee7b7', xp:410, streak:10 },
  ],
};

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(process.env.HOME || '/root', '.firebase', 'bela-4d-app-service-account.json');

  if (!fs.existsSync(saPath)) {
    console.error('[Seed] ❌ Service account nao encontrada:', saPath);
    process.exit(1);
  }

  const saJson = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  console.log('[Seed] Service account:', saPath);
  const token = await getAccessTokenFromSA(saJson);
  console.log('[Seed] ✅ Token obtido\n');

  let created = 0, skipped = 0, errors = [];
  const now = new Date().toISOString();

  for (const [docId, data] of Object.entries(CONFIGS)) {
    // Check if exists
    const check = await httpsReq(
      `${BASE}/appConfig/${docId}`,
      { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
    );

    if (check.status === 200) {
      // Overwrite with fresh data
      console.log(`  🔄 appConfig/${docId} — existe, sobrescrevendo...`);
    } else {
      console.log(`  ✨ appConfig/${docId} — criando...`);
    }

    // Firestore REST: document with fields
    const fields = {
      docId: { stringValue: docId },
      data: valueToFirestore(data),
      description: { stringValue: `Seed completo — ${now}` },
      version: { integerValue: '1' },
      source: { stringValue: 'scripts/seed-app-config-rest.js (cloud function data)' },
      createdAt: { timestampValue: now },
      updatedAt: { timestampValue: now },
    };

    const body = JSON.stringify({ fields });
    const resp = await httpsReq(
      `${BASE}/appConfig/${docId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      body
    );

    if (resp.status === 200 || resp.status === 201) {
      const count = Array.isArray(data) ? `${data.length} items` : `${Object.keys(data).length} keys`;
      console.log(`  ✅ appConfig/${docId} — OK (${count})`);
      created++;
    } else {
      console.log(`  ❌ appConfig/${docId} — HTTP ${resp.status}: ${resp.body.substring(0, 200)}`);
      errors.push(docId);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n[Seed] ✅ ${created} criados/atualizados, ⏭️ ${skipped} skip${errors.length ? ', ❌ ' + errors.join(', ') : ''}`);
  console.log('[Seed] Concluído!');
}

main().catch(e => { console.error('[Seed] Fatal:', e); process.exit(1); });
