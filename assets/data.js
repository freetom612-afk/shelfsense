/* ShelfSense — prototype data + menu/cart engine (shared by dashboard.html, cart.html, recipe.html).
 * Spec rules implemented here:
 *  - Lego week: 2 anchor meals (batch, 3 servings each), quick meals (10–15 min), 1 backup pantry meal.
 *  - Whole-dish swaps only: same budget tier, ±5% kcal and ±10% protein vs the slot target, no disliked
 *    ingredients, respecting diet restrictions.
 *  - Cart: ingredients from all dishes are summed per product and converted to whole shelf packs.
 *    Perishables go to the cart; pantry products are "at home" by default.
 *  - Brand swaps in the cart only between SKUs of the exact same product.
 * All prices are illustrative prototype values (₪), not live chain data.
 */
(function () {
  // ---------- Products ----------
  // cat: 'fresh' (auto in cart) | 'pantry' (assumed at home). unit: 'g' | 'ml' | 'unit'.
  // brands are ordered cheapest → premium; price is the Rami Levy shelf price per pack.
  // shuf: Shufersal price factor for this product.
  const P = (name, cat, unit, pack, packLabel, brands, extra) =>
    Object.assign({ name, cat, unit, pack, packLabel, brands, shuf: 1.06 }, extra || {});
  const B = (name, price, privateLabel) => ({ name, price, privateLabel: !!privateLabel });

  const PRODUCTS = {
    // Meat & fish
    'chicken-breast': P('חזה עוף טרי', 'fresh', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 32.90, true), B('עוף טוב', 40.90), B('זוגלובק אורגני', 64.90)], { group: 'בשר ודגים' }),
    'chicken-thighs': P('פרגיות עוף טריות', 'fresh', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 39.90, true), B('עוף טוב', 47.90), B('זוגלובק אורגני', 72.90)], { group: 'בשר ודגים' }),
    'turkey':         P('פרגית הודו טרייה', 'fresh', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 44.90, true), B('מאמא עוף', 52.90)], { group: 'בשר ודגים' }),
    'ground-beef':    P('בשר בקר טחון', 'fresh', 'g', 500, '500 ג׳', [B('מותג פרטי רמי לוי', 29.90, true), B('טירת צבי', 36.90), B('אנגוס טחון טרי', 54.90)], { group: 'בשר ודגים', shuf: 1.08 }),
    'beef-strips':    P('רצועות בקר למוקפץ', 'fresh', 'g', 500, '500 ג׳', [B('מותג פרטי רמי לוי', 44.90, true), B('טירת צבי', 52.90), B('אנגוס', 69.90)], { group: 'בשר ודגים', shuf: 1.08 }),
    'entrecote':      P('סטייק אנטריקוט', 'fresh', 'g', 500, '500 ג׳', [B('טירת צבי', 89.90), B('אנטריקוט מיושן 21 יום', 119.90)], { group: 'בשר ודגים', shuf: 1.04 }),
    'salmon':         P('פילה סלמון נורבגי טרי', 'fresh', 'g', 500, '500 ג׳', [B('דגי הים', 64.90), B('סלמון פרימיום', 79.90)], { group: 'בשר ודגים' }),
    'frozen-fish':    P('פילה מושט קפוא', 'fresh', 'g', 800, '800 ג׳', [B('מותג פרטי רמי לוי', 34.90, true), B('דגי עדן', 42.90)], { group: 'בשר ודגים' }),
    // Dairy, eggs, tofu
    'eggs':           P('ביצים L', 'fresh', 'unit', 12, '12 יח׳', [B('מותג פרטי רמי לוי', 12.90, true), B('ביצי חופש גליל', 18.90), B('ביצים אורגניות', 26.90)], { group: 'חלב וביצים' }),
    'cottage':        P('קוטג׳ 5%', 'fresh', 'g', 250, '250 ג׳', [B('מותג פרטי רמי לוי', 5.40, true), B('תנובה', 6.90)], { group: 'חלב וביצים' }),
    'greek-yogurt':   P('יוגורט חלבון 0%', 'fresh', 'unit', 4, '4 גביעים × 200 ג׳', [B('מותג פרטי רמי לוי', 15.90, true), B('GO', 22.90)], { group: 'חלב וביצים' }),
    'feta':           P('גבינת פטה 5%', 'fresh', 'g', 200, '200 ג׳', [B('מותג פרטי רמי לוי', 11.90, true), B('פיראוס', 16.90)], { group: 'חלב וביצים' }),
    'tofu':           P('טופו קשה', 'fresh', 'g', 300, '300 ג׳', [B('מותג פרטי רמי לוי', 8.90, true), B('טופו אורגני', 12.90)], { group: 'חלב וביצים' }),
    'soy-milk':       P('משקה סויה', 'fresh', 'ml', 1000, '1 ליטר', [B('מותג פרטי רמי לוי', 9.90, true), B('אלפרו', 14.90)], { group: 'חלב וביצים' }),
    // Produce
    'tomatoes':       P('עגבניות', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 7.90), B('מגי מובחרות', 12.90)], { group: 'ירקות ופירות' }),
    'cucumbers':      P('מלפפונים', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 5.90), B('מארז מובחר', 8.90)], { group: 'ירקות ופירות' }),
    'peppers':        P('פלפלים אדומים', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 12.90), B('מארז מובחר', 16.90)], { group: 'ירקות ופירות' }),
    'onion':          P('בצל יבש', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 4.90), B('מארז', 6.90)], { group: 'ירקות ופירות' }),
    'potatoes':       P('תפוחי אדמה', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 4.90), B('מארז מובחר', 7.90)], { group: 'ירקות ופירות' }),
    'sweet-potato':   P('בטטה', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 7.90), B('מארז מובחר', 10.90)], { group: 'ירקות ופירות' }),
    'broccoli':       P('ברוקולי טרי', 'fresh', 'g', 500, '500 ג׳', [B('תפזורת', 9.90), B('מארז שטוף', 13.90)], { group: 'ירקות ופירות' }),
    'mushrooms':      P('פטריות שמפיניון', 'fresh', 'g', 250, '250 ג׳', [B('מותג פרטי רמי לוי', 7.90, true), B('תנובות השדה', 9.90)], { group: 'ירקות ופירות' }),
    'leafy':          P('עלי בייבי / חסה', 'fresh', 'g', 250, '250 ג׳', [B('מותג פרטי רמי לוי', 7.90, true), B('עלה עלה', 9.90)], { group: 'ירקות ופירות' }),
    'avocado':        P('אבוקדו', 'fresh', 'unit', 4, '4 יח׳', [B('מארז', 12.90), B('האס מובחר', 16.90)], { group: 'ירקות ופירות' }),
    'banana':         P('בננות', 'fresh', 'g', 1000, '1 ק״ג', [B('תפזורת', 7.90), B('מארז אורגני', 12.90)], { group: 'ירקות ופירות' }),
    // Bread
    'bread':          P('לחם מחמצת', 'fresh', 'g', 750, '750 ג׳', [B('מותג פרטי רמי לוי', 14.90, true), B('מאפיית אנג׳ל', 19.90)], { group: 'לחמים' }),
    'tortillas':      P('טורטיות מחיטה מלאה', 'fresh', 'unit', 8, '8 יח׳', [B('מותג פרטי רמי לוי', 9.90, true), B('מאפיית אנג׳ל', 11.90)], { group: 'לחמים' }),
    // Pantry (assumed at home by default)
    'olive-oil':      P('שמן זית כתית מעולה', 'pantry', 'ml', 750, '750 מ״ל', [B('מותג פרטי רמי לוי', 29.90, true), B('יד מרדכי', 39.90)]),
    'soy-sauce':      P('רוטב סויה', 'pantry', 'ml', 250, '250 מ״ל', [B('מותג פרטי רמי לוי', 8.90, true), B('קיקומן', 12.90)]),
    'teriyaki':       P('רוטב טריאקי', 'pantry', 'ml', 250, '250 מ״ל', [B('מותג פרטי רמי לוי', 9.90, true), B('קיקומן', 14.90)]),
    'spices':         P('תבלינים: פפריקה, כמון, פלפל שחור, מלח', 'pantry', 'unit', 1, 'ערכה', [B('מותג פרטי רמי לוי', 6.90, true), B('פרג', 11.90)]),
    'tahini':         P('טחינה גולמית', 'pantry', 'g', 500, '500 ג׳', [B('מותג פרטי רמי לוי', 9.90, true), B('הר ברכה', 16.90)]),
    'rice-basmati':   P('אורז בסמטי', 'pantry', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 8.90, true), B('סוגת', 11.90)]),
    'rice-brown':     P('אורז מלא', 'pantry', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 9.90, true), B('סוגת', 12.90)]),
    'quinoa':         P('קינואה אדומה', 'pantry', 'g', 500, '500 ג׳', [B('מותג פרטי רמי לוי', 14.90, true), B('סוגת', 19.90)]),
    'bulgur':         P('בורגול מלא', 'pantry', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 7.90, true), B('סוגת', 10.90)]),
    'ptitim':         P('פתיתים מלאים', 'pantry', 'g', 500, '500 ג׳', [B('מותג פרטי רמי לוי', 4.90, true), B('אסם', 6.90)]),
    'oats':           P('שיבולת שועל', 'pantry', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 9.90, true), B('קוואקר', 15.90)]),
    'peanut-butter':  P('חמאת בוטנים', 'pantry', 'g', 350, '350 ג׳', [B('מותג פרטי רמי לוי', 11.90, true), B('שוקולד פרה בוטנים', 17.90)]),
    'lentils':        P('עדשים ירוקות', 'pantry', 'g', 1000, '1 ק״ג', [B('מותג פרטי רמי לוי', 9.90, true), B('סוגת', 13.90)]),
    'black-beans':    P('שעועית שחורה בשימורים', 'pantry', 'g', 1200, '3 × 400 ג׳', [B('מותג פרטי רמי לוי', 11.90, true), B('פרי ניר', 15.90)]),
    'crushed-tomatoes': P('עגבניות מרוסקות', 'pantry', 'g', 800, '800 ג׳', [B('מותג פרטי רמי לוי', 5.90, true), B('פרי ניר', 7.90)]),
    'tuna':           P('טונה במים', 'pantry', 'g', 640, '4 × 160 ג׳', [B('מותג פרטי רמי לוי', 17.90, true), B('סטארקיסט', 24.90)]),
    'egg-noodles':    P('אטריות ביצים', 'pantry', 'g', 400, '400 ג׳', [B('מותג פרטי רמי לוי', 5.90, true), B('אסם', 8.90)]),
    'rice-noodles':   P('אטריות אורז', 'pantry', 'g', 400, '400 ג׳', [B('מותג פרטי רמי לוי', 7.90, true), B('תאי שף', 11.90)]),
    'frozen-peas':    P('אפונה קפואה', 'pantry', 'g', 800, '800 ג׳', [B('מותג פרטי רמי לוי', 8.90, true), B('סנפרוסט', 12.90)])
  };

  // ---------- Dishes ----------
  // type: anchor | quick | breakfast | backup. diet: meat | fish | veg | vegan.
  // ing: per serving [productId, amount in product unit].
  // tags: words matched against the user's disliked ingredients.
  const D = (o) => Object.assign({ dairy: false, gluten: false, tags: [], img: '' }, o);
  const IMG = {
    mex: 'assets/img/dish-mex.jpg',
    meatballs: 'assets/img/dish-meatballs.jpg',
    shakshuka: 'assets/img/dish-shakshuka.jpg',
    tortilla: 'assets/img/dish-tortilla.jpg',
    noodles: 'assets/img/dish-noodles.jpg'
  };

  const DISHES = {
    // --- Anchor slot 1 (target 620 kcal / 52 g protein) ---
    'mex-chicken': D({ type: 'anchor', name: 'קערת עוף מקסיקני, בסמטי ושעועית שחורה', desc: 'חזה עוף מושרה בתבליני פפריקה מעושנת, כמון ושום לצד אורז בסמטי מתובל, עגבניות צלויות ושעועית עשירה.', kcal: 620, protein: 52, carbs: 64, fat: 14, prep: 45, tiers: ['saver', 'balanced', 'free'], diet: 'meat', tags: ['עוף', 'אורז', 'שעועית', 'פלפל'], icon: 'skillet', img: IMG.mex,
      ing: [['chicken-breast', 200], ['rice-basmati', 75], ['black-beans', 80], ['tomatoes', 100], ['peppers', 75], ['onion', 40], ['olive-oil', 10], ['spices', 0]] }),
    'turkey-shawarma': D({ type: 'anchor', name: 'שווארמה הודו ביתית ופילאף בורגול', desc: 'פרגית הודו בתיבול שווארמה, בורגול מלא עם בצל מקורמל וסלט ירקות קצוץ.', kcal: 605, protein: 54, carbs: 60, fat: 14, prep: 40, tiers: ['saver', 'balanced'], diet: 'meat', gluten: true, tags: ['הודו', 'בורגול', 'טחינה'], icon: 'kebab_dining',
      ing: [['turkey', 200], ['bulgur', 70], ['onion', 50], ['cucumbers', 100], ['tomatoes', 100], ['tahini', 15], ['spices', 0]] }),
    'teriyaki-chicken': D({ type: 'anchor', name: 'חזה עוף טריאקי ואורז מלא', desc: 'קוביות חזה עוף ברוטב טריאקי ושומשום, אורז מלא וברוקולי מאודה.', kcal: 615, protein: 53, carbs: 66, fat: 12, prep: 35, tiers: ['saver', 'balanced'], diet: 'meat', gluten: true, tags: ['עוף', 'אורז', 'ברוקולי', 'סויה'], icon: 'ramen_dining',
      ing: [['chicken-breast', 200], ['rice-brown', 75], ['broccoli', 150], ['teriyaki', 20]] }),
    'thighs-sweetpot': D({ type: 'anchor', name: 'פרגיות בסילאן ובטטה צלויה', desc: 'פרגיות עוף צלויות בסילאן ולימון, קוביות בטטה צלויה וטחינה גולמית.', kcal: 640, protein: 49, carbs: 58, fat: 22, prep: 50, tiers: ['balanced', 'free'], diet: 'meat', tags: ['עוף', 'בטטה', 'טחינה'], icon: 'outdoor_grill',
      ing: [['chicken-thighs', 220], ['sweet-potato', 200], ['tahini', 15], ['olive-oil', 10], ['spices', 0]] }),
    'frozen-fish': D({ type: 'anchor', name: 'פילה מושט בעשבי תיבול ואורז בסמטי', desc: 'פילה מושט אפוי בשמן זית ולימון, אורז בסמטי ופלפלים קלויים.', kcal: 610, protein: 50, carbs: 66, fat: 14, prep: 35, tiers: ['balanced'], diet: 'fish', tags: ['דגים', 'מושט', 'אורז'], icon: 'set_meal',
      ing: [['frozen-fish', 250], ['rice-basmati', 75], ['peppers', 100], ['tomatoes', 100], ['olive-oil', 10]] }),
    'salmon-quinoa': D({ type: 'anchor', name: 'סלמון בעשבי תיבול וקינואה אדומה', desc: 'פילה סלמון טרי בעשבי תיבול, קינואה אדומה וברוקולי צלוי.', kcal: 635, protein: 50, carbs: 52, fat: 24, prep: 35, tiers: ['free'], diet: 'fish', tags: ['דגים', 'סלמון', 'קינואה'], icon: 'set_meal',
      ing: [['salmon', 200], ['quinoa', 70], ['broccoli', 150], ['olive-oil', 10]] }),
    'tofu-teriyaki': D({ type: 'anchor', name: 'טופו טריאקי צרוב, אורז מלא וברוקולי', desc: 'קוביות טופו קשה צרובות ברוטב טריאקי, אורז מלא וברוקולי מאודה.', kcal: 625, protein: 48, carbs: 62, fat: 20, prep: 30, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', gluten: true, tags: ['טופו', 'סויה', 'אורז', 'ברוקולי'], icon: 'eco',
      ing: [['tofu', 300], ['rice-brown', 60], ['broccoli', 150], ['teriyaki', 20]] }),
    'lentil-tofu': D({ type: 'anchor', name: 'קערת עדשים וטופו צרוב', desc: 'עדשים ירוקות, טופו צרוב בסויה וירקות שורש קלויים.', kcal: 610, protein: 36, carbs: 70, fat: 18, prep: 35, tiers: ['saver', 'balanced'], diet: 'vegan', gluten: true, tags: ['טופו', 'עדשים', 'סויה'], icon: 'eco',
      ing: [['lentils', 80], ['tofu', 150], ['sweet-potato', 150], ['soy-sauce', 10]] }),
    // --- Anchor slot 2 (target 680 kcal / 48 g protein) ---
    'beef-meatballs': D({ type: 'anchor', name: 'קציצות בקר ברוטב עגבניות ופירה', desc: 'קציצות בקר טחון עם עשבי תיבול ובצל זהוב ברוטב עגבניות ופפריקה על מצע פירה.', kcal: 680, protein: 48, carbs: 58, fat: 22, prep: 55, tiers: ['balanced', 'free'], diet: 'meat', tags: ['בקר', 'תפוחי אדמה', 'עגבניות'], icon: 'skillet', img: IMG.meatballs,
      ing: [['ground-beef', 160], ['potatoes', 250], ['crushed-tomatoes', 130], ['onion', 40], ['olive-oil', 10], ['spices', 0]] }),
    'chicken-ptitim': D({ type: 'anchor', name: 'קציצות עוף ברוטב עגבניות ופתיתים', desc: 'קציצות עוף טחון עם פטרוזיליה ברוטב עגבניות ביתי, פתיתים מלאים.', kcal: 665, protein: 50, carbs: 70, fat: 16, prep: 45, tiers: ['saver', 'balanced'], diet: 'meat', gluten: true, tags: ['עוף', 'פתיתים', 'עגבניות'], icon: 'soup_kitchen',
      ing: [['chicken-breast', 180], ['ptitim', 70], ['crushed-tomatoes', 130], ['onion', 40], ['spices', 0]] }),
    'beef-stirfry': D({ type: 'anchor', name: 'בקר מוקפץ ואורז בסמטי', desc: 'רצועות בקר מוקפצות עם פלפלים ובצל, רוטב סויה ואורז בסמטי.', kcal: 695, protein: 47, carbs: 66, fat: 20, prep: 30, tiers: ['balanced', 'free'], diet: 'meat', gluten: true, tags: ['בקר', 'אורז', 'סויה', 'פלפל'], icon: 'ramen_dining',
      ing: [['beef-strips', 180], ['rice-basmati', 75], ['peppers', 120], ['onion', 40], ['soy-sauce', 15]] }),
    'beef-mushroom': D({ type: 'anchor', name: 'תבשיל בקר ופטריות ופירה', desc: 'נתחי בקר מבושלים לאט עם פטריות שמפיניון, פירה חלק.', kcal: 690, protein: 46, carbs: 54, fat: 26, prep: 70, tiers: ['balanced', 'free'], diet: 'meat', tags: ['בקר', 'פטריות', 'תפוחי אדמה'], icon: 'skillet',
      ing: [['beef-strips', 180], ['mushrooms', 100], ['potatoes', 250], ['onion', 40], ['olive-oil', 10]] }),
    'entrecote': D({ type: 'anchor', name: 'אנטריקוט צלוי ותפוחי אדמה אפויים', desc: 'סטייק אנטריקוט, תפוחי אדמה בעשבי תיבול וסלט עלים.', kcal: 705, protein: 51, carbs: 42, fat: 34, prep: 40, tiers: ['free'], diet: 'meat', tags: ['בקר', 'תפוחי אדמה'], icon: 'outdoor_grill',
      ing: [['entrecote', 220], ['potatoes', 250], ['leafy', 50], ['olive-oil', 10]] }),
    'lentil-chili': D({ type: 'anchor', name: 'צ׳ילי עדשים וטופו עם אורז מלא', desc: 'עדשים ירוקות, טופו מפורר ועגבניות מרוסקות בתיבול מעושן, לצד אורז מלא.', kcal: 670, protein: 45, carbs: 80, fat: 14, prep: 45, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', tags: ['עדשים', 'טופו', 'עגבניות', 'פלפל'], icon: 'eco',
      ing: [['lentils', 90], ['tofu', 150], ['crushed-tomatoes', 150], ['rice-brown', 50], ['peppers', 80], ['onion', 40], ['spices', 0]] }),

    // --- Quick dinner slot 1 (target 440 / 32) ---
    'shakshuka': D({ type: 'quick', name: 'שקשוקה, פטה ולחם מחמצת', desc: 'שקשוקה עגבניות ופלפלים עם 2 ביצים, פטה 5% ופרוסת מחמצת.', kcal: 440, protein: 32, carbs: 38, fat: 18, prep: 12, tiers: ['saver', 'balanced', 'free'], diet: 'veg', dairy: true, gluten: true, tags: ['ביצים', 'גבינה', 'עגבניות'], icon: 'egg', img: IMG.shakshuka,
      ing: [['eggs', 2], ['feta', 50], ['bread', 80], ['tomatoes', 200], ['peppers', 100], ['olive-oil', 5]] }),
    'tuna-salad': D({ type: 'quick', name: 'סלט עשיר עם טונה וביצים', desc: 'מלפפון, עגבניה ועלים עם טונה במים, 2 ביצים קשות ושמן זית.', kcal: 450, protein: 34, carbs: 14, fat: 26, prep: 10, tiers: ['saver', 'balanced', 'free'], diet: 'fish', tags: ['טונה', 'דגים', 'ביצים'], icon: 'set_meal',
      ing: [['tuna', 160], ['eggs', 2], ['cucumbers', 150], ['tomatoes', 150], ['leafy', 40], ['olive-oil', 10]] }),
    'tofu-shakshuka': D({ type: 'quick', name: 'שקשוקת טופו מפורר', desc: 'טופו מפורר ברוטב עגבניות ופלפלים בתיבול כורכום, עם פרוסת מחמצת.', kcal: 430, protein: 30, carbs: 40, fat: 16, prep: 12, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', gluten: true, tags: ['טופו', 'עגבניות'], icon: 'eco',
      ing: [['tofu', 200], ['tomatoes', 200], ['peppers', 100], ['bread', 80], ['olive-oil', 5]] }),
    // --- Quick dinner slot 2 (target 490 / 42) ---
    'chicken-tortilla': D({ type: 'quick', name: 'טורטייה עוף מפורק וגוואקמולי', desc: 'חזה עוף צלוי מפורק בטורטייה מלאה, גוואקמולי ביתי ועלי בייבי.', kcal: 490, protein: 42, carbs: 40, fat: 16, prep: 10, tiers: ['saver', 'balanced', 'free'], diet: 'meat', gluten: true, tags: ['עוף', 'אבוקדו'], icon: 'lunch_dining', img: IMG.tortilla,
      ing: [['chicken-breast', 150], ['tortillas', 2], ['avocado', 0.5], ['leafy', 40], ['tomatoes', 60]] }),
    'tuna-tortilla': D({ type: 'quick', name: 'טורטייה טונה וירקות', desc: 'טונה במים עם מלפפון, עלים וטחינה בטורטייה מחיטה מלאה.', kcal: 480, protein: 40, carbs: 42, fat: 15, prep: 10, tiers: ['saver', 'balanced', 'free'], diet: 'fish', gluten: true, tags: ['טונה', 'דגים', 'טחינה'], icon: 'lunch_dining',
      ing: [['tuna', 160], ['tortillas', 2], ['cucumbers', 100], ['leafy', 40], ['tahini', 15]] }),
    'tofu-wrap': D({ type: 'quick', name: 'ראפ טופו צרוב ואבוקדו', desc: 'טופו צרוב בסויה, אבוקדו ועלים בטורטייה מלאה.', kcal: 485, protein: 38, carbs: 42, fat: 18, prep: 12, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', gluten: true, tags: ['טופו', 'אבוקדו', 'סויה'], icon: 'lunch_dining',
      ing: [['tofu', 250], ['tortillas', 2], ['avocado', 0.5], ['leafy', 40], ['soy-sauce', 10]] }),
    'lentil-tahini-bowl': D({ type: 'quick', name: 'קערת עדשים, טופו וטחינה', desc: 'עדשים מבושלות (מנת אצווה), קוביות טופו, מלפפון ועגבניה עם טחינה — טבעוני וללא גלוטן.', kcal: 495, protein: 40, carbs: 48, fat: 16, prep: 12, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', tags: ['עדשים', 'טופו', 'טחינה'], icon: 'eco',
      ing: [['lentils', 80], ['tofu', 150], ['cucumbers', 100], ['tomatoes', 100], ['tahini', 15]] }),
    'chicken-rice-bowl': D({ type: 'quick', name: 'קערת עוף, אורז וירקות טריים', desc: 'חזה עוף צלוי, אורז בסמטי, מלפפון ועגבניה — ללא גלוטן.', kcal: 495, protein: 43, carbs: 52, fat: 10, prep: 15, tiers: ['saver', 'balanced', 'free'], diet: 'meat', tags: ['עוף', 'אורז'], icon: 'rice_bowl',
      ing: [['chicken-breast', 150], ['rice-basmati', 60], ['cucumbers', 100], ['tomatoes', 100]] }),
    // --- Breakfast slot (target 380 / 30) ---
    'oats-yogurt': D({ type: 'breakfast', name: 'שיבולת שועל ויוגורט חלבון', desc: 'שיבולת שועל עם יוגורט חלבון 0% ובננה פרוסה.', kcal: 380, protein: 30, carbs: 56, fat: 5, prep: 5, tiers: ['saver', 'balanced', 'free'], diet: 'veg', dairy: true, gluten: true, tags: ['יוגורט', 'בננה', 'שיבולת שועל'], icon: 'breakfast_dining',
      ing: [['oats', 60], ['greek-yogurt', 1], ['banana', 120]] }),
    'cottage-toast': D({ type: 'breakfast', name: 'טוסט מחמצת, קוטג׳ וביצה', desc: 'פרוסות מחמצת עם קוטג׳ 5%, ביצה קשה ומלפפון.', kcal: 370, protein: 31, carbs: 34, fat: 12, prep: 8, tiers: ['saver', 'balanced', 'free'], diet: 'veg', dairy: true, gluten: true, tags: ['גבינה', 'ביצים'], icon: 'bakery_dining',
      ing: [['cottage', 125], ['bread', 80], ['eggs', 1], ['cucumbers', 100]] }),
    'oats-pb': D({ type: 'breakfast', name: 'שיבולת שועל, משקה סויה וחמאת בוטנים', desc: 'דייסת שיבולת שועל במשקה סויה עם חמאת בוטנים ובננה.', kcal: 385, protein: 28, carbs: 52, fat: 12, prep: 6, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', gluten: true, tags: ['סויה', 'בוטנים', 'בננה'], icon: 'breakfast_dining',
      ing: [['oats', 70], ['soy-milk', 300], ['peanut-butter', 20], ['banana', 100]] }),
    'eggs-potato': D({ type: 'breakfast', name: 'חביתה, תפוח אדמה אפוי וירקות', desc: 'חביתה מ-3 ביצים, תפוח אדמה אפוי וסלט ירקות — ללא גלוטן וללא לקטוז.', kcal: 375, protein: 29, carbs: 30, fat: 15, prep: 12, tiers: ['saver', 'balanced', 'free'], diet: 'veg', tags: ['ביצים', 'תפוחי אדמה'], icon: 'egg',
      ing: [['eggs', 3], ['potatoes', 200], ['cucumbers', 100], ['tomatoes', 100]] }),
    // --- Backup pantry meal (target 510 / 38) — pantry products only ---
    'noodles-tuna': D({ type: 'backup', name: 'מוקפץ נודלס, טונה, אפונה וטריאקי', desc: 'אטריות ביצים, טונה במים, אפונה קפואה ורוטב טריאקי — הכל מהמזווה.', kcal: 510, protein: 38, carbs: 62, fat: 10, prep: 10, tiers: ['saver', 'balanced', 'free'], diet: 'fish', gluten: true, tags: ['טונה', 'דגים', 'סויה'], icon: 'ramen_dining', img: IMG.noodles,
      ing: [['egg-noodles', 90], ['tuna', 160], ['frozen-peas', 100], ['teriyaki', 20]] }),
    'lentil-noodles': D({ type: 'backup', name: 'מוקפץ עדשים, אטריות אורז ואפונה', desc: 'עדשים מבושלות, אטריות אורז ואפונה קפואה ברוטב סויה — הכל מהמזווה.', kcal: 505, protein: 35, carbs: 80, fat: 6, prep: 15, tiers: ['saver', 'balanced', 'free'], diet: 'vegan', gluten: true, tags: ['עדשים', 'סויה'], icon: 'eco',
      ing: [['lentils', 100], ['rice-noodles', 70], ['frozen-peas', 100], ['soy-sauce', 15]] }),
    'tuna-rice': D({ type: 'backup', name: 'אורז, טונה ושעועית שחורה', desc: 'אורז בסמטי עם טונה, שעועית שחורה ועגבניות מרוסקות — ללא גלוטן.', kcal: 515, protein: 40, carbs: 70, fat: 6, prep: 15, tiers: ['saver', 'balanced', 'free'], diet: 'fish', tags: ['טונה', 'דגים', 'שעועית', 'אורז'], icon: 'rice_bowl',
      ing: [['rice-basmati', 70], ['tuna', 160], ['black-beans', 100], ['crushed-tomatoes', 100]] })
  };

  // ---------- Weekly slots ----------
  // target: macro target the ±5% / ±10% swap rule is measured against.
  // base: default dish per budget tier (the first one that fits the profile is used).
  const SLOTS = {
    anchor1:   { type: 'anchor', label: 'ארוחת עוגן 1', servings: 3, cookDay: 'ראשון', days: 'ראשון — שלישי (צהריים)', target: { kcal: 620, protein: 52 },
                 base: { saver: ['mex-chicken', 'teriyaki-chicken'], balanced: ['mex-chicken', 'thighs-sweetpot'], free: ['salmon-quinoa', 'thighs-sweetpot'] } },
    anchor2:   { type: 'anchor', label: 'ארוחת עוגן 2', servings: 3, cookDay: 'שלישי', days: 'רביעי — שישי (צהריים)', target: { kcal: 680, protein: 48 },
                 base: { saver: ['chicken-ptitim'], balanced: ['beef-meatballs'], free: ['beef-meatballs', 'beef-stirfry'] } },
    quick1:    { type: 'quick', label: 'ארוחה מהירה 1', servings: 3, days: 'ערב • א׳, ג׳, ה׳', target: { kcal: 440, protein: 32 },
                 base: { saver: ['shakshuka'], balanced: ['shakshuka'], free: ['shakshuka'] } },
    quick2:    { type: 'quick', label: 'ארוחה מהירה 2', servings: 3, days: 'ערב • ב׳, ד׳, ו׳', target: { kcal: 490, protein: 42 },
                 base: { saver: ['chicken-tortilla'], balanced: ['chicken-tortilla'], free: ['chicken-tortilla'] } },
    breakfast: { type: 'breakfast', label: 'ארוחת בוקר מהירה', servings: 7, days: 'בוקר • כל יום', target: { kcal: 380, protein: 30 },
                 base: { saver: ['oats-yogurt'], balanced: ['oats-yogurt'], free: ['oats-yogurt'] } },
    backup:    { type: 'backup', label: 'ארוחת גיבוי (מזווה)', servings: 1, days: 'ערב עמוס • שבת', target: { kcal: 510, protein: 38 },
                 base: { saver: ['noodles-tuna'], balanced: ['noodles-tuna'], free: ['noodles-tuna'] } }
  };
  const KCAL_TOL = 0.05, PROTEIN_TOL = 0.10;

  // ---------- Profile filters ----------
  function dietOk(dish, restrictions) {
    const r = restrictions || [];
    if (r.includes('טבעוני') && dish.diet !== 'vegan') return false;
    if (r.includes('צמחוני') && !['veg', 'vegan'].includes(dish.diet)) return false;
    if (r.includes('ללא גלוטן') && dish.gluten) return false;
    if (r.includes('ללא לקטוז') && dish.dairy) return false;
    return true;
  }
  function dislikeHit(dish, dislikes) {
    const words = (dislikes || []).map(d => d.trim()).filter(Boolean);
    const haystack = dish.tags.concat(dish.ing.map(([p]) => PRODUCTS[p].name));
    return words.find(w => haystack.some(h => h.includes(w) || w.includes(h))) || null;
  }
  function fitsProfile(dish, profile) {
    return dish.tiers.includes(profile.tier) && dietOk(dish, profile.restrictions) && !dislikeHit(dish, profile.dislikes);
  }
  function withinTolerance(dish, slot) {
    const t = SLOTS[slot].target;
    return Math.abs((dish.kcal - t.kcal) / t.kcal) <= KCAL_TOL && Math.abs((dish.protein - t.protein) / t.protein) <= PROTEIN_TOL;
  }
  function slotCandidates(slot, profile) {
    const s = SLOTS[slot];
    return Object.keys(DISHES).filter(id => DISHES[id].type === s.type && withinTolerance(DISHES[id], slot) && fitsProfile(DISHES[id], profile));
  }

  // Resolve the weekly menu: saved swap if still valid → tier base → any fitting dish.
  function buildMenu(profile, overrides) {
    const menu = {};
    Object.keys(SLOTS).forEach(slot => {
      const valid = slotCandidates(slot, profile);
      const chosen = overrides && overrides[slot];
      const bases = SLOTS[slot].base[profile.tier] || [];
      menu[slot] = (chosen && valid.includes(chosen) && chosen)
        || bases.find(id => valid.includes(id))
        || valid[0]
        || null; // nothing fits this profile
    });
    return menu;
  }

  // Swap options for a slot, with deviations vs the slot target.
  function swapOptions(slot, profile, currentId) {
    const t = SLOTS[slot].target;
    return slotCandidates(slot, profile)
      .filter(id => id !== currentId)
      .map(id => {
        const d = DISHES[id];
        return { id, dish: d, kcalDiff: (d.kcal - t.kcal) / t.kcal, proteinDiff: (d.protein - t.protein) / t.protein, costDiff: dishCost(id, profile) - (currentId ? dishCost(currentId, profile) : 0) };
      })
      .sort((a, b) => Math.abs(a.kcalDiff) - Math.abs(b.kcalDiff));
  }

  // ---------- Pricing ----------
  function defaultBrandIndex(productId, tier) {
    // saver → cheapest (private label); balanced → known brand; free → premium meat & fish, known brand elsewhere
    const p = PRODUCTS[productId];
    const n = p.brands.length;
    if (tier === 'saver') return 0;
    if (tier === 'free' && p.group === 'בשר ודגים') return n - 1;
    return Math.min(1, n - 1);
  }
  function brandIndex(productId, tier, cartState) {
    const o = cartState && cartState.brands && cartState.brands[productId];
    return (o !== undefined && PRODUCTS[productId].brands[o]) ? o : defaultBrandIndex(productId, tier);
  }
  function price(productId, idx, store) {
    const p = PRODUCTS[productId];
    const base = p.brands[idx].price;
    return store === 'שופרסל' ? Math.round(base * p.shuf * 10) / 10 : base;
  }
  // Rough per-week cost of one dish slot (pro-rated fresh ingredients) — used for swap deltas.
  function dishCost(dishId, profile) {
    const d = DISHES[dishId];
    return d.ing.reduce((sum, [pid, q]) => {
      const p = PRODUCTS[pid];
      if (p.cat !== 'fresh' || !q) return sum;
      return sum + (q / p.pack) * p.brands[defaultBrandIndex(pid, profile.tier)].price * 3;
    }, 0);
  }
  const sku = (pid, idx) => 'SS-' + pid.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) + '-' + String(idx + 1).padStart(2, '0');

  // ---------- Cart aggregation ----------
  // cartState: { brands: {pid: idx}, removed: [pid], extraPacks: {pid: n}, pantryAdded: [pid], store }
  function buildCart(profile, menu, cartState) {
    const state = Object.assign({ brands: {}, removed: [], extraPacks: {}, pantryAdded: [], store: 'רמי לוי' }, cartState || {});
    const need = {}; // pid → { amount, uses: [{slot, dish, amount}] }
    Object.entries(menu).forEach(([slot, dishId]) => {
      if (!dishId) return;
      const d = DISHES[dishId];
      const servings = SLOTS[slot].servings;
      d.ing.forEach(([pid, q]) => {
        need[pid] = need[pid] || { amount: 0, uses: [] };
        const amount = q * servings;
        need[pid].amount += amount;
        need[pid].uses.push({ slot, dishId, amount });
      });
    });

    // Private-label brands are named after the active chain
    const named = (b) => Object.assign({}, b, { name: b.privateLabel ? 'מותג פרטי ' + state.store : b.name });
    const line = (pid) => {
      const p = PRODUCTS[pid];
      const n = need[pid];
      const idx = brandIndex(pid, profile.tier, state);
      const neededPacks = n.amount > 0 ? Math.ceil(n.amount / p.pack - 1e-9) : 1;
      const packs = Math.max(1, neededPacks + (state.extraPacks[pid] || 0));
      const unitPrice = price(pid, idx, state.store);
      return {
        id: pid, product: p, need: n.amount, uses: n.uses, packs, neededPacks,
        brandIdx: idx, brand: named(p.brands[idx]), sku: sku(pid, idx), unitPrice,
        total: Math.round(unitPrice * packs * 100) / 100,
        leftover: Math.max(0, packs * p.pack - n.amount),
        removed: state.removed.includes(pid),
        added: state.pantryAdded.includes(pid),
        alternatives: p.brands.map((b, i) => ({ idx: i, brand: named(b), unitPrice: price(pid, i, state.store), sku: sku(pid, i) }))
      };
    };

    const order = Object.keys(PRODUCTS);
    const fresh = order.filter(pid => need[pid] && PRODUCTS[pid].cat === 'fresh').map(line);
    const pantry = order.filter(pid => need[pid] && PRODUCTS[pid].cat === 'pantry').map(line);
    const inCart = fresh.filter(l => !l.removed).concat(pantry.filter(l => l.added));
    const total = Math.round(inCart.reduce((s, l) => s + l.total, 0) * 100) / 100;

    // Same cart priced at both chains (for the comparison widget)
    const at = (store) => Math.round(inCart.reduce((s, l) => s + price(l.id, l.brandIdx, store) * l.packs, 0) * 100) / 100;
    return {
      fresh, pantry, inCart, total, store: state.store,
      packs: inCart.reduce((s, l) => s + l.packs, 0),
      chains: { 'רמי לוי': at('רמי לוי'), 'שופרסל': at('שופרסל') }
    };
  }

  // Human-readable amount in a product's unit
  function fmtAmount(pid, amount) {
    const u = PRODUCTS[pid].unit;
    if (u === 'unit') return (Math.round(amount * 10) / 10).toLocaleString('he-IL') + ' יח׳';
    if (u === 'ml') return amount >= 1000 ? (amount / 1000).toLocaleString('he-IL', { maximumFractionDigits: 2 }) + ' ל׳' : Math.round(amount) + ' מ״ל';
    return amount >= 1000 ? (amount / 1000).toLocaleString('he-IL', { maximumFractionDigits: 2 }) + ' ק״ג' : Math.round(amount) + ' ג׳';
  }

  window.ShelfSenseData = {
    PRODUCTS, DISHES, SLOTS, KCAL_TOL, PROTEIN_TOL,
    dietOk, dislikeHit, fitsProfile, slotCandidates, buildMenu, swapOptions,
    buildCart, dishCost, fmtAmount, sku, defaultBrandIndex, price
  };
})();
