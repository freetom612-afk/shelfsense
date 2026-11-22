/* ShelfSense — steps for the guided cooking mode (cook.html).
 *   ShelfSenseCook.stepsFor(dishId) -> [{ title, body, min, kind, tip }]
 *   kind: prep | boil | sear | bake | mix | pack | serve  (picks the animated scene)
 * Sources, in order: the flagship dish (hand-written), the low-calorie library (assets/recipes.js),
 * then a generic three-step fallback built from the dish in assets/data.js.
 */
(function () {
  const KIND_LABEL = { prep: 'הכנה', boil: 'בישול', sear: 'צריבה', bake: 'אפייה', mix: 'ערבוב', pack: 'חלוקה', serve: 'הגשה' };

  // Pick a scene from the Hebrew wording of a step
  function classify(text) {
    const t = String(text);
    if (/תנור|אופים|צולים|גריל/.test(t)) return 'bake';
    if (/צורבים|מטגנים|מקפיצים|מחבת|צריבה/.test(t)) return 'sear';
    if (/מבשלים|רותח|מרתיחים|מאדים|מרק|סיר/.test(t)) return 'boil';
    if (/מחלקים|קופסאות|מקררים/.test(t)) return 'pack';
    if (/מגישים|מרכיבים בצלחת|מסדרים בקערה/.test(t)) return 'serve';
    if (/מערבבים|מתבלים|מוסיפים|מזלפים|טוחנים/.test(t)) return 'mix';
    return 'prep';
  }

  const FLAGSHIP = 'mex-chicken';
  const FLAGSHIP_STEPS = [
    { title: 'בישול בסיס האורז הבסמטי', body: 'שוטפים את האורז עד למים צלולים. מבשלים ביחס של 1:1.5 מים רותחים עם מעט מלח. מכבים ומשהים 5 דקות מכוסה לשמירה על מרקם אוורירי ומופרד.', min: 12, kind: 'boil', tip: 'הפעילו את הטיימר ועברו לשלב הבא. האורז מתבשל בזמן שאתם צורבים.' },
    { title: 'תיבול וצריבת חזה העוף', body: 'מערבבים את רצועות העוף עם כף שמן זית, פפריקה מעושנת, כמון, שום ומלח. מחממים מחבת פסים לוהטת וצורבים 3-4 דקות מכל צד עד להזהבה עסיסית.', min: 8, kind: 'sear', tip: 'אל תזיזו את העוף בדקה הראשונה. כך נוצר קרום זהוב.' },
    { title: 'הקפצת שעועית וירקות', body: 'באותה מחבת ללא שטיפה, מקפיצים בצל, פלפלים ועגבניות, ומוסיפים את השעועית השחורה לספיגת מיצי הצריבה והתבלינים.', min: 3, kind: 'sear', tip: 'המחבת עדיין חמה ומלאה בטעם. לא שוטפים אותה.' },
    { title: 'הרכבה וחלוקה לקופסאות', body: 'מחלקים בצורה שווה ל-3 קופסאות זכוכית אטומות הרמטית: מצע אורז, רצועות עוף צרובות, ותערובת שעועית וירקות.', min: 0, kind: 'pack', tip: 'מניחים לתערובת להתקרר מעט לפני סגירת המכסים. נשמר במקרר עד 4 ימים.' }
  ];

  function stepsFor(dishId) {
    if (dishId === FLAGSHIP) return FLAGSHIP_STEPS.map((s) => Object.assign({}, s));

    const lib = (window.ShelfSenseRecipes || []).find((r) => r.id === dishId);
    if (lib) {
      const used = {};
      return lib.steps.map(([text, min]) => {
        const kind = classify(text);
        used[kind] = (used[kind] || 0) + 1;
        return { title: KIND_LABEL[kind] + (used[kind] > 1 ? ' ' + used[kind] : ''), body: text, min: min || 0, kind, tip: '' };
      });
    }

    const D = window.ShelfSenseData;
    const d = D && D.DISHES[dishId];
    if (!d) return [];
    const fresh = d.ing.filter(([pid]) => D.PRODUCTS[pid].cat === 'fresh').map(([pid]) => D.PRODUCTS[pid].name);
    return [
      { title: 'הכנת המצרכים', body: 'שוטפים, חותכים ומודדים: ' + (fresh.join(', ') || 'מוצרי המזווה') + '.', min: 0, kind: 'prep', tip: '' },
      { title: 'בישול', body: d.desc, min: Math.max(3, d.prep - 8), kind: classify(d.desc) === 'prep' ? 'boil' : classify(d.desc), tip: '' },
      { title: d.type === 'anchor' ? 'חלוקה לקופסאות' : 'הגשה', body: d.type === 'anchor' ? 'מחלקים לקופסאות ומקררים. טרי עד 4 ימים.' : 'מרכיבים בצלחת ומגישים מיד.', min: 0, kind: d.type === 'anchor' ? 'pack' : 'serve', tip: '' }
    ];
  }

  window.ShelfSenseCook = { stepsFor, classify, KIND_LABEL };
})();
