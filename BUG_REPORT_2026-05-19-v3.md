# Bela 4D — Bug Report v3 (Sessão 2026-05-19, deep audit)

Kanban task: `t_53d620b8` (worker default — claude-opus-4-7)
Branch: detect-current (não commitado)
Conta teste: `teste@gmail.com / Teste@01`
Servidor: `python3 -m http.server 8090` em `127.0.0.1` (200 OK confirmado)
Tema: dark forçado via `colorScheme:'dark'` no contexto Playwright + localStorage `gmp-theme-mode='dark'`
Screenshots: `/tmp/app-screenshots-v3/` (28 PNGs, 14 mobile + 14 desktop)
Audit raw: `/tmp/app-audit-v3/` (`console.json`, `network.json`, `pageerrors.json`, `clicks.json`, `summary.md`)
Baseline anterior: `/tmp/app-screenshots/` (6 PNGs) — comparação no §1.

---

## 1. O que mudou entre v2 (baseline) e v3

### 1.1 Cobertura subiu de 6 → 28 screenshots
v2 só conseguia capturar tela de login e dashboard inicial; **não conseguia abrir o drawer nem navegar**. Em v3 todas as 6 rotas principais foram visitadas em mobile e desktop (inicio, receitas, exames, evolucao, conquistas, perfil), além de logout. Score de cobertura: 12 telas únicas × 2 viewports + 4 transitórias = 28 screenshots únicas.

### 1.2 Drawer toggle agora funciona (commit 7ce3e71 da feature/drawer)
O script v3 agora abre o drawer via `[data-open-drawer]`, identifica `[data-nav-item="..."]` e clica. Isso CONFIRMA que o problema apontado em `BUG_REPORT_2026-05-19.md` §4 (drawer não acessível por automação) foi resolvido. A regra `dashboard-v2.js:974-976` está conectada — clique no `☰` faz toggle de `sideOpen` corretamente.

### 1.3 Bugs do v2 que PERSISTEM em v3 (não resolvidos)

| § v2 | Bug | Status v3 | Evidência |
|---|---|---|---|
| 2.1 | Firestore `getAppConfig` × 8 com `Missing or insufficient permissions` | ❌ ainda quebrado — 17 erros idênticos (8 docs × 2 viewports + 1 retry) | `/tmp/app-audit-v3/console.json`, summary linhas 7-24 |
| 2.2 | GA4 `g/collect` retorna `ERR_ABORTED` | ❌ ainda presente (2 mobile + 2 desktop) | `/tmp/app-audit-v3/network.json` |
| 3.1 | Workflow 04 chama Function inexistente `saveRecipe` | ⏭ não testável via Playwright (análise estática) | — |
| 3.2 | `4d-delete-recipe` Function existe sem workflow n8n | ⏭ não testável via Playwright | — |
| 3.3 | `downloadExamPdf` órfão | ⏭ não testável via Playwright | — |
| 1.1 | Toasts empilhando | ⚠ provavelmente persiste (script faz `waitNoToasts` antes de capturar, então 03 vs 04 mostra a diferença) | comparar `03-after-login-mobile.png` vs `04-after-toasts-mobile.png` |

---

## 2. Bugs NOVOS descobertos no v3 (não estavam em v2)

### 2.1 [BUG-APP / DESIGN] "comunidade" não tem rota dedicada — está enterrada em sub-tab de conquistas
Severidade: **MEDIUM** (UX) / **HIGH** se a intenção era ter na nav

Evidência:
- `dashboard-v2.js:19-27` — array `NAV_ITEMS` local tem 7 itens: `inicio, evolucao, receitas, exames, conquistas, chat, perfil`. **Não há `comunidade`**.
- `conquistas.js:58` — comunidade aparece como `data-conquest-tab="comunidade"` dentro da tela de Conquistas (junto com "badges" e "ranking").
- O kanban task body pediu para "testar comunidade (scroll+like)" — implícito que devia ser navegável diretamente.

Consequência: usuários que querem ir direto à comunidade precisam:
1. Abrir drawer
2. Clicar "Conquistas"
3. Clicar tab "🤝 Comunidade" dentro da página

Decisão necessária: ou (a) promover comunidade a nav-item de topo (adicionar em `dashboard-v2.js:19`), ou (b) aceitar como tab e atualizar a documentação/expectativas. O script v3 falhou por presumir nav-item.

### 2.2 [BUG-APP] Toggle de tema só existe quando drawer está aberto
Severidade: **LOW** (intencional, mas surpreendente)

Evidência: `dashboard-v2.js:736` renderiza o drawer (incluindo `[data-toggle-theme]` na linha 817) apenas quando `sideOpen === true`. Quando o drawer fecha, todo o subtree some do DOM. Não é bug funcional — abrindo o drawer o toggle funciona — mas é uma decisão de UX que dificulta automação e atalhos de teclado.

Sugestão (opcional): expor um `data-toggle-theme` adicional no header (`dashboard-v2.js:747` próximo de `[data-open-drawer]`).

### 2.3 [BUG-CONSISTÊNCIA] `constants.js NAV_ITEMS` divergente do array em `dashboard-v2.js`
Severidade: **LOW** (potencial confusão futura)

Evidência:
- `constants.js:394-402` exporta `NAV_ITEMS = [home, perfil, receitas, avaliador, exames, ranking, chat]`
- `dashboard-v2.js:19-27` define **local** `NAV_ITEMS = [inicio, evolucao, receitas, exames, conquistas, chat, perfil]`
- `dashboard.js:6` importa o de constants mas é uma tela legada (não a usada hoje)

Os IDs divergem (`home`/`inicio`, `ranking`/`conquistas`, `avaliador` não existe no v2). Como dashboard-v2.js usa o array local, o constants é dead code. Limpeza: remover o export ou consolidar.

### 2.4 [BUG-SCRIPT] `openDrawerAndNav` faz toggle cego no `[data-open-drawer]`
Severidade: **MEDIUM** (afeta confiabilidade da auditoria, não o app)

Evidência: `screenshot-review-v3.js:121-132` clica `[data-open-drawer]` sem verificar `sideOpen`. Como o botão é toggle (`dashboard-v2.js:975`), chamar com drawer já aberto FECHA o drawer. Após a falha em `data-nav-item="comunidade"` (que não fecha o drawer porque nav-item nem existe), a próxima invocação para `chat` faz toggle reverso e fecha o drawer, e aí `data-nav-item="chat"` retorna not-found embora o seletor seja válido.

Fix sugerido para `screenshot-review-v3.js:121-132`:
```js
async function openDrawerAndNav(page, navId, name, opts = {}) {
  const isOpen = await page.$('.dash-drawer');
  if (!isOpen) {
    const opened = await page.$('[data-open-drawer]');
    if (opened) { await opened.click(); await page.waitForTimeout(700); }
  }
  return clickAndShot(page, `[data-nav-item="${navId}"]`, name, opts);
}
```

E para o toggle de tema (`screenshot-review-v3.js:212`), abrir drawer ANTES:
```js
const drawerEl = await page.$('.dash-drawer');
if (!drawerEl) { await (await page.$('[data-open-drawer]')).click(); await page.waitForTimeout(700); }
await clickAndShot(page, '[data-toggle-theme]', `13-theme-toggled-${profile.label}`, { wait: 800 });
```

### 2.5 [BUG-SCRIPT] Seletor errado para comunidade like
Severidade: **LOW**

`screenshot-review-v3.js:137-141` usa `[data-nav-item="comunidade"]` (não existe) e depois `[data-community-like]` (existe — `conquistas.js:122`). O seletor de like É válido, mas só renderiza quando a tab `comunidade` em conquistas está ativa. Como o nav-item falhou, a tab nunca foi acionada, e o like obviamente não estava no DOM.

Fix: navegar a `conquistas` → clicar `[data-conquest-tab="comunidade"]` → clicar `[data-community-like]`.

---

## 3. Status objetivo das verificações pedidas

| Item | Status | Notas |
|---|---|---|
| **Drawer toggle (open/close)** | ✅ | Funciona em mobile e desktop. `dashboard-v2.js:974,980` conectado. Renderiza condicionalmente em `:736`. |
| **Navegação para os 6 nav-items existentes** | ✅ | inicio, receitas, exames, evolucao, conquistas, perfil — todos visitados em ambos viewports. Screenshots 05-10 capturadas. |
| **Comunidade scroll + like** | ❌ | Não foi testado pois (a) script usa seletor errado e (b) app não tem rota dedicada. Funcionalidade existe (`conquistas.js:122`, `dashboard-v2.js:1473-1480`) mas só dentro da tab de Conquistas. |
| **Dark theme** | ✅ (forçado) / ❌ (toggle não testado) | Dark vem aplicado via `colorScheme:'dark'` no contexto + localStorage. O TOGGLE via `[data-toggle-theme]` não foi exercitado por bug do script (§2.4). |
| **Chat (digitar mensagem)** | ❌ | Falhou por efeito colateral do bug do script (§2.4 fechou drawer). Nav-item chat EXISTE (`dashboard-v2.js:25`). |
| **Logout** | ✅ | `15-after-logout-{mobile,desktop}.png` capturadas; logout encontrou o botão. |
| **Cobertura de screenshots únicas** | 28 (12 telas × 2 viewports + 4 transitórias) | vs 6 no baseline v2. |

---

## 4. Recomendações prioritárias para a próxima iteração

| # | Severidade | Ação | Onde |
|---|---|---|---|
| 1 | CRITICAL | Resolver Firestore permissions (deploy de `firestore.rules` OU debugar `request.auth` em runtime) | `firestore.rules` + `services/firestore.js:1212` |
| 2 | HIGH | Patch no script v3 conforme §2.4 e §2.5 (verificar `.dash-drawer` antes de toggle) | `scripts/screenshot-review-v3.js:121,212` |
| 3 | MEDIUM | Decidir se comunidade vira nav-item de topo (add em `dashboard-v2.js:19`) ou se documenta como tab de Conquistas | `dashboard-v2.js:19-27` |
| 4 | LOW | Remover `constants.js NAV_ITEMS` (dead code) OU sincronizar com `dashboard-v2.js` | `assets/js/config/constants.js:394` |
| 5 | LOW | Adicionar `[data-toggle-theme]` no header (não só no drawer) | `dashboard-v2.js:747` próximo a `[data-open-drawer]` |

---

## 5. Cross-grep — efeitos em cascata das mudanças propostas

Antes de aprovar qualquer um dos itens acima, conferir uso:
- `data-nav-item` ↔ usado APENAS em `dashboard-v2.js:804,966`. Adicionar/remover é seguro localmente.
- `data-toggle-theme` ↔ apenas `dashboard-v2.js:817,993`. Duplicar no header não quebra outros locais.
- `NAV_ITEMS` constante de `constants.js` ↔ importado APENAS em `dashboard.js:6,183,263` (tela legada). Verificar se `dashboard.js` ainda é instanciada antes de remover o export.
- `[data-community-like]` ↔ `dashboard-v2.js:1473,1474` + `conquistas.js:122`. Mudança no seletor impactaria os dois.
- `data-conquest-tab` ↔ `dashboard-v2.js:1175,1176` + `conquistas.js:56,57,58,75,108`. Não promover comunidade para nav-item sem atualizar essas 5 referências.

---

## Anexos

- Screenshots v3: `/tmp/app-screenshots-v3/` (28 PNG, ~80MB)
- Audit raw v3: `/tmp/app-audit-v3/` (4 JSONs + summary.md)
- Audit raw v2 (baseline): `/tmp/app-audit/`
- BUG_REPORT v2: `/home/luca/bela-4d-app/BUG_REPORT_2026-05-19.md`
