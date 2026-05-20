// Dashboard tab: Perfil
import { getAchievementsCatalog } from '../../config/constants.js';
import { normalizeAchievement } from './helpers.js';
import { PROFILE_AVATARS, PROFILE_COLORS } from '../../config/data.js';

export function render(dash) {
  const achievementCards = (Array.isArray(dash.achievements) && dash.achievements.length ? dash.achievements : getAchievementsCatalog())
    .map(normalizeAchievement)
    .filter(Boolean);
  const unlockedCount = achievementCards.filter(badge => badge.ok).length;
  return `
    <section>
      <div class="dash-card pad" style="margin-bottom:20px;background:rgba(240,5,154,0.06);border-color:rgba(240,5,154,0.18);display:flex;flex-direction:column;align-items:center;gap:14px;">
        <div class="dash-avatar" style="width:80px;height:80px;background:${dash.profileAvatar.color}22;border:2px solid ${dash.profileAvatar.color}55;font-size:40px;">${dash.profileAvatar.emoji}</div>
        <div style="text-align:center;">
          <div style="color:var(--dash-text);font-weight:800;font-size:22px;">Você</div>
          <div style="color:var(--dash-muted);font-size:15px;">${dash.profileAvatar.nick}</div>
          <div style="color:${dash.getLevel(dash.xp).color};font-weight:700;font-size:14px;margin-top:4px;">Nível ${dash.getLevel(dash.xp).level} · ${dash.getLevel(dash.xp).title}</div>
        </div>
        <div style="display:flex;gap:24px;text-align:center;flex-wrap:wrap;justify-content:center;">
          ${[{ l: 'XP Total', v: dash.xp }, { l: 'Conquistas', v: unlockedCount }, { l: 'Streak', v: dash.streak + '🔥' }].map(stat => '<div><div style="color:var(--dash-text);font-weight:800;font-size:20px;">' + stat.v + '</div><div style="color:var(--dash-muted);font-size:13px;">' + stat.l + '</div></div>').join('')}
        </div>
      </div>
      <div class="dash-card pad">
        <div style="color:var(--dash-text);font-weight:700;font-size:16px;margin-bottom:14px;">🎨 Escolha seu avatar</div>
        <div class="dash-grid-3" style="grid-template-columns: repeat(6, minmax(0, 1fr)); margin-bottom:16px;">
          ${PROFILE_AVATARS.map(emoji => '<button class="dash-chip ' + (dash.profileAvatar.emoji === emoji ? 'active' : '') + '" data-avatar-emoji="' + emoji + '" style="aspect-ratio:1;border-radius:14px;font-size:24px;display:flex;align-items:center;justify-content:center;">' + emoji + '</button>').join('')}
          <button class="dash-chip" data-avatar-custom style="aspect-ratio:1;border-radius:14px;font-size:20px;display:flex;align-items:center;justify-content:center;">+</button>
        </div>
        <div style="color:var(--dash-text);font-weight:600;font-size:14px;margin-bottom:10px;">Cor do avatar</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;align-items:center;">
          ${PROFILE_COLORS.map(color => '<button class="dash-chip" data-avatar-color="' + color + '" style="width:40px;height:40px;padding:0;border-radius:50%;background:' + color + '33;border:3px solid ' + (dash.profileAvatar.color === color ? color : 'transparent') + ';display:flex;align-items:center;justify-content:center;">' + (dash.profileAvatar.color === color ? '✓' : '') + '</button>').join('')}
          <label class="dash-chip dash-chip-chroma" style="position:relative;width:40px;height:40px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:3px solid ${!PROFILE_COLORS.includes(dash.profileAvatar.color) ? dash.profileAvatar.color : '#f0059a'};background:conic-gradient(from 0deg,#ff0033,#ff8800,#ffee00,#26ff00,#00ffe1,#0066ff,#9900ff,#ff0077,#ff0033);flex-shrink:0;">
            <span style="width:24px;height:24px;border-radius:50%;background:${dash.profileAvatar.color};border:2px solid rgba(255,255,255,0.35);display:block;"></span>
            <input type="color" data-avatar-color-input value="${dash.profileAvatar.color}" style="position:absolute;width:1px;height:1px;opacity:0;border:0;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;" />
          </label>
        </div>
        <div style="color:var(--dash-text);font-weight:600;font-size:14px;margin-bottom:8px;">Apelido público</div>
        <input class="dash-input" data-avatar-nick value="${dash.profileAvatar.nick}" placeholder="@seunome" maxlength="25" />
      </div>
      <button class="dash-primary-btn" data-profile-save style="width:100%;font-size:16px;margin:14px 0;">✓ Salvar meu perfil</button>
      <div style="color:var(--dash-text);font-weight:700;font-size:16px;margin:14px 0 10px;">🎛️ Tema</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        ${[
          { mode: 'light', icon: '☀️', label: 'Claro' },
          { mode: 'dark', icon: '🌙', label: 'Escuro' },
          { mode: 'system', icon: '🖥️', label: 'Sistema' },
        ].map(option => `
          <button class="dash-chip ${dash.themeMode === option.mode ? 'active' : ''}" data-theme-mode="${option.mode}" style="min-height:40px;padding:10px 14px;border-radius:12px;flex:1;justify-content:center;display:flex;align-items:center;gap:8px;${dash.themeMode === option.mode ? 'color:#fff;' : ''}">${option.icon} ${option.label}</button>
        `).join('')}
      </div>
      <button class="dash-card pad" data-logout style="width:100%;padding:14px 18px;border-radius:14px;border:1px solid rgba(244,63,94,0.25);background:rgba(244,63,94,0.07);cursor:pointer;display:flex;align-items:center;gap:12px;">
        <span style="font-size:18px;color:#f43f5e;">🚪</span>
        <div style="text-align:left;">
          <div style="font-weight:700;font-size:15px;color:#f43f5e;">Sair da conta</div>
          <div style="font-size:12px;color:rgba(244,63,94,0.6);margin-top:1px;">Encerrar sessão atual</div>
        </div>
      </button>
    </section>
  `;
}
