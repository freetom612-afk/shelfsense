/* ShelfSense — Fresh Precision theme (designed in Stitch, project "ShelfSense").
 * Shared Tailwind config for the Tailwind-CDN pages (onboarding, dashboard, recipe, cart).
 * Load right after https://cdn.tailwindcss.com. Token names are the Material names the
 * pages already use; their values are mapped to the spec palette in AGENTS.md:
 *   primary #0F766E · secondary #D97706 · savings/tertiary #059669 · text #0F172A · canvas #F8FAFC
 *   macro: protein #047857/#ECFDF5 · carbs #D97706/#FFFBEB · fat #B45309/#F8FAFC
 *   radii: inputs/buttons 8px (rounded-lg) · cards 16px (rounded-xl) · tags full
 */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary — emerald
        'primary': '#0F766E',
        'primary-container': '#0F766E',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#CCFBF1',
        'surface-tint': '#115E59',
        'primary-fixed': '#CCFBF1',
        'primary-fixed-dim': '#99F6E4',
        'on-primary-fixed': '#134E4A',
        'on-primary-fixed-variant': '#115E59',
        'inverse-primary': '#5EEAD4',
        // Secondary — amber
        'secondary': '#D97706',
        'secondary-container': '#FEF3C7',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#92400E',
        'secondary-fixed': '#FFFBEB',
        'secondary-fixed-dim': '#FCD34D',
        'on-secondary-fixed': '#78350F',
        'on-secondary-fixed-variant': '#92400E',
        // Tertiary — savings / protein
        'tertiary': '#059669',
        'tertiary-container': '#047857',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#ECFDF5',
        'tertiary-fixed': '#ECFDF5',
        'tertiary-fixed-dim': '#6EE7B7',
        'on-tertiary-fixed': '#047857',
        'on-tertiary-fixed-variant': '#065F46',
        // Neutrals — slate
        'background': '#F8FAFC',
        'on-background': '#0F172A',
        'surface': '#F8FAFC',
        'surface-bright': '#F8FAFC',
        'surface-dim': '#E2E8F0',
        'surface-variant': '#E2E8F0',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F1F5F9',
        'surface-container': '#EEF2F6',
        'surface-container-high': '#E2E8F0',
        'surface-container-highest': '#DCE3EC',
        'on-surface': '#0F172A',
        'on-surface-variant': '#475569',
        'outline': '#94A3B8',
        'outline-variant': '#E2E8F0',
        'inverse-surface': '#0F172A',
        'inverse-on-surface': '#F8FAFC',
        // Error
        'error': '#DC2626',
        'on-error': '#FFFFFF',
        'error-container': '#FEE2E2',
        'on-error-container': '#991B1B',
        // Macros
        'macro-protein': '#047857',
        'macro-protein-bg': '#ECFDF5',
        'macro-carbs': '#D97706',
        'macro-carbs-bg': '#FFFBEB',
        'macro-fat': '#B45309',
        'macro-fat-bg': '#F8FAFC'
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        md: '0.5rem',
        lg: '0.5rem',
        xl: '1rem',
        '2xl': '1.25rem',
        full: '9999px'
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        'gutter-mobile': '0.75rem',
        'gutter': '1.25rem',
        'margin-mobile': '1rem',
        'margin': '2rem'
      },
      fontFamily: Object.fromEntries(
        ['body-sm', 'body-md', 'body-lg', 'label-sm', 'label-md', 'label-lg', 'headline-sm', 'headline-md',
          'headline-lg', 'display-lg', 'display-lg-mobile', 'numeric-stat'].map((k) => [k, ['Rubik', 'sans-serif']])
      ),
      fontSize: {
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'headline-md': ['22px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'display-lg': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg-mobile': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'numeric-stat': ['24px', { lineHeight: '28px', letterSpacing: '-0.02em', fontWeight: '700' }]
      }
    }
  }
};

/* Fresh Precision base styles shared by these pages */
(function () {
  const css = `
    body { font-family: 'Rubik', sans-serif; font-variant-numeric: tabular-nums; }
    /* clip (not hidden): hidden would make <body> a scroll container and break position:sticky */
    body { max-width: 100%; overflow-x: clip; }
    /* The hidden attribute must win over display utilities (flex/inline-flex) — wizard panels & buttons rely on it */
    [hidden] { display: none !important; }
    .wizard-panel, section[id] { scroll-margin-top: 88px; }
    /* White cards: 16px radius + 1px slate border (Stitch card spec) */
    .rounded-xl.bg-surface-container-lowest, article.rounded-xl { border: 1px solid #E2E8F0; }
    .shadow-sm { box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.05) !important; }
    .shadow-md { box-shadow: 0 4px 16px -4px rgba(15, 23, 42, 0.08) !important; }
    :focus-visible { outline: 2px solid #0F766E; outline-offset: 2px; }
    /* Mobile tab bar (Stitch dashboard): תפריט · מתכונים · סל · פרופיל */
    #ss-tabbar { display: none; }
    @media (max-width: 767px) {
      #ss-tabbar { display: grid; grid-template-columns: repeat(4, 1fr); position: fixed; inset-inline: 0; bottom: 0; z-index: 45;
        height: 64px; padding-bottom: env(safe-area-inset-bottom); background: rgba(255,255,255,0.96); backdrop-filter: blur(12px);
        border-top: 1px solid #E2E8F0; box-shadow: 0 -4px 16px -8px rgba(15,23,42,0.12); }
      #ss-tabbar a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
        font: 500 11px/14px 'Rubik', sans-serif; color: #475569; text-decoration: none; position: relative; }
      #ss-tabbar a .material-symbols-outlined { font-size: 24px; line-height: 1; }
      #ss-tabbar a[aria-current="page"] { color: #0F766E; font-weight: 600; }
      #ss-tabbar a[aria-current="page"] .material-symbols-outlined { font-variation-settings: 'FILL' 1; }
      #ss-tabbar .ss-badge { position: absolute; top: 6px; inset-inline-start: calc(50% + 6px); min-width: 18px; height: 18px; padding: 0 5px;
        border-radius: 9999px; background: #D97706; color: #fff; font: 600 10px/18px 'Rubik', sans-serif; text-align: center; }
      body.ss-has-tabbar { padding-bottom: 72px; }
      body.ss-has-tabbar .ss-dock { bottom: 64px !important; }
      body.ss-has-tabbar.ss-has-dock { padding-bottom: 140px; }
    }
  `;
  const style = document.createElement('style');
  style.id = 'shelfsense-theme';
  style.textContent = css;
  document.head.appendChild(style);

  const TABS = [
    { href: 'dashboard.html', icon: 'calendar_view_week', label: 'תפריט' },
    { href: 'recipe.html', icon: 'menu_book', label: 'מתכונים' },
    { href: 'cart.html', icon: 'shopping_cart', label: 'סל', badge: true },
    { href: 'onboarding.html', icon: 'person', label: 'פרופיל' }
  ];
  function mountTabbar() {
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page === 'onboarding.html' || document.getElementById('ss-tabbar')) return;
    const nav = document.createElement('nav');
    nav.id = 'ss-tabbar';
    nav.setAttribute('aria-label', 'ניווט ראשי');
    const current = page === 'low-calorie-recipes.html' ? 'recipe.html' : page;
    nav.innerHTML = TABS.map((t) => `<a href="${t.href}"${t.href === current ? ' aria-current="page"' : ''}>
        <span class="material-symbols-outlined" aria-hidden="true">${t.icon}</span><span>${t.label}</span>
        ${t.badge ? '<span class="ss-badge" data-ss="cart-lines"></span>' : ''}</a>`).join('');
    document.body.appendChild(nav);
    document.body.classList.add('ss-has-tabbar');
    if (document.querySelector('.ss-dock')) document.body.classList.add('ss-has-dock');
    if (window.ShelfSense && window.ShelfSense.apply) window.ShelfSense.apply(nav);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountTabbar);
  else mountTabbar();
})();
