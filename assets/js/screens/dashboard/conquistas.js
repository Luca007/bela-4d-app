// Dashboard tab: Conquistas
import { _achCategory, getStaticRanking } from './helpers.js';
import { getAchievementsCatalog } from '../../config/constants.js';

export function render(dash) {
  const rankList = Array.isArray(dash.ranking) && dash.ranking.length ? dash.ranking : getStaticRanking();
  const me = { ...(rankList.find(user => user.me) || rankList[Math.min(7, rankList.length - 1)] || {}), xp: dash.xp, st: dash.streak };
  const topThree = rankList.length >= 3 ? [rankList[1], rankList[0], rankList[2]] : rankList.slice(0, 3);
  const unlockedMap = new Map((dash.achievements || []).map(a => [a.id || a.achievementId, a]));

  const allAchievements = getAchievementsCatalog().map(catalog => {
    const userData = unlockedMap.get(catalog.id);
    const isUnlocked = !!userData;
    const isClaimed = !!(userData?.claimed);
    const isHidden = !!catalog.hidden && !isUnlocked;
    return {
      id: catalog.id,
      e: isHidden ? '❓' : catalog.icon,
      t: isHidden ? 'Conquista oculta' : catalog.title,
      d: isHidden ? 'Continue jogando para descobrir...' : catalog.description,
      ct: _achCategory(catalog.id),
      xp: catalog.xp,
      ok: isUnlocked,
      claimed: isClaimed,
      hidden: isHidden,
    };
  });

  const visibleAchievements = allAchievements;
  const totalCount = getAchievementsCatalog().length;
  const claimedCount = allAchievements.filter(a => a.claimed).length;
  const pendingClaims = allAchievements.filter(a => a.ok && !a.claimed).length;
  const unlockedCount = allAchievements.filter(a => a.ok).length;

  return `
    <section>
      <div class="dash-section-title">🏆 Conquistas & Ranking</div>
      ${_renderAchievementCounter(claimedCount, totalCount)}
      ${_renderPlatinumBadge(claimedCount, totalCount)}
      <div class="dash-card pad" style="margin-bottom:20px;border-color: rgba(240,5,154,0.15); background: rgba(240,5,154,0.06); display:flex;align-items:center;gap:14px;">
        <div class="dash-avatar" style="width:48px;height:48px;background:${me.col}22;border:2px solid ${me.col}55;">${me.e}</div>
        <div style="flex:1;">
          <div style="color:var(--dash-muted);font-size:13px;margin-bottom:2px;">Sua posição no ranking</div>
          <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#f0059a;font-size:32px;font-weight:900;">#${me.p}</span><span style="color:var(--dash-text);font-size:16px;font-weight:700;">${me.nm}</span></div>
        </div>
        <div style="text-align:right;"><div style="color:#eab308;font-weight:800;font-size:18px;">${me.xp} XP</div><div style="color:var(--dash-muted);font-size:12px;">🔥 ${me.st} dias</div></div>
      </div>
      <div class="dash-grid-3" style="margin-bottom:18px;">
        ${[
          { l: 'XP Total', v: dash.xp },
          { l: 'Conquistas', v: unlockedCount },
          { l: 'Streak', v: dash.streak + ' dias' },
        ].map(stat => '<div class="dash-card pad"><div style="color:var(--dash-muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">' + stat.l + '</div><div style="color:var(--dash-text);font-weight:800;font-size:22px;line-height:1;">' + stat.v + '</div></div>').join('')}
      </div>
      <div class="dash-chip-row" style="margin-bottom:20px;">
        <button class="dash-chip ${dash.communityTab === 'badges' ? 'active' : ''}" data-conquest-tab="badges">🏅 Minhas Medalhas</button>
        <button class="dash-chip ${dash.communityTab === 'ranking' ? 'active' : ''}" data-conquest-tab="ranking">🏆 Ranking</button>
        <button class="dash-chip ${dash.communityTab === 'comunidade' ? 'active' : ''}" data-conquest-tab="comunidade">🤝 Comunidade</button>
      </div>
      ${dash.communityTab === 'badges' ? `
        <div>
          ${['jornada', 'engajamento', 'social'].map(category => {
            const categoryItems = visibleAchievements.filter(a => a.ct === category);
            if (!categoryItems.length) return '';
            return `
            <div style="margin-bottom:18px;">
              <div style="color:var(--dash-muted);font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">${category}</div>
              <div class="dash-grid-2">
                ${categoryItems.map(a => _renderAchievementCard(a)).join('')}
              </div>
            </div>
          `;
          }).join('')}
        </div>
      ` : dash.communityTab === 'ranking' ? `
        <div>
          <div class="dash-card pad" style="margin-bottom:4px;">
            <div style="text-align:center;color:var(--dash-muted);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:18px;">🏆 Pódio do Mês</div>
            <div style="display:flex;justify-content:center;align-items:flex-end;gap:14px;">
              ${topThree.map((user, index) => {
                const colors = ['#94a3b8', '#eab308', '#b45309'];
                const heights = [90, 124, 76];
                const medals = ['🥈', '👑', '🥉'];
                return `
                  <div style="display:flex;flex-direction:column;align-items:center;gap:7px;">
                    <div class="dash-avatar" style="width:48px;height:48px;background:${user.col}22;border:2px solid ${user.col}55;">${user.e}</div>
                    <div style="font-weight:800;font-size:13px;color:var(--dash-text);text-align:center;max-width:70px;">${user.nm.split(' ')[0]}</div>
                    <div style="color:${colors[index]};font-size:11px;font-weight:600;">${user.xp} XP</div>
                    <div style="width:68px;height:${heights[index]}px;border-radius:8px 8px 0 0;background:linear-gradient(180deg,${colors[index]}30,${colors[index]}10);border:1px solid ${colors[index]}40;display:flex;align-items:center;justify-content:center;"><span style="font-size:26px;">${medals[index]}</span></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${rankList.map(user => `
              <div class="dash-card pad" style="display:flex;align-items:center;gap:12px;border-color:${user.me ? 'rgba(240,5,154,0.3)' : 'var(--dash-border)'};background:${user.me ? 'rgba(240,5,154,0.06)' : 'var(--dash-surface)'};">
                <div style="width:26px;text-align:center;">${user.p <= 3 ? ['🥇', '🥈', '🥉'][user.p - 1] : '<span style="color:' + (user.me ? '#f0059a' : 'var(--dash-muted)') + ';font-weight:800;font-size:14px;">#' + user.p + '</span>'}</div>
                <div class="dash-avatar" style="width:38px;height:38px;background:${user.col}22;border:2px solid ${user.col}55;">${user.e}</div>
                <div style="flex:1;"><div style="color:${user.me ? '#f0059a' : 'var(--dash-text)'};font-weight:700;font-size:15px;">${user.nm}${user.me ? ' (você)' : ''}</div><div style="color:var(--dash-muted);font-size:12px;">${user.nk} · 🔥${user.st}d</div></div>
                <div style="text-align:right;"><div style="color:${user.p === 1 ? '#eab308' : user.p === 2 ? '#94a3b8' : user.p === 3 ? '#b45309' : 'var(--dash-text)'};font-weight:800;font-size:15px;">${user.xp}</div><div style="color:var(--dash-muted);font-size:11px;">XP</div></div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <p style="color:var(--dash-muted);font-size:14px;margin-bottom:4px;">Celebre as conquistas da comunidade! 💕</p>
          ${(dash.communityFeed || []).map(item => `
            <div class="dash-card pad">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <div class="dash-avatar" style="width:40px;height:40px;background:${item.col}22;border:2px solid ${item.col}55;">${item.e}</div>
                <div><div style="color:var(--dash-text);font-weight:700;font-size:15px;">${item.u}</div><div style="color:var(--dash-muted);font-size:12px;">${item.t}</div></div>
              </div>
              <div class="dash-card pad" style="background:rgba(240,5,154,0.06);border-color:rgba(240,5,154,0.18);padding:12px 16px;margin-bottom:12px;display:flex;gap:12px;align-items:center;">
                <span style="font-size:26px;">${item.b}</span>
                <div><div style="color:var(--dash-muted);font-size:11px;font-weight:600;text-transform:uppercase;">Nova conquista</div><div style="color:#f0059a;font-weight:700;font-size:15px;">${item.bn}</div></div>
              </div>
              ${item.cm.length > 0 ? '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;">' + item.cm.map(comment => '<div style="display:flex;gap:8px;"><div style="width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dash-muted);font-weight:700;flex-shrink:0;">' + comment.u[0] + '</div><div style="background:rgba(255,255,255,0.05);border-radius:0 10px 10px 10px;padding:6px 12px;"><span style="color:#f0059a;font-weight:700;font-size:13px;">' + comment.u + ': </span><span style="color:var(--dash-muted);font-size:13px;">' + comment.t + '</span></div></div>').join('') + '</div>' : ''}
              ${dash.commentOpenId === item.id ? '<div style="display:flex;gap:8px;margin-bottom:10px;"><input class="dash-input" data-community-comment-input placeholder="Escreva um comentário..." value="' + (dash.commentText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '" style="flex:1;padding:9px 14px;font-size:14px;" /><button class="dash-primary-btn" data-community-comment-send style="border-radius:10px;padding:9px 14px;min-height:44px;font-size:14px;box-shadow:none;">➤</button><button class="dash-ghost-btn" data-community-comment-close style="padding:9px 12px;min-height:44px;border-radius:10px;">✕</button></div>' : ''}
              <div style="display:flex;gap:8px;">
                <button class="dash-ghost-btn ${item.liked ? 'active' : ''}" data-community-like="${item.id}" style="padding:8px 16px;min-height:38px;border-radius:11px;background:${item.liked ? 'rgba(240,5,154,0.14)' : 'transparent'};border-color:${item.liked ? 'rgba(240,5,154,0.35)' : 'var(--dash-border)'};color:${item.liked ? '#f0059a' : 'var(--dash-text)'};">❤ ${item.lk}</button>
                <button class="dash-ghost-btn" data-community-toggle-comment="${item.id}" style="padding:8px 16px;min-height:38px;border-radius:11px;">💬 ${item.cm.length}</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </section>
  `;
}

function _renderAchievementCounter(claimedCount, totalCount) {
  const pct = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0;
  return `
    <div class="dash-ach-counter" style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,rgba(240,5,154,0.08),rgba(155,2,200,0.08));border:1px solid rgba(240,5,154,0.2);border-radius:14px;padding:14px 18px;margin-bottom:18px;">
      <div style="font-size:32px;font-weight:900;color:#f0059a;">${claimedCount}<span style="font-size:18px;color:var(--dash-muted);font-weight:700;">/${totalCount}</span></div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:var(--dash-text);margin-bottom:6px;">Conquistas reivindicadas</div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#f0059a,#9b02c8);border-radius:3px;transition:width 0.4s ease;box-shadow:0 0 8px rgba(240,5,154,0.5);"></div>
        </div>
      </div>
    </div>
  `;
}

function _renderPlatinumBadge(claimedCount, totalCount) {
  if (claimedCount !== totalCount || totalCount === 0) return '';
  return `
    <div class="dash-platinum-badge" style="background:linear-gradient(135deg,#f59e0b,#fbbf24);border-radius:18px;padding:24px;margin-bottom:20px;text-align:center;animation:achPlatinumShine 3s infinite;color:#1a1500;">
      <div style="font-size:48px;margin-bottom:6px;">💎</div>
      <div style="font-size:20px;font-weight:900;letter-spacing:2px;margin-bottom:4px;">PLATINA DESBLOQUEADA</div>
      <div style="font-size:13px;font-weight:700;opacity:0.85;">Você reivindicou todas as ${totalCount} conquistas, incluindo as ocultas!</div>
    </div>
  `;
}

function _renderAchievementCard(a) {
  const bg = a.ok
    ? (a.claimed ? 'linear-gradient(180deg,rgba(240,5,154,0.08),rgba(240,5,154,0.02))' : 'linear-gradient(180deg,rgba(240,5,154,0.18),rgba(240,5,154,0.06))')
    : 'rgba(255,255,255,0.03)';
  const borderColor = (a.ok && !a.claimed) ? 'rgba(240,5,154,0.6)' : (a.ok ? 'rgba(240,5,154,0.2)' : 'rgba(255,255,255,0.07)');
  const animation = (a.ok && !a.claimed) ? 'animation:achGlowPulse 2s infinite;' : '';
  let actionHTML;
  if (a.ok && !a.claimed) {
    actionHTML = '<button class="ach-claim-btn" data-claim-achievement="' + a.id + '" style="width:100%;margin-top:6px;padding:8px 10px;background:linear-gradient(135deg,#f0059a,#c0027c);color:#fff;border:none;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 2px 10px rgba(240,5,154,0.4);transition:transform 0.15s;">🎁 Reivindicar +' + a.xp + ' XP</button>';
  } else if (a.ok && a.claimed) {
    actionHTML = '<div style="font-size:11px;color:#34d399;font-weight:700;margin-top:4px;">✓ Reivindicado +' + a.xp + ' XP</div>';
  } else if (a.hidden) {
    actionHTML = '<div style="font-size:10px;color:var(--dash-muted);font-weight:600;margin-top:4px;">🔒 Oculta</div>';
  } else {
    actionHTML = '<div style="font-size:10px;color:var(--dash-muted);font-weight:600;margin-top:4px;">+' + a.xp + ' XP</div>';
  }
  return `
    <div class="dash-achievement-card ${a.ok ? 'unlocked' : ''} ${a.hidden ? 'hidden-locked' : ''} ${a.ok && !a.claimed ? 'pending-claim' : ''}" data-achievement-id="${a.id}" style="position:relative;background:${bg};border:1px solid ${borderColor};border-radius:16px;padding:16px 14px;text-align:center;transition:all 0.2s;${animation}">
      <div style="font-size:34px;margin-bottom:8px;filter:${a.ok ? 'none' : 'grayscale(0.7)'};opacity:${a.ok ? 1 : 0.6};">${a.e}</div>
      <div style="font-size:13px;font-weight:800;color:${a.ok ? 'var(--dash-text)' : 'rgba(255,255,255,0.6)'};margin-bottom:4px;line-height:1.2;">${a.t}</div>
      <div style="font-size:11px;color:var(--dash-muted);line-height:1.35;margin-bottom:${a.ok ? '10px' : '6px'};">${a.d}</div>
      ${actionHTML}
    </div>
  `;
}
