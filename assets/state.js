/* ShelfSense — shared state between pages (localStorage).
 * Keys:
 *   shelfsense_profile  — onboarding result (body data, goal, macros, budget tier, restrictions, dislikes)
 *   shelfsense_menu     — dashboard dish swaps per slot { anchor1: dishId, anchor2: dishId }
 *   shelfsense_cart     — cart choices { store, brands: {productId: brandIdx}, removed, extraPacks, pantryAdded }
 * Menu and cart contents are computed from assets/data.js (load it before this file).
 * Every page loads this file and marks elements with data-ss="<field>" to be filled in.
 */
(function () {
  const KEYS = {
    profile: 'shelfsense_profile',
    menu: 'shelfsense_menu',
    cart: 'shelfsense_cart'
  };

  const TIERS = {
    saver:    { label: 'חסכוני', en: 'Basic',    budget: 280 },
    balanced: { label: 'מאוזן',  en: 'Standard', budget: 380 },
    free:     { label: 'חופשי',  en: 'Premium',  budget: 520 }
  };

  const GOALS = {
    cut:      { label: 'חיטוב', delta: -380, proteinPerKg: 2.0 },
    maintain: { label: 'שמירה', delta: 0,    proteinPerKg: 1.8 },
    bulk:     { label: 'מסה',   delta: 250,  proteinPerKg: 2.2 } // spec: surplus + high protein
  };

  const ACTIVITY = {
    low:      { label: 'יושבני', factor: 1.2 },
    moderate: { label: 'מתונה',  factor: 1.55 },
    high:     { label: 'גבוהה',  factor: 1.725 }
  };

  // Default profile matches the numbers the pages showed before onboarding existed.
  const DEFAULT_PROFILE = {
    sex: 'male', age: 28, height: 180, weight: 78,
    activity: 'moderate', goal: 'cut',
    calories: 2150, protein: 165, carbs: 190, fat: 62,
    tier: 'balanced',
    restrictions: ['כשר'],
    dislikes: ['כוסברה', 'חצילים', 'פטריות'],
    completed: false
  };

  // Cart choices only — the cart itself is always rebuilt from the menu (assets/data.js).
  const DEFAULT_CART = { store: 'רמי לוי', brands: {}, removed: [], extraPacks: {}, pantryAdded: [] };

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  function calcMacros(p) {
    const s = p.sex === 'female' ? -161 : 5;
    const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + s;
    const tdee = Math.round(bmr * (ACTIVITY[p.activity] || ACTIVITY.moderate).factor);
    const goal = GOALS[p.goal] || GOALS.cut;
    const delta = goal.delta;
    const calories = Math.max(1400, tdee + delta);
    const proteinPerKg = goal.proteinPerKg;
    const protein = Math.round(p.weight * proteinPerKg);
    const fat = Math.round((calories * 0.26) / 9);
    const carbs = Math.max(0, Math.round((calories - (protein * 4 + fat * 9)) / 4));
    return { tdee, delta, calories, protein, carbs, fat, proteinPerKg };
  }

  const loadProfile = () => Object.assign({}, DEFAULT_PROFILE, read(KEYS.profile) || {});
  const saveProfile = (p) => write(KEYS.profile, Object.assign({}, p, { updatedAt: Date.now() }));
  const loadMenu = () => read(KEYS.menu) || {};
  const saveMenu = (m) => write(KEYS.menu, m);
  const loadCart = () => Object.assign({}, DEFAULT_CART, read(KEYS.cart) || {});
  const saveCart = (c) => write(KEYS.cart, Object.assign(loadCart(), c));

  const num = (n) => Math.round(n).toLocaleString('he-IL');
  const money = (n, digits) => '₪' + Number(n).toLocaleString('he-IL', {
    minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0
  });

  // Live menu + cart (requires assets/data.js on the page)
  function currentMenu() {
    const D = window.ShelfSenseData;
    return D ? D.buildMenu(loadProfile(), loadMenu()) : {};
  }
  function currentCart() {
    const D = window.ShelfSenseData;
    return D ? D.buildCart(loadProfile(), currentMenu(), loadCart()) : null;
  }

  // Values available to data-ss="<field>"
  function fields() {
    const p = loadProfile();
    const cart = currentCart();
    const c = cart ? { total: cart.total, store: cart.store } : { total: 0, store: loadCart().store };
    const tier = TIERS[p.tier] || TIERS.balanced;
    const goal = GOALS[p.goal] || GOALS.cut;
    const usage = tier.budget ? (c.total / tier.budget) * 100 : 0;
    const other = c.store === 'רמי לוי' ? 'שופרסל' : 'רמי לוי';
    const savings = cart ? Math.max(0, cart.chains[other] - cart.chains[c.store]) : 0;
    return {
      store: c.store,
      'cart-packs': cart ? String(cart.packs) : '',
      'cart-lines': cart ? String(cart.inCart.length) : '',
      'cart-savings': money(savings, 2),
      'price-rami': cart ? money(cart.chains['רמי לוי'], 2) : '',
      'price-shufersal': cart ? money(cart.chains['שופרסל'], 2) : '',
      'budget-status': c.total <= tier.budget ? `בתוך המסגרת — נשארו ${money(tier.budget - c.total, 2)}` : `חריגה של ${money(c.total - tier.budget, 2)} מהמסגרת`,
      calories: num(p.calories),
      protein: num(p.protein),
      carbs: num(p.carbs),
      fat: num(p.fat),
      goal: goal.label,
      tier: tier.label,
      'tier-en': `${tier.label} (${tier.en})`,
      budget: money(tier.budget),
      'cart-total': money(c.total, 2),
      'cart-total-round': money(c.total),
      'budget-usage': usage.toFixed(1) + '%',
      'budget-left': money(Math.max(0, tier.budget - c.total), 2),
      'header-targets': `${goal.label}: ${num(p.calories)} קל׳ | ${num(p.protein)}ג חלבון`,
      'header-budget': `תקציב שבועי: ${money(c.total)} / ${money(tier.budget)}`,
      profile: `${goal.label} ${tier.label}`,
      _usage: Math.min(100, usage)
    };
  }

  function apply(root) {
    const f = fields();
    (root || document).querySelectorAll('[data-ss]').forEach((el) => {
      const v = f[el.dataset.ss];
      if (v !== undefined) el.textContent = v;
    });
    (root || document).querySelectorAll('[data-ss-width="budget-usage"]').forEach((el) => {
      el.style.width = f._usage.toFixed(1) + '%';
    });
  }

  window.ShelfSense = {
    KEYS, TIERS, GOALS, ACTIVITY, DEFAULT_PROFILE,
    calcMacros, loadProfile, saveProfile, loadMenu, saveMenu, loadCart, saveCart, currentMenu, currentCart,
    num, money, fields, apply
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => apply());
  } else {
    apply();
  }
})();
