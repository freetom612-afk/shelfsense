/* ShelfSense — DEMO sign-in (window.ShelfSenseAuth).
 *
 * This is a prototype login, NOT real security: the site is static (no server) and the code is public.
 *  - Accounts live in this browser's localStorage only (shelfsense_users); they don't exist on other devices.
 *  - Passwords are never stored in clear text: a salted PBKDF2-SHA256 hash is kept instead.
 *  - Anyone who opens DevTools can bypass the gate. Replace with a real auth service (Firebase / Supabase)
 *    before handling real users.
 *
 * Load this file FIRST in <head> of every page. On any page except login.html it redirects visitors
 * without a session to login.html?next=<page>. Profile / menu / cart data are stored per account
 * (see assets/state.js).
 */
(function () {
  const USERS_KEY = 'shelfsense_users';
  const SESSION_KEY = 'shelfsense_session';

  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLogin = page === 'login.html';

  // Developer mode: ?dev=1 turns it on in this browser, ?dev=0 turns it off. It only reveals internal details
  // (e.g. SKU codes in the cart) and is NOT a permission system: the data is in the public source anyway.
  const DEV_KEY = 'shelfsense_dev';
  try {
    const dv = new URLSearchParams(location.search).get('dev');
    if (dv === '1') localStorage.setItem(DEV_KEY, '1');
    else if (dv === '0') localStorage.removeItem(DEV_KEY);
  } catch (e) { /* storage unavailable */ }
  const isDev = () => { try { return localStorage.getItem(DEV_KEY) === '1'; } catch (e) { return false; } };
  const session = read(SESSION_KEY);

  // Only same-site page names are allowed as a redirect target (no open redirect)
  function safeNext(n) {
    return typeof n === 'string' && /^[a-z0-9\-]+\.html([?#][^\s]*)?$/i.test(n) && !/^login\.html/i.test(n) ? n : '';
  }

  // ---- gate ----
  if (!isLogin && !(session && session.email)) {
    document.documentElement.style.visibility = 'hidden';
    location.replace('login.html?next=' + encodeURIComponent(page + location.search + location.hash));
    return;
  }

  // ---- crypto helpers ----
  const b64 = (buf) => btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function hashPassword(password, saltB64) {
    if (!(window.crypto && crypto.subtle)) throw new Error('crypto-unavailable');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(saltB64), iterations: 100000, hash: 'SHA-256' }, key, 256);
    return b64(bits);
  }

  const normEmail = (e) => String(e || '').trim().toLowerCase();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const api = {
    SESSION_KEY, USERS_KEY, safeNext, isDev,
    currentUser() {
      const s = read(SESSION_KEY);
      return s && s.email ? { email: s.email, name: s.name || '' } : null;
    },
    validate(email, password) {
      if (!EMAIL_RE.test(normEmail(email))) return 'כתובת המייל לא תקינה';
      if (String(password || '').length < 8) return 'הסיסמה חייבת להכיל לפחות 8 תווים';
      return '';
    },
    async signUp(name, email, password) {
      const e = normEmail(email);
      const bad = api.validate(e, password);
      if (bad) return { ok: false, error: bad };
      const users = read(USERS_KEY) || {};
      if (users[e]) return { ok: false, error: 'כבר קיים חשבון עם המייל הזה. אפשר להתחבר.' };
      try {
        const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
        users[e] = { name: String(name || '').trim().slice(0, 40), salt, hash: await hashPassword(password, salt), created: Date.now() };
      } catch (err) {
        return { ok: false, error: 'הדפדפן לא תומך בהצפנה הנדרשת. נסה דפדפן עדכני.' };
      }
      if (!write(USERS_KEY, users)) return { ok: false, error: 'לא ניתן לשמור חשבון בדפדפן הזה (האחסון חסום).' };
      write(SESSION_KEY, { email: e, name: users[e].name, at: Date.now() });
      return { ok: true };
    },
    async logIn(email, password) {
      const e = normEmail(email);
      const bad = api.validate(e, password);
      if (bad) return { ok: false, error: bad };
      const u = (read(USERS_KEY) || {})[e];
      let match = false;
      try { match = !!u && (await hashPassword(password, u.salt)) === u.hash; } catch (err) {
        return { ok: false, error: 'הדפדפן לא תומך בהצפנה הנדרשת. נסה דפדפן עדכני.' };
      }
      if (!match) return { ok: false, error: 'המייל או הסיסמה שגויים' };
      write(SESSION_KEY, { email: e, name: u.name, at: Date.now() });
      return { ok: true };
    },
    logOut() {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
      location.href = 'login.html';
    }
  };
  window.ShelfSenseAuth = api;

  // ---- user menu (avatar button + dropdown) ----
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function mountUserMenu() {
    const user = api.currentUser();
    // No account button on the login page or inside the full-screen Reel player
    if (!user || isLogin || page === 'reel.html' || page === 'cook.html' || document.getElementById('ss-user-btn')) return;
    const slot = document.getElementById('ss-user-slot') ||
      (document.querySelector('header > div') && Object.assign(document.createElement('span'), { id: 'ss-user-slot' }));
    if (!slot) return;
    if (!slot.isConnected) document.querySelector('header > div').appendChild(slot);

    const label = user.name || user.email.split('@')[0];
    const initial = (label.trim()[0] || '?').toUpperCase();
    slot.style.position = 'relative';
    slot.style.display = 'inline-flex';
    slot.innerHTML = `
      <button type="button" id="ss-user-btn" aria-haspopup="true" aria-expanded="false" aria-label="חשבון: ${esc(label)}"
        style="display:flex;align-items:center;gap:8px;height:40px;padding:0 4px 0 12px;border-radius:9999px;border:1px solid #E2E8F0;background:#fff;cursor:pointer;font:600 13px/1 Rubik,sans-serif;color:#0F172A">
        <span class="ss-user-name" style="max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(label)}</span>
        <span style="width:30px;height:30px;border-radius:9999px;background:#0F766E;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">${esc(initial)}</span>
      </button>
      <div id="ss-user-menu" role="menu" hidden
        style="position:absolute;top:calc(100% + 8px);inset-inline-end:0;min-width:230px;z-index:80;background:#fff;border:1px solid #E2E8F0;border-radius:16px;box-shadow:0 12px 28px -8px rgba(15,23,42,.22);padding:8px;font:400 14px/1.4 Rubik,sans-serif;color:#0F172A;text-align:right">
        <div style="padding:8px 12px 10px;border-bottom:1px solid #E2E8F0;margin-bottom:6px">
          <div style="font-weight:600">${esc(label)}</div>
          <div dir="ltr" style="font-size:12px;color:#475569;text-align:right;overflow-wrap:anywhere">${esc(user.email)}</div>
        </div>
        <a role="menuitem" href="onboarding.html" style="display:block;padding:9px 12px;border-radius:8px;color:#0F172A;text-decoration:none">הגדרות פרופיל ותזונה</a>
        ${isDev() ? '<a role="menuitem" href="?dev=0" style="display:block;padding:9px 12px;border-radius:8px;color:#B45309;text-decoration:none;background:#FFFBEB">מצב מפתח פעיל · לחצו לכיבוי</a>' : ''}
        <button role="menuitem" type="button" id="ss-logout" style="display:block;width:100%;text-align:right;padding:9px 12px;border-radius:8px;border:0;background:none;color:#B91C1C;font:600 14px Rubik,sans-serif;cursor:pointer">התנתקות</button>
      </div>`;
    const btn = slot.querySelector('#ss-user-btn');
    const menu = slot.querySelector('#ss-user-menu');
    const setOpen = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(menu.hidden); });
    document.addEventListener('click', (e) => { if (!slot.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    slot.querySelector('#ss-logout').addEventListener('click', api.logOut);
    // On phones show only the avatar so the header stays compact
    const st = document.createElement('style');
    st.textContent = '@media (max-width:767px){.ss-user-name{display:none}#ss-user-btn{padding:0 4px!important}}';
    document.head.appendChild(st);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountUserMenu);
  else mountUserMenu();
})();
