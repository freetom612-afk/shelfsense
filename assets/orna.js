/* ShelfSense — Orna (אורנה), the in-app personal nutritionist agent.
 * Runs 100% locally in the browser (no server / no API key required).
 * - Strict topic guardrail: blocks off-topic subjects, prompt injection, and clinical medical advice.
 * - Natural Hebrew conversation: learns user name, activity level, goal, body metrics, budget & dietary preferences.
 * - Direct integration with window.ShelfSense & window.ShelfSenseData: builds & swaps weekly Lego menus live.
 */
(function () {
  const SS = window.ShelfSense;
  const D = window.ShelfSenseData;

  const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // =========================================================================
  // 1. STRICT TOPIC GUARDRAIL (Blocks all non-nutrition / non-ShelfSense chat)
  // =========================================================================
  const INJECTION_RE = [
    /תתעל(?:ם|מי|מו)\s*(מ|מה)/, /שכח[י]?\s*(את|שאת|הכל|מההוראות|מהכללים)/,
    /תתנהג[י]?\s*כמו/, /תעמיד[י]?\s*פנים/, /שנ[יה]\s*את\s*התפקיד/,
    /את\s*לא\s*תזונאית/, /הוראות\s*מערכת/, /פרומפט/,
    /ignore\s+(all\s+)?(previous|prior|system)/i, /system\s*prompt/i,
    /jailbreak/i, /pretend\s+you\s+are/i, /act\s+as\s+(a|an)/i, /\bDAN\b/
  ];

  const MEDICAL_RE = [
    /תרופה|תרופות|מרשם|אנטיביוטיקה|אינסולין|סטטינים|מינון/,
    /אבחון|לאבחן|מחלה|מחלות|סוכרת|לחץ\s*דם|כולסטרול\s*גבוה|בלוטת\s*התריס/,
    /בדיקות\s*דם|בדיקת\s*דם|כאב[ים]*\s*(בחזה|בבטן|ראש)|סחרחורת|התעלפות/,
    /הפרעת\s*אכילה|אנורקסיה|בולימיה|סרטן|דיכאון|חרדה|הריון\s*בסיכון/
  ];

  const OFF_TOPIC_RE = [
    // Politics, news, military, law
    /פוליטיק|ממשלה|בחירות|כנסת|ראש\s*הממשלה|נשיא|מפלגה|בג["״]?ץ|בית\s*משפט/,
    /נתניהו|ביבי|לפיד|גנץ|סמוטריץ|בן\s*גביר|טראמפ|ביידן|פוטין/,
    /חדשות|מלחמה|מבצע\s*צבאי|צה["״]?ל|טילים|חמאס|חיזבאללה|איראן/,
    /עורך\s*דין|תביעה|חוזה\s*שכירות|פסק\s*דין|חוק\s*העונשין/,
    // Programming, tech, AI
    /תכנות|קוד\s*(ב|של|בפייתון|בג׳אווה)?|תכת(?:וב|בי)\s*קוד|תבנ[יה]\s*אתר|אלגוריתם|דאטהבייס|מסד\s*נתונים/,
    /\b(python|javascript|typescript|java|html|css|sql|react|node\.?js|github|git|docker|linux|chatgpt|openai|claude|llm|api\s*key)\b/i,
    /פייתון|ג׳אווה|גאווהסקריפט|ריאקט|באג\s*בקוד|שגיאת\s*קוד|האקינג|פריצה/,
    // Finance, crypto, stocks, real estate, gambling (excludes grocery budget)
    /מניות|בורסה|ביטקוין|קריפטו|אתריום|נדל["״]?ן|משכנתא|השקעות|תיק\s*השקעות|שוק\s*ההון/,
    /הימורים|קזינו|לוטו|טוטו|שער\s*הדולר|בנק\s*ישראל|ריבית\s*בנק/,
    /\b(bitcoin|crypto|ethereum|stocks|forex|nasdaq|sp500)\b/i,
    // Entertainment, jokes, creative writing, games
    /בדיח(ה|ות)|תספר[י]?\s*(לי\s*)?(בדיחה|סיפור)|ספר[י]?\s*(לי\s*)?(בדיחה|סיפור)/,
    /תכת(?:וב|בי)\s*(לי\s*)?(שיר|סיפור|חמשיר|מכתב|ברכה|נאום)|שיר\s*על|חיד(ה|ות)/,
    /סרט(ים)?\s*(מומלץ|טוב|חדש)|סדר(ה|ות)\s*(מומלצת|טובה)|נטפליקס|ספוטיפיי|פלייסטיישן|אקסבוקס|פורטנייט|מיינקראפט/,
    /\b(joke|poem|riddle|netflix|movie|spotify|playstation|minecraft)\b/i,
    // Weather, travel, cars, homework, trivia, geography, history
    /מזג\s*(ה)?אוויר|תחזית|יירד\s*גשם|כמה\s*מעלות\s*בחוץ|\bweather\b/i,
    /טיס(ה|ות)|כרטיס\s*טיסה|חופשה\s*ב|מלון\s*ב|דרכון|ויזה|אטרקציות\s*ב/,
    /מכונית|קניית\s*רכב|ביטוח\s*רכב|מוסך|טסט\s*לאוטו|יונדאי|טויוטה|טסלה/,
    /שיעורי\s*בית|מבחן\s*בגרות|היסטוריה|מלחמת\s*העולם|גיאוגרפיה|מה\s*בירת|בירת\s*(צרפת|איטליה|ספרד|ארה|ישראל|אנגליה)/,
    /מתמטיקה|משוואה|אינטגרל|נגזרת|כמה\s*זה\s*\d+\s*[\+\-\*\/×÷]/,
    /מה\s*השעה|איזה\s*יום\s*היום|תתרג(?:ם|מי)\s*לי|תרגום\s*ל(אנגלית|ערבית|ספרדית|צרפתית)/,
    // Spectator sports / leagues / scores (personal exercise is allowed)
    /ליגת\s*האלופות|מונדיאל|יורו\s*20|מכבי\s*(תל\s*אביב|חיפה)|הפועל|בית["״]?ר|ברצלונה|ריאל\s*מדריד|\bnba\b/i,
    /מי\s*ניצח|תוצאת\s*המשחק|טבלת\s*הליגה|שערים\s*במשחק/
  ];

  // Keywords that belong to nutrition, fitness/activity, body profile, or ShelfSense
  const DOMAIN_RE = [
    /תזונ|תפריט|ארוח(ה|ות)|אוכל|מאכל|מנה|מנות|מתכון|מתכונים|בישול|לבשל|מבשל|לאכול|אכילה/,
    /קלורי|קק["״׳]?ל|חלבון|פחמימ|שומן|מאקרו|ערכים|סיבים|שובע|רעב|שתייה|מים|נוזלים/,
    /חיטוב|דיאטה|הרזיה|להרזות|לרדת|ירידה|מסה|שריר|לעלות|עלייה|שמירה|לשמור|תחזוקה|גרעון|גירעון|עודף/,
    /פעילות|אימון|אימונים|מתאמ(?:ן|נת|נים)|ספורט|כושר|חדר\s*כושר|ריצה|רץ|רצה|הליכה|הולך|הולכת|שחייה|שוחה|אופניים|רוכב|פילאטיס|יוגה|קרוספיט|יושבני|משרד|משרדית|פיזית|צעדים|כדורגל|כדורסל|טניס|איגרוף|שחיה|פעמים\s*בשבוע|פעם\s*בשבוע|כל\s*יום/,
    /משקל|שוקל|גובה|גיל|בן\s*\d|בת\s*\d|גבר|אישה|זכר|נקבה|ק["״׳]?ג|ס["״׳]?מ|פרופיל|נתונים/,
    /תקציב|חסכוני|מאוזן|חופשי|פרימיום|סופר|קניות|סל|עגלה|רמי\s*לוי|שופרסל|מזווה|לגו|עוגן|גיבוי|מהירה|בוקר|צהריים|ערב|החלף|להחליף|החלפה|תחליפ|מחיר|עלות|שקל|ש["״]?ח|₪|280|380|520/,
    /כשר|כשרות|צמחוני|טבעוני|גלוטן|לקטוז|חלבי|בשרי|פרווה|הגבל|העדפ|לא\s*אוהב|שונא|שנוא|בלי\s+\S+|ללא\s+\S+/,
    /עוף|הודו|בקר|סטייק|אנטריקוט|פרגית|פרגיות|דג|דגים|סלמון|מושט|אמנון|טונה|ביצה|ביצים|קוטג|גבינה|יוגורט|פטה|טופו|סויה|עדשים|שעועית|חומוס|אורז|קינואה|בורגול|פתיתים|פסטה|נודלס|אטריות|לחם|מחמצת|טורטייה|טורטיה|שיבולת\s*שועל|תפוח\s*אדמה|תפוחי\s*אדמה|פירה|בטטה|ירקות|סלט|עגבני|מלפפון|פלפל|בצל|ברוקולי|פטריות|כוסברה|חציל|אבוקדו|בננה|קישוא|גזר|תרד|דלעת|טחינה|שמן\s*זית|חמאת\s*בוטנים|שקשוקה|קציצות|שווארמה|מרק|מוקפץ|חביתה|טוסט/,
    /אורנה|שלפסנס|shelfsense|קוראים\s*לי|קוראים\s*לך|שמי\s+|השם\s*שלי/i
  ];

  const GREETING_META_RE = /^(היי+|הי+|שלום|אהלן|בוקר\s*טוב|ערב\s*טוב|צהריים\s*טובים|מה\s*נשמע|מה\s*קורה|תודה(\s*רבה)?|מעולה|מצוין|אחלה|סבבה|יופי|בסדר|כן|לא|הבנתי|אוקיי?|ok|עזרה|מה\s*את\s*יודעת\s*לעשות|מי\s*את|איך\s*קוראים\s*לך|התחל(\s*מחדש)?|איפוס|בוא[י]?\s*נתחיל|נתחיל|להמשיך|המשך|דלג|להשאיר|הכל|אין|כלום)[\s!?.׳'"״]*$/i;

  const QUESTION_WORD_RE = /^(מה|מי|איך|למה|מדוע|מתי|איפה|היכן|האם|כמה|איזה|איזו|תסביר|תסבירי|תכתוב|תכתבי|תספר|תספרי|תפתור|תפתרי)(?:\s|$|[?!.,])/;

  function dynamicFoodWords() {
    if (!D) return [];
    const set = new Set();
    Object.values(D.DISHES || {}).forEach((d) => {
      (d.tags || []).forEach((t) => { if (t.length >= 2) set.add(t); });
    });
    return Array.from(set);
  }

  function hasDomainSignal(clean) {
    if (DOMAIN_RE.some((re) => re.test(clean))) return true;
    const foods = dynamicFoodWords();
    return foods.some((w) => clean.includes(w));
  }

  function isLikelyNameInput(clean) {
    if (!clean || clean.length < 2 || clean.length > 28) return false;
    if (QUESTION_WORD_RE.test(clean)) return false;
    if (/\d/.test(clean)) return false;
    const words = clean.replace(/[.,!?"׳'״\-]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 3) return false;
    return words.every((w) => /^[א-תa-zA-Z]{2,15}$/.test(w));
  }

  function isLikelyMetricsInput(clean) {
    // Numeric inputs like "29, 178, 80" or "75" or "להשאיר"
    return /\b\d{2,3}(\.\d+)?\b/.test(clean) && clean.length <= 60;
  }

  function classifyTopic(rawText, session) {
    const clean = String(rawText || '').trim();
    if (!clean) return { allowed: false, reason: 'empty' };

    if (INJECTION_RE.some((re) => re.test(clean))) {
      return { allowed: false, reason: 'injection' };
    }
    if (MEDICAL_RE.some((re) => re.test(clean))) {
      return { allowed: false, reason: 'medical' };
    }
    if (OFF_TOPIC_RE.some((re) => re.test(clean))) {
      return { allowed: false, reason: 'off_topic' };
    }

    if (GREETING_META_RE.test(clean) || hasDomainSignal(clean)) {
      return { allowed: true, reason: 'domain' };
    }

    const step = session && session.step;
    if (step === 'ask_name' && isLikelyNameInput(clean)) {
      return { allowed: true, reason: 'intake_name' };
    }
    if (step === 'ask_metrics' && isLikelyMetricsInput(clean)) {
      return { allowed: true, reason: 'intake_metrics' };
    }
    if (step === 'ask_restrictions' && /^(אין|כלום|הכל|לא|בלי|ללא|רגיל|דלג|המשך|תבני|בנה)[\s!?.]*$/.test(clean)) {
      return { allowed: true, reason: 'intake_restrictions' };
    }

    return { allowed: false, reason: 'off_topic' };
  }

  // =========================================================================
  // 2. HEBREW ENTITY EXTRACTION & PROFILE PARSING
  // =========================================================================
  const NON_NAMES = new Set([
    'מתאמן', 'מתאמנת', 'רוצה', 'צריך', 'צריכה', 'מחפש', 'מחפשת', 'עובד', 'עובדת',
    'גבר', 'אישה', 'זכר', 'נקבה', 'בן', 'בת', 'בחור', 'בחורה', 'טבעוני', 'טבעונית',
    'צמחוני', 'צמחונית', 'כשר', 'כשרה', 'שומר', 'שומרת', 'לא', 'אוהב', 'אוהבת',
    'שונא', 'שונאת', 'שוקל', 'שוקלת', 'רץ', 'רצה', 'הולך', 'הולכת', 'עובר', 'עוברת',
    'בחיטוב', 'במסה', 'בשמירה', 'בדיאטה', 'יושבני', 'פעיל', 'פעילה', 'אוכל', 'אוכלת',
    'מנסה', 'חושב', 'חושבת', 'כאן', 'שמח', 'שמחה', 'מוכן', 'מוכנה', 'בסדר', 'מעוניין', 'מעוניינת'
  ]);

  const KNOWN_DISLIKES = [
    { key: 'כוסברה', re: /כוסברה/ },
    { key: 'פטריות', re: /פטריות|פטריה/ },
    { key: 'דגים', re: /דגים|(?:^|\s|[בול])דג(?:\s|$|[.,!?])/ },
    { key: 'טונה', re: /טונה/ },
    { key: 'סלמון', re: /סלמון/ },
    { key: 'חצילים', re: /חציל(ים)?/ },
    { key: 'בקר', re: /בקר|בשר\s*אדום/ },
    { key: 'עוף', re: /(?:^|\s|[בול])עוף(?:\s|$|[.,!?])|חזה\s*עוף/ },
    { key: 'הודו', re: /הודו/ },
    { key: 'טופו', re: /טופו/ },
    { key: 'ביצים', re: /ביצים|ביצה/ },
    { key: 'בצל', re: /בצל/ },
    { key: 'אבוקדו', re: /אבוקדו/ },
    { key: 'טחינה', re: /טחינה/ },
    { key: 'פלפל', re: /פלפל(ים)?/ },
    { key: 'ברוקולי', re: /ברוקולי/ },
    { key: 'קישוא', re: /קישוא(ים)?/ },
    { key: 'גבינה', re: /גבינה|גבינות|קוטג|פטה/ },
    { key: 'עדשים', re: /עדשים/ },
    { key: 'שעועית', re: /שעועית/ },
    { key: 'סויה', re: /סויה/ },
    { key: 'בוטנים', re: /בוטנים/ },
    { key: 'בננה', re: /בננ(ה|ות)/ }
  ];

  function extractName(text, allowBareName) {
    const explicit = text.match(/(?:קוראים\s*לי|שמי|השם\s*שלי(?:\s*הוא)?)\s+([א-תa-zA-Z]{2,15}(?:\s+[א-תa-zA-Z]{2,15})?)/);
    if (explicit) {
      const candidate = explicit[1].trim().split(/\s+/).filter((w) => !NON_NAMES.has(w)).slice(0, 2).join(' ');
      if (candidate.length >= 2) return candidate;
    }
    const iAm = text.match(/(?:^|[.,!?\s])אני\s+([א-תa-zA-Z]{2,14})(?:\s|[.,!?]|$)/);
    if (iAm && !NON_NAMES.has(iAm[1]) && !hasDomainSignal(iAm[1])) {
      return iAm[1].trim();
    }
    if (allowBareName && isLikelyNameInput(text) && !GREETING_META_RE.test(text) && !hasDomainSignal(text)) {
      const words = text.replace(/[.,!?"׳'״]/g, '').trim().split(/\s+/);
      if (!words.some((w) => NON_NAMES.has(w))) return words.join(' ');
    }
    return null;
  }

  function extractActivity(text) {
    // Check explicit workout counts per week
    const freqMatch = text.match(/(\d+)\s*(?:–|-|עד)?\s*(\d+)?\s*(?:פעמים|אימונים|ימים)\s*(?:בשבוע|לשבוע)?/);
    if (freqMatch) {
      const n = freqMatch[2] ? (Number(freqMatch[1]) + Number(freqMatch[2])) / 2 : Number(freqMatch[1]);
      if (n <= 1) return 'low';
      if (n <= 4) return 'moderate';
      return 'high';
    }
    if (/יושבני|לא\s*מתאמ(?:ן|נת|נים)|בלי\s*ספורט|ללא\s*ספורט|בקושי\s*(מתאמ(?:ן|נת|נים)|זז)|עבודה\s*משרדית|רק\s*משרד|רמת\s*פעילות\s*נמוכה|פעילות\s*נמוכה|כמעט\s*בלי|אפס\s*אימונים|0\s*אימונים|פעם\s*(אחת\s*)?בשבוע/.test(text)) {
      return 'low';
    }
    if (/גבוהה|אינטנסיב|כל\s*יום|יומיומי|ספורטאי|עבודה\s*פיזית|קרוספיט|מרתון|הרבה\s*ספורט|פעמיים\s*ביום|חמש|שש|שבע/.test(text)) {
      return 'high';
    }
    if (/מתונה|בינונית|חדר\s*כושר|ריצה|(?:^|\s)רץ(?:\s|$|[.,!?])|(?:^|\s)רצה(?:\s|$|[.,!?])|הליכ(ה|ות)|פילאטיס|שחייה|שחיה|יוגה|אופניים|כדורגל|כדורסל|טניס|אימוני\s*כוח|פעמיים|שלוש|ארבע|מתאמן|מתאמנת/.test(text)) {
      return 'moderate';
    }
    return null;
  }

  function extractGoal(text) {
    if (/חיטוב|ירידה|לרדת|הרזיה|להרזות|דיאטה|להוריד\s*(משקל|שומן|קילו)|גרעון|גירעון/.test(text)) return 'cut';
    if (/מסה|עלייה|לעלות|שריר|להתנפח|עודף\s*קלורי/.test(text)) return 'bulk';
    if (/שמירה|לשמור|תחזוקה|לאזן|איזון\s*קלורי/.test(text)) return 'maintain';
    return null;
  }

  function extractTier(text) {
    if (/חסכוני|280|עד\s*300|בסיסי|זול|להוזיל|לחסוך\s*בסל|לחסוך\s*כסף/.test(text)) return 'saver';
    if (/חופשי|פרימיום|520|500|ללא\s*הגבלת\s*תקציב|גבוה|אורגני/.test(text)) return 'free';
    if (/מאוזן|380|עד\s*400|סטנדרט|תקציב\s*בינוני|תקציב\s*רגיל/.test(text)) return 'balanced';
    return null;
  }

  function extractMetrics(text) {
    const out = {};
    if (/אישה|נקבה|בחורה|(?:^|\s)בת\s+\d{2}(?:\s|$|[.,!?])/.test(text)) out.sex = 'female';
    else if (/גבר|זכר|בחור|(?:^|\s)בן\s+\d{2}(?:\s|$|[.,!?])/.test(text)) out.sex = 'male';

    const ageM = text.match(/(?:גיל|בן|בת)\s*[:\-]?\s*(\d{2})\b/) || text.match(/\b(\d{2})\s*(?:שנה|שנים)(?:\s|$|[.,!?])/);
    if (ageM) {
      const a = Number(ageM[1]);
      if (a >= 14 && a <= 90) out.age = a;
    }

    const heightCm = text.match(/(?:גובה|גבה)\s*[:\-]?\s*(\d{3})\b/) || text.match(/\b(1[4-9]\d|2[0-1]\d)\s*(?:ס["״׳]?מ|cm)(?:\s|$|[.,!?])/i);
    const heightM = text.match(/(?:גובה|גבה)?\s*(1\.\d{2}|2\.[01]\d)\b/);
    if (heightCm) out.height = Number(heightCm[1]);
    else if (heightM) out.height = Math.round(Number(heightM[1]) * 100);

    const weightM = text.match(/(?:משקל|שוקל|שוקלת)\s*[:\-]?\s*(\d{2,3}(?:\.\d+)?)\b/) || text.match(/\b(\d{2,3}(?:\.\d+)?)\s*(?:ק["״׳]?ג|קילו|kg)(?:\s|$|[.,!?])/i);
    if (weightM) {
      const w = Number(weightM[1]);
      if (w >= 38 && w <= 180) out.weight = Math.round(w);
    }

    // Positional fallback if user wrote 3 numbers like "29 178 80" or "29, 178, 80"
    if (out.age === undefined && out.height === undefined && out.weight === undefined) {
      const nums = (text.match(/\b\d{2,3}\b/g) || []).map(Number).filter((n) => ![280, 380, 520].includes(n));
      if (nums.length >= 2) {
        const hIdx = nums.findIndex((n) => n >= 145 && n <= 215);
        if (hIdx !== -1) {
          out.height = nums[hIdx];
          const rest = nums.filter((_, i) => i !== hIdx);
          if (rest.length >= 2) {
            // Smaller is typically age if <= 65 and larger is weight
            const sorted = rest.slice(0, 2);
            if (sorted[0] >= 16 && sorted[0] <= 80 && sorted[1] >= 40 && sorted[1] <= 160) {
              out.age = sorted[0];
              out.weight = sorted[1];
            }
          } else if (rest.length === 1 && rest[0] >= 40 && rest[0] <= 160) {
            out.weight = rest[0];
          }
        }
      }
    }
    return out;
  }

  function extractRestrictionsAndDislikes(text) {
    const addRestrictions = [];
    const removeRestrictions = [];
    let clearRestrictions = false;

    if (/בלי\s*הגבלות|ללא\s*הגבלות|אוכל\s*הכל|אוכלת\s*הכל|אין\s*הגבלות/.test(text)) {
      clearRestrictions = true;
    }
    if (/לא\s*כשר|בלי\s*כשרות/.test(text)) removeRestrictions.push('כשר');
    else if (/כשר|כשרות/.test(text)) addRestrictions.push('כשר');

    if (/טבעוני|טבעונית/.test(text)) addRestrictions.push('טבעוני');
    if (/צמחוני|צמחונית/.test(text)) addRestrictions.push('צמחוני');
    if (/ללא\s*גלוטן|בלי\s*גלוטן|צליאק/.test(text)) addRestrictions.push('ללא גלוטן');
    if (/ללא\s*לקטוז|בלי\s*לקטוז|ללא\s*חלב|בלי\s*חלב/.test(text)) addRestrictions.push('ללא לקטוז');

    const dislikes = [];
    if (/לא\s*אוהב|שונא|שנוא|בלי\s+|ללא\s+|אל\s*תשימי|להוריד\s+|לא\s*אוכל/.test(text)) {
      KNOWN_DISLIKES.forEach((item) => {
        if (item.re.test(text)) dislikes.push(item.key);
      });
    }
    return { addRestrictions, removeRestrictions, clearRestrictions, dislikes };
  }

  function extractSlot(text) {
    if (/עוגן\s*1|עוגן\s*ראשון|ארוחת\s*עוגן\s*ראשונה/.test(text)) return 'anchor1';
    if (/עוגן\s*2|עוגן\s*שני|ארוחת\s*עוגן\s*שנייה/.test(text)) return 'anchor2';
    if (/מהירה\s*1|ארוחת\s*ערב\s*1|ערב\s*ראשונה/.test(text)) return 'quick1';
    if (/מהירה\s*2|ארוחת\s*ערב\s*2|ערב\s*שנייה/.test(text)) return 'quick2';
    if (/בוקר|ארוחת\s*בוקר/.test(text)) return 'breakfast';
    if (/גיבוי|מזווה|שבת/.test(text)) return 'backup';
    if (/עוגן|צהריים/.test(text)) return 'anchor1';
    if (/ערב|מהירה/.test(text)) return 'quick1';
    return null;
  }

  function extractEntities(text, allowBareName) {
    const metrics = extractMetrics(text);
    const diet = extractRestrictionsAndDislikes(text);
    return {
      name: extractName(text, allowBareName),
      activity: extractActivity(text),
      goal: extractGoal(text),
      tier: extractTier(text),
      sex: metrics.sex || null,
      age: metrics.age || null,
      height: metrics.height || null,
      weight: metrics.weight || null,
      restrictions: diet,
      slot: extractSlot(text)
    };
  }

  // =========================================================================
  // 3. STATE PERSISTENCE & PROFILE SYNC HELPERS
  // =========================================================================
  const DEFAULT_SESSION = () => ({
    step: 'idle', // idle | ask_name | ask_activity | ask_goal | ask_metrics | ask_budget | ask_restrictions | ready
    messages: [],
    open: false,
    nudgeDismissed: false
  });

  function loadSession() {
    const saved = SS && SS.loadOrna ? SS.loadOrna() : null;
    if (!saved || !Array.isArray(saved.messages)) return DEFAULT_SESSION();
    return Object.assign(DEFAULT_SESSION(), saved);
  }

  function saveSession(session) {
    // Keep last 40 messages to keep localStorage lightweight
    const copy = Object.assign({}, session, { messages: (session.messages || []).slice(-40) });
    if (SS && SS.saveOrna) SS.saveOrna(copy);
  }

  function applyProfilePatch(patch, resetInvalidSwaps) {
    const current = SS.loadProfile();
    const next = Object.assign({}, current, patch);
    const m = SS.calcMacros(next);
    next.calories = m.calories;
    next.protein = m.protein;
    next.carbs = m.carbs;
    next.fat = m.fat;
    SS.saveProfile(next);
    if (resetInvalidSwaps && D) {
      // buildMenu automatically drops overrides that no longer fit the profile
      const cleaned = {};
      const overrides = SS.loadMenu();
      const built = D.buildMenu(next, overrides);
      Object.keys(overrides).forEach((slot) => {
        if (built[slot] === overrides[slot]) cleaned[slot] = overrides[slot];
      });
      SS.saveMenu(cleaned);
    }
    SS.apply();
    return { profile: next, macros: m };
  }

  function buildMenuCardPayload() {
    const p = SS.loadProfile();
    const menu = SS.currentMenu();
    const cart = SS.currentCart();
    const tier = SS.TIERS[p.tier] || SS.TIERS.balanced;
    const goal = SS.GOALS[p.goal] || SS.GOALS.cut;
    const act = SS.ACTIVITY[p.activity] || SS.ACTIVITY.moderate;
    const slots = Object.keys(D.SLOTS).map((slot) => {
      const id = menu[slot];
      const dish = id ? D.DISHES[id] : null;
      return {
        slot,
        label: D.SLOTS[slot].label,
        servings: D.SLOTS[slot].servings,
        dishId: id,
        name: dish ? dish.name : 'אין מנה מתאימה להגבלות הנוכחיות',
        kcal: dish ? dish.kcal : 0,
        protein: dish ? dish.protein : 0
      };
    });
    return {
      userName: p.name || '',
      goalLabel: goal.label,
      activityLabel: act.label,
      tierLabel: tier.label,
      budget: tier.budget,
      calories: p.calories,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
      cartTotal: cart ? cart.total : 0,
      store: cart ? cart.store : 'רמי לוי',
      slots
    };
  }

  // =========================================================================
  // 4. CONVERSATION ENGINE (processMessage)
  // =========================================================================
  function greetingPrefix(p) {
    return p.name ? `${p.name}, ` : '';
  }

  function makeWelcomeMessage() {
    const p = SS.loadProfile();
    const knownName = p.name && p.name.trim();
    if (knownName) {
      return {
        role: 'orna',
        text: `היי ${knownName}! אני אורנה, התזונאית האישית שלך ב-ShelfSense 🥗\nכרגע הפרופיל שלך מוגדר על ${SS.GOALS[p.goal].label} (${SS.num(p.calories)} קק״ל, ${p.protein}ג׳ חלבון) ברמת פעילות ${SS.ACTIVITY[p.activity].label}.\nאיך תרצה להתקדם היום? אפשר לעדכן את רמת הפעילות, לבנות תפריט מחדש או להחליף מנה.`,
        chips: ['בוא נבנה תפריט מחדש', 'החלף מנה בתפריט', 'עדכן רמת פעילות', 'הסבר על התפריט שלי']
      };
    }
    return {
      role: 'orna',
      text: 'היי! אני אורנה, התזונאית האישית שלך ב-ShelfSense 🥗\nאני כאן כדי להכיר אותך, להבין את רמת הפעילות היומית והאימונים שלך, ולבנות לך תפריט שבועי מדויק לפי שיטת הלגו והתקציב שלך.\n\nנתחיל? איך קוראים לך?',
      chips: ['בוא נבנה תפריט אישי', 'יש לי שאלה על התפריט שלי', 'מה זה שיטת הלגו?']
    };
  }

  function nextIntakePrompt(session, ackLines) {
    const p = SS.loadProfile();
    const ack = ackLines.filter(Boolean).join('\n');
    const prefix = ack ? ack + '\n\n' : '';
    const who = p.name ? `${p.name}, ` : '';

    if (session.step === 'ask_name') {
      return {
        role: 'orna',
        text: `${prefix}איך קוראים לך? (אעדכן את השם שלך גם באפליקציה)`,
        chips: []
      };
    }
    if (session.step === 'ask_activity') {
      return {
        role: 'orna',
        text: `${prefix}${who}כדי לחשב את הצריכה הקלורית שלך בצורה מדויקת — ספר/י לי על רמת הפעילות הגופנית שלך בשבוע.\nאת/ה יכול/ה לתאר במילים שלך (למשל "עובד במשרד ומתאמן 3 פעמים בשבוע") או לבחור למטה:`,
        chips: ['יושבני (עבודה משרדית, 0–1 אימונים)', 'פעילות מתונה (2–4 אימונים בשבוע)', 'פעילות גבוהה (5+ אימונים / עבודה פיזית)']
      };
    }
    if (session.step === 'ask_goal') {
      return {
        role: 'orna',
        text: `${prefix}${who}מה המטרה התזונתית העיקרית שלך כרגע?`,
        chips: ['חיטוב וירידה במשקל', 'שמירה על המשקל', 'עלייה במסה ובניית שריר']
      };
    }
    if (session.step === 'ask_metrics') {
      const sexLabel = p.sex === 'female' ? 'אישה' : 'גבר';
      return {
        role: 'orna',
        text: `${prefix}מעולה! מה הנתונים הפיזיים שלך (מין, גיל, גובה ומשקל)?\nאפשר לכתוב במשפט אחד, למשל: "גבר בן 29, 178 ס״מ, 80 ק״ג".\n(הנתונים השמורים כרגע: ${sexLabel}, גיל ${p.age}, ${p.height} ס״מ, ${p.weight} ק״ג)`,
        chips: ['להשאיר את הנתונים הקיימים']
      };
    }
    if (session.step === 'ask_budget') {
      return {
        role: 'orna',
        text: `${prefix}באיזה פרופיל תקציב שבועי לסופר נבנה את התפריט?`,
        chips: ['חסכוני (₪280)', 'מאוזן (₪380)', 'חופשי (₪520)']
      };
    }
    if (session.step === 'ask_restrictions') {
      const curRest = (p.restrictions || []).length ? p.restrictions.join(', ') : 'ללא הגבלות';
      const curDis = (p.dislikes || []).length ? p.dislikes.join(', ') : 'אין';
      return {
        role: 'orna',
        text: `${prefix}שלב אחרון לפני בניית התפריט! יש לך העדפות תזונה (כשר, צמחוני, טבעוני, ללא גלוטן/לקטוז) או רכיבים שאת/ה לא אוהב/ת?\n(כרגע: ${curRest} | רכיבים שנואים: ${curDis})`,
        chips: ['כשר בלבד — תבני תפריט', 'צמחוני — תבני תפריט', 'טבעוני — תבני תפריט', 'ללא הגבלות — תבני תפריט']
      };
    }

    // Build and present the full menu!
    session.step = 'ready';
    applyProfilePatch({ completed: true }, true);
    const card = buildMenuCardPayload();
    return {
      role: 'orna',
      text: `${prefix}איזה יופי ${p.name ? p.name : ''}! בניתי ועדכנתי את התפריט השבועי שלך לפי רמת הפעילות (${card.activityLabel}) והיעדים שלך.\nהפרופיל, הדשבורד וסל הקניות כבר מסונכרנים:`,
      card: { type: 'menu', data: card },
      chips: ['החלף מנה בתפריט', 'איך להוזיל את הסל?', 'עדכן רמת פעילות']
    };
  }

  function advanceStepFrom(currentStep, collected) {
    const order = ['ask_name', 'ask_activity', 'ask_goal', 'ask_metrics', 'ask_budget', 'ask_restrictions', 'build'];
    let idx = order.indexOf(currentStep);
    if (idx === -1) idx = 0;
    else idx += 1;
    // Skip any step whose data was already supplied in the same message
    while (idx < order.length - 1) {
      const s = order[idx];
      if (s === 'ask_name' && collected.name) { idx++; continue; }
      if (s === 'ask_activity' && collected.activity) { idx++; continue; }
      if (s === 'ask_goal' && collected.goal) { idx++; continue; }
      if (s === 'ask_metrics' && (collected.age || collected.height || collected.weight)) { idx++; continue; }
      if (s === 'ask_budget' && collected.tier) { idx++; continue; }
      break;
    }
    return order[idx];
  }

  function buildSwapResponse(slot) {
    const p = SS.loadProfile();
    const menu = SS.currentMenu();
    if (!slot) {
      return {
        role: 'orna',
        text: 'איזו ארוחה בתפריט תרצה/י להחליף? אני אמצא חלופות מאותו פרופיל תקציב ששומרות על ±5% בקלוריות ו-±10% בחלבון:',
        chips: ['ארוחת עוגן 1', 'ארוחת עוגן 2', 'ארוחה מהירה 1', 'ארוחה מהירה 2', 'ארוחת בוקר', 'ארוחת גיבוי']
      };
    }
    const slotInfo = D.SLOTS[slot];
    const currentId = menu[slot];
    const currentDish = currentId ? D.DISHES[currentId] : null;
    const options = D.swapOptions(slot, p, currentId);
    if (!options.length) {
      return {
        role: 'orna',
        text: `עבור ${slotInfo.label}${currentDish ? ` (${currentDish.name})` : ''} אין כרגע מנה חלופית נוספת במאגר שעומדת בטווח ±5% קלוריות ו-±10% חלבון עם ההגבלות והרכיבים השנואים שלך.\nאפשר להסיר רכיב שנוא או להחליף ארוחה אחרת.`,
        chips: ['החלף ארוחה אחרת', 'הצג את התפריט שלי']
      };
    }
    return {
      role: 'orna',
      text: `מצאתי ${options.length} חלופות מדויקות עבור **${slotInfo.label}**${currentDish ? ` (במקום ${currentDish.name})` : ''}. כל החלופות עומדות בחוקי ShelfSense (±5% קלוריות, ±10% חלבון):`,
      card: {
        type: 'swap',
        data: {
          slot,
          slotLabel: slotInfo.label,
          options: options.slice(0, 4).map((o) => ({
            id: o.id,
            name: o.dish.name,
            kcal: o.dish.kcal,
            protein: o.dish.protein,
            prep: o.dish.prep,
            kcalDiff: o.kcalDiff,
            proteinDiff: o.proteinDiff
          }))
        }
      },
      chips: ['הצג את התפריט שלי', 'בוא נבנה תפריט מחדש']
    };
  }

  function processMessage(rawText, session) {
    const text = String(rawText || '').trim();
    const verdict = classifyTopic(text, session);

    if (!verdict.allowed) {
      if (verdict.reason === 'medical') {
        return {
          role: 'orna',
          blocked: true,
          badge: 'מחוץ לגבולות ייעוץ תפריט',
          text: 'חשוב לי להבהיר: אני סוכנת תכנון תפריטים של ShelfSense ולא רופאה או דיאטנית קלינית 🩺\nלגבי תרופות, בדיקות דם או מצב רפואי חשוב להתייעץ עם גורם רפואי מוסמך.\n\nאני כן כאן כדי לעזור לך להבין את רמת הפעילות שלך ולבנות תפריט שבועי מאוזן ומותאם לתקציב. במה נמשיך?',
          chips: ['בוא נבנה תפריט אישי', 'הצג את התפריט שלי', 'עדכן רמת פעילות']
        };
      }
      const resumeChips = session.step && session.step !== 'idle' && session.step !== 'ready'
        ? ['בוא נמשיך בבניית התפריט', 'הצג את התפריט שלי']
        : ['בוא נבנה תפריט אישי', 'החלף מנה בתפריט', 'עדכן רמת פעילות'];
      return {
        role: 'orna',
        blocked: true,
        badge: 'נושא מחוץ לתחום התזונה',
        text: 'אני אורנה, התזונאית של ShelfSense 🥗\nאני חסומה לשיחות שלא קשורות לתזונה, פעילות גופנית ותכנון התפריט השבועי שלך.\nבוא נחזור לתפריט שלך — איך אוכל לעזור בתזונה או בהתאמת הארוחות?',
        chips: resumeChips
      };
    }

    // Explicit restart / guided build triggers
    if (/בוא[י]?\s*נבנה\s*תפריט|בניית\s*תפריט|תפריט\s*(אישי|חדש|מחדש)|התחל\s*מחדש|תבני\s*לי\s*תפריט/.test(text) && !/תבני\s*תפריט$/.test(text)) {
      const p = SS.loadProfile();
      session.step = p.name ? 'ask_activity' : 'ask_name';
      return nextIntakePrompt(session, ['בשמחה! בוא נתאים לך תפריט שבועי מדויק בשיטת הלגו.']);
    }

    // Resume intake explicitly
    if (/נמשיך\s*בבניית\s*התפריט/.test(text) && session.step !== 'idle' && session.step !== 'ready') {
      return nextIntakePrompt(session, ['ממשיכים מאיפה שעצרנו:']);
    }

    // Standalone "מה זה שיטת הלגו?"
    if (/שיטת\s*הלגו|מה\s*זה\s*לגו|איך\s*עובד\s*התפריט/.test(text)) {
      return {
        role: 'orna',
        text: 'שיטת הלגו של ShelfSense בנויה כדי לחסוך שעות במטבח ולמנוע בזבוז מזון:\n• **2 ארוחות עוגן** — מבשלים פעמיים בשבוע (למשל ראשון ושלישי), 3 מנות בכל פעם.\n• **2 ארוחות מהירות** — 10–15 דק׳ הכנה בערב.\n• **ארוחת בוקר קבועה** — עשירה בחלבון ומהירה.\n• **ארוחת גיבוי מהמזווה** — לערבים עמוסים, ממוצרים עמידים בלבד.\n\nרוצה שנתאים אותה לרמת הפעילות והיעדים שלך?',
        chips: ['בוא נבנה תפריט אישי', 'הצג את התפריט שלי']
      };
    }

    // Show current menu / macros / budget summary
    if (/הצג\s*(את\s*)?התפריט|מה\s*התפריט\s*שלי|הסבר\s*על\s*התפריט|כמה\s*(חלבון|קלוריות)|מה\s*היעד\s*שלי|מאקרו\s*שלי/.test(text)) {
      const card = buildMenuCardPayload();
      return {
        role: 'orna',
        text: `${greetingPrefix(SS.loadProfile())}הנה תמונת המצב הנוכחית של הפרופיל והתפריט השבועי שלך:`,
        card: { type: 'menu', data: card },
        chips: ['החלף מנה בתפריט', 'עדכן רמת פעילות', 'איך להוזיל את הסל?']
      };
    }

    // How to save / lower cart cost
    if (/להוזיל|לחסוך\s*בסל|יקר\s*לי|חורג\s*מהתקציב/.test(text)) {
      const cart = SS.currentCart();
      const cheaper = cart && cart.chains['רמי לוי'] <= cart.chains['שופרסל'] ? 'רמי לוי' : 'שופרסל';
      const diff = cart ? Math.abs(cart.chains['רמי לוי'] - cart.chains['שופרסל']) : 0;
      return {
        role: 'orna',
        text: `כדי להוזיל את הסל השבועי בלי לפגוע בחלבון ובקלוריות:\n1. **מעבר לפרופיל חסכוני (₪280):** עובר למותגים פרטיים ולמקורות חלבון משתלמים (חזה עוף, ביצים, טונה, קוטג׳ וקטניות).\n2. **בחירת רשת משתלמת:** כרגע **${cheaper}** זולה יותר ב-${SS.money(diff, 2)} לאותו סל בדיוק.\n3. **סימון "יש לי בבית"** בסל הקניות למוצרים שכבר קיימים במקרר.\n\nרוצה שאעביר אותך לפרופיל תקציב חסכוני עכשיו?`,
        chips: ['עבור לתקציב חסכוני (₪280)', 'הצג את התפריט שלי']
      };
    }

    // Dish swap request (outside of intake name/metrics)
    if ((/החלף|להחליף|החלפה|תחליפ|בא\s*לי\s*מנה\s*אחרת|מנה\s*חלופית/.test(text) || (session.step === 'ready' && extractSlot(text))) && session.step !== 'ask_name') {
      const slot = extractSlot(text);
      return buildSwapResponse(slot);
    }

    // Ask to update activity specifically
    if (/עדכן\s*רמת\s*פעילות|לשנות\s*רמת\s*פעילות/.test(text)) {
      session.step = 'ask_activity';
      return nextIntakePrompt(session, []);
    }

    // Extract any structured entities from the user's message
    const allowBareName = session.step === 'ask_name' || (session.step === 'idle' && !SS.loadProfile().name);
    const entities = extractEntities(text, allowBareName);
    const acks = [];
    const patch = {};
    let touched = false;

    if (entities.name) {
      patch.name = entities.name;
      acks.push(`נעים מאוד ${entities.name}! שמרתי את השם שלך בפרופיל.`);
      touched = true;
    }
    if (entities.activity) {
      patch.activity = entities.activity;
      const actInfo = SS.ACTIVITY[entities.activity];
      const tips = {
        low: 'לקחתי בחשבון שגרה יושבנית (פקטור 1.2) — נתמקד במנות משביעות ועשירות בחלבון בלי עודף קלוריות.',
        moderate: 'רמת פעילות מתונה (פקטור 1.55) — נשלב פחמימות מורכבות לתמיכה באימונים וחלבון להתאוששות.',
        high: 'רמת פעילות גבוהה (פקטור 1.725) — נגדיל את התקציב הקלורי כדי לתמוך בהתאוששות ובביצועים.'
      };
      acks.push(`רמת פעילות עודכנה ל**${actInfo.label}**. ${tips[entities.activity]}`);
      touched = true;
    }
    if (entities.goal) {
      patch.goal = entities.goal;
      acks.push(`מטרה עודכנה ל**${SS.GOALS[entities.goal].label}**.`);
      touched = true;
    }
    if (entities.sex || entities.age || entities.height || entities.weight) {
      if (entities.sex) patch.sex = entities.sex;
      if (entities.age) patch.age = entities.age;
      if (entities.height) patch.height = entities.height;
      if (entities.weight) patch.weight = entities.weight;
      const parts = [];
      if (entities.age) parts.push(`גיל ${entities.age}`);
      if (entities.height) parts.push(`${entities.height} ס״מ`);
      if (entities.weight) parts.push(`${entities.weight} ק״ג`);
      if (parts.length) acks.push(`עדכנתי את הנתונים שלך (${parts.join(', ')}).`);
      touched = true;
    }
    if (entities.tier) {
      patch.tier = entities.tier;
      const t = SS.TIERS[entities.tier];
      acks.push(`פרופיל תקציב הוגדר ל**${t.label} (${SS.money(t.budget)} לשבוע)**.`);
      touched = true;
    }

    const rd = entities.restrictions;
    if (rd.clearRestrictions || rd.addRestrictions.length || rd.removeRestrictions.length || rd.dislikes.length) {
      const cur = SS.loadProfile();
      let nextRest = rd.clearRestrictions ? [] : (cur.restrictions || []).slice();
      rd.removeRestrictions.forEach((r) => { nextRest = nextRest.filter((x) => x !== r); });
      rd.addRestrictions.forEach((r) => { if (!nextRest.includes(r)) nextRest.push(r); });
      if (nextRest.includes('טבעוני')) nextRest = nextRest.filter((x) => x !== 'צמחוני');

      const nextDislikes = (cur.dislikes || []).slice();
      rd.dislikes.forEach((d) => { if (!nextDislikes.includes(d)) nextDislikes.push(d); });

      patch.restrictions = nextRest;
      patch.dislikes = nextDislikes;
      const notes = [];
      if (rd.clearRestrictions) notes.push('הסרתי הגבלות תזונה');
      else if (rd.addRestrictions.length) notes.push(`העדפות: ${rd.addRestrictions.join(', ')}`);
      if (rd.dislikes.length) notes.push(`הסרתי מהתפריט: ${rd.dislikes.join(', ')}`);
      if (notes.length) acks.push(`עודכן — ${notes.join(' | ')}.`);
      touched = true;
    }

    if (touched) {
      applyProfilePatch(patch, true);
    }

    // Active guided intake progression
    if (session.step === 'idle' && entities.name && !entities.activity) {
      session.step = 'ask_activity';
      return nextIntakePrompt(session, acks);
    }
    if (['ask_name', 'ask_activity', 'ask_goal', 'ask_metrics', 'ask_budget', 'ask_restrictions'].includes(session.step)) {
      const skipOrKeep = /להשאיר|הבא|דלג|המשך|תבני\s*תפריט|אין|כלום|הכל/.test(text);
      if (touched || skipOrKeep) {
        if (session.step === 'ask_restrictions' || /תבני\s*תפריט/.test(text)) {
          session.step = 'build';
        } else {
          session.step = advanceStepFrom(session.step, entities);
        }
        return nextIntakePrompt(session, acks);
      }
      // User sent a domain message that didn't answer the current step — gently guide
      return nextIntakePrompt(session, ['הבנתי! כדי שנוכל להמשיך בבניית התפריט המדויק שלך:']);
    }

    // Outside guided intake: if user updated something (e.g., activity/tier/dislikes/weight), show updated menu card!
    if (touched) {
      const card = buildMenuCardPayload();
      return {
        role: 'orna',
        text: `${acks.join('\n')}\n\nחישבתי מחדש את יעדי המאקרו שלך (${SS.num(card.calories)} קק״ל | ${card.protein}ג׳ חלבון) ועדכנתי את התפריט והסל:`,
        card: { type: 'menu', data: card },
        chips: ['החלף מנה בתפריט', 'בוא נבנה תפריט מחדש', 'איך להוזיל את הסל?']
      };
    }

    // Greeting / general nutrition assistance
    if (/^(היי+|הי+|שלום|אהלן|בוקר\s*טוב|ערב\s*טוב|צהריים\s*טובים|מה\s*נשמע|מה\s*קורה)/.test(text)) {
      const p = SS.loadProfile();
      if (!p.name) {
        session.step = 'ask_name';
        return {
          role: 'orna',
          text: 'היי! שמחה שאתה כאן 😊 אני אורנה, התזונאית של ShelfSense.\nבוא נכיר קצר כדי שאבנה לך תפריט שמתאים בדיוק לרמת הפעילות ולמטרות שלך — איך קוראים לך?',
          chips: ['בוא נבנה תפריט אישי', 'הצג את התפריט שלי']
        };
      }
      return {
        role: 'orna',
        text: `היי ${p.name}! איך אפשר לעזור לך היום עם התפריט השבועי או רמת הפעילות שלך?`,
        chips: ['בוא נבנה תפריט מחדש', 'החלף מנה בתפריט', 'הצג את התפריט שלי', 'עדכן רמת פעילות']
      };
    }

    if (/תודה|מעולה|מצוין|אחלה|סבבה|יופי/.test(text)) {
      return {
        role: 'orna',
        text: `בשמחה ${SS.loadProfile().name ? SS.loadProfile().name + ' ' : ''}💚 אני תמיד כאן אם תרצה/י להחליף מנה, לשנות רמת פעילות או לדייק את התקציב.`,
        chips: ['הצג את התפריט שלי', 'החלף מנה בתפריט']
      };
    }

    if (/מי\s*את|איך\s*קוראים\s*לך|מה\s*את\s*יודעת|עזרה/.test(text)) {
      return {
        role: 'orna',
        text: 'אני **אורנה**, התזונאית של ShelfSense 🥗\nאני עוזרת ב:\n• היכרות והבנת רמת הפעילות הגופנית והאימונים שלך\n• חישוב יעד קלורי ומאקרו אישי (חלבון, פחמימה, שומן)\n• בניית תפריט שבועי בשיטת הלגו לפי תקציב והגבלות תזונה\n• החלפת מנות שלמות תוך שמירה על ±5% קלוריות ו-±10% חלבון\n\nנתחיל?',
        chips: ['בוא נבנה תפריט אישי', 'הצג את התפריט שלי', 'החלף מנה בתפריט']
      };
    }

    // Fallback for valid nutrition-domain queries that didn't match a specific action
    const p = SS.loadProfile();
    return {
      role: 'orna',
      text: `${greetingPrefix(p)}אני רואה שאת/ה שואל/ת על תזונה ותפריט. כרגע הפרופיל שלך עומד על **${SS.num(p.calories)} קק״ל** ו-**${p.protein}ג׳ חלבון** ביום (רמת פעילות: ${SS.ACTIVITY[p.activity].label}, תקציב: ${SS.TIERS[p.tier].label}).\nאפשר להגיד לי למשל: "אני מתאמן 4 פעמים בשבוע", "אני לא אוהב פטריות", "תחליפי את ארוחת הבוקר" או ללחוץ על אחת הפעולות כאן:`,
      chips: ['בוא נבנה תפריט אישי', 'החלף מנה בתפריט', 'עדכן רמת פעילות', 'הצג את התפריט שלי']
    };
  }

  function executeDishSwap(slot, dishId) {
    if (!D || !D.SLOTS[slot] || !D.DISHES[dishId]) return null;
    const overrides = SS.loadMenu();
    overrides[slot] = dishId;
    SS.saveMenu(overrides);
    SS.apply();
    return {
      role: 'orna',
      text: `בוצע! החלפתי את **${D.SLOTS[slot].label}** ל-**${D.DISHES[dishId].name}** (${D.DISHES[dishId].kcal} קק״ל, ${D.DISHES[dishId].protein}ג׳ חלבון) ✅\nהדשבורד וסל הקניות כבר עודכנו בהתאם.`,
      chips: ['החלף מנה נוספת', 'הצג את התפריט שלי']
    };
  }

  // =========================================================================
  // 5. FLOATING WIDGET UI (Fresh Precision Design System)
  // =========================================================================
  const ORNA_AVATAR_SVG = `
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="width:100%;height:100%;">
      <circle cx="20" cy="20" r="20" fill="#CCFBF1"/>
      <circle cx="20" cy="15.5" r="6.5" fill="#0F766E"/>
      <path d="M9.5 33.5C11 27.5 14.8 24.5 20 24.5C25.2 24.5 29 27.5 30.5 33.5" fill="#0F766E"/>
      <circle cx="30" cy="11" r="5" fill="#D97706"/>
      <path d="M28.2 11.2L29.5 12.5L32 9.8" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  function formatRichText(text) {
    return esc(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function renderCardHTML(card) {
    if (!card) return '';
    if (card.type === 'menu') {
      const c = card.data;
      const page = (location.pathname.split('/').pop() || '').toLowerCase();
      const rows = c.slots.map((s) => `
        <div class="orna-slot-row">
          <div class="orna-slot-main">
            <span class="orna-slot-tag">${esc(s.label)}</span>
            <span class="orna-slot-name">${esc(s.name)}</span>
          </div>
          ${s.kcal ? `<span class="orna-slot-kcal">${s.kcal} קק״ל · ${s.protein}ג׳</span>` : ''}
        </div>`).join('');
      return `
        <div class="orna-card">
          <div class="orna-card-head">
            <div>
              <div class="orna-card-title">התפריט השבועי${c.userName ? ` של ${esc(c.userName)}` : ''}</div>
              <div class="orna-card-sub">${esc(c.goalLabel)} · פעילות ${esc(c.activityLabel)} · תקציב ${esc(c.tierLabel)}</div>
            </div>
            <span class="orna-pill-teal">${SS.num(c.calories)} קק״ל</span>
          </div>
          <div class="orna-macro-row">
            <span class="orna-macro protein">חלבון ${c.protein}ג׳</span>
            <span class="orna-macro carbs">פחמימה ${c.carbs}ג׳</span>
            <span class="orna-macro fat">שומן ${c.fat}ג׳</span>
          </div>
          <div class="orna-slot-list">${rows}</div>
          <div class="orna-card-foot">
            <span>סל משוער (${esc(c.store)}): <strong>${SS.money(c.cartTotal, 2)}</strong> / ${SS.money(c.budget)}</span>
          </div>
          <div class="orna-card-actions">
            ${page === 'dashboard.html'
              ? '<button type="button" class="orna-btn-primary" data-orna-close="1">צפה בתפריט בדף</button>'
              : '<a class="orna-btn-primary" href="dashboard.html">לצפייה בתפריט המלא</a>'}
            <a class="orna-btn-secondary" href="cart.html">לסל הקניות</a>
          </div>
        </div>`;
    }
    if (card.type === 'swap') {
      const s = card.data;
      const pct = (x) => (x >= 0 ? '+' : '−') + Math.abs(x * 100).toFixed(1) + '%';
      const opts = s.options.map((o) => `
        <div class="orna-swap-row">
          <div class="orna-swap-info">
            <div class="orna-swap-name">${esc(o.name)}</div>
            <div class="orna-swap-meta">${o.kcal} קק״ל (<span dir="ltr">${pct(o.kcalDiff)}</span>) · ${o.protein}ג׳ חלבון (<span dir="ltr">${pct(o.proteinDiff)}</span>) · ${o.prep} דק׳</div>
          </div>
          <button type="button" class="orna-swap-pick" data-orna-swap-slot="${esc(s.slot)}" data-orna-swap-dish="${esc(o.id)}">בחר</button>
        </div>`).join('');
      return `<div class="orna-card"><div class="orna-card-title" style="margin-bottom:8px;">חלופות עבור ${esc(s.slotLabel)}</div>${opts}</div>`;
    }
    return '';
  }

  function injectStyles() {
    if (document.getElementById('orna-styles')) return;
    const style = document.createElement('style');
    style.id = 'orna-styles';
    style.textContent = `
      #orna-root { font-family: 'Rubik', sans-serif; font-variant-numeric: tabular-nums; direction: rtl; }
      #orna-fab-wrap {
        position: fixed; left: 20px; bottom: 20px; z-index: 9980;
        display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
      }
      body.ss-orna-onboarding #orna-fab-wrap { bottom: 86px; }
      @media (max-width: 767px) {
        #orna-fab-wrap { left: 14px; bottom: 16px; }
        body.ss-has-tabbar #orna-fab-wrap { bottom: 76px; }
        body.ss-has-tabbar.ss-has-dock #orna-fab-wrap { bottom: 148px; }
        body.ss-orna-onboarding #orna-fab-wrap { bottom: 84px; }
      }
      #orna-nudge {
        background: #FFFFFF; color: #0F172A; border: 1px solid #E2E8F0;
        border-radius: 14px; padding: 10px 12px; max-width: 245px;
        box-shadow: 0 10px 26px -8px rgba(15, 23, 42, 0.18);
        font-size: 12.5px; line-height: 1.45; display: flex; align-items: flex-start; gap: 8px;
        animation: ornaPop 0.28s ease-out;
      }
      #orna-nudge-close {
        background: transparent; border: none; color: #94A3B8; cursor: pointer;
        padding: 0; font-size: 16px; line-height: 1; flex-shrink: 0;
      }
      #orna-nudge-close:hover { color: #0F172A; }
      #orna-fab {
        display: inline-flex; align-items: center; gap: 10px;
        background: #0F766E; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.18);
        border-radius: 9999px; padding: 8px 14px 8px 16px; cursor: pointer;
        box-shadow: 0 10px 24px -6px rgba(15, 118, 110, 0.45);
        transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
      }
      #orna-fab:hover { background: #115E59; transform: translateY(-2px); box-shadow: 0 14px 28px -6px rgba(15, 118, 110, 0.5); }
      #orna-fab:active { transform: scale(0.97); }
      .orna-fab-avatar { width: 34px; height: 34px; border-radius: 9999px; overflow: hidden; flex-shrink: 0; border: 2px solid #99F6E4; }
      .orna-fab-text { display: flex; flex-direction: column; text-align: right; line-height: 1.2; }
      .orna-fab-title { font-size: 13.5px; font-weight: 700; }
      .orna-fab-sub { font-size: 11px; color: #CCFBF1; font-weight: 500; }
      @media (max-width: 480px) {
        #orna-fab { padding: 7px 12px; gap: 8px; }
        .orna-fab-sub { display: none; }
      }

      #orna-backdrop {
        position: fixed; inset: 0; z-index: 9985; background: rgba(15, 23, 42, 0.35);
        backdrop-filter: blur(2px); display: none;
      }
      @media (min-width: 768px) { #orna-backdrop { display: none !important; } }

      #orna-panel {
        position: fixed; left: 20px; bottom: 20px; z-index: 9990; isolation: isolate;
        width: 400px; max-width: calc(100vw - 24px); height: 610px; max-height: calc(100dvh - 40px);
        background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 20px;
        box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
        display: flex; flex-direction: column; overflow: hidden;
      }
      #orna-panel.orna-animate { animation: ornaPop 0.18s ease-out; }
      @media (max-width: 767px) {
        #orna-panel {
          left: 0; right: 0; bottom: 0; width: 100%; max-width: 100%;
          height: 86dvh; max-height: 86dvh; border-radius: 20px 20px 0 0; border-bottom: none;
        }
      }
      @keyframes ornaPop {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .orna-header {
        background: #0F766E; color: #FFFFFF; padding: 14px 16px;
        display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-shrink: 0;
      }
      .orna-header-id { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .orna-header-avatar { width: 38px; height: 38px; border-radius: 9999px; overflow: hidden; flex-shrink: 0; border: 2px solid #99F6E4; }
      .orna-header-name { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
      .orna-role-pill { font-size: 10.5px; font-weight: 600; background: #D97706; color: #FFFFFF; padding: 2px 7px; border-radius: 9999px; }
      .orna-header-sub { font-size: 11.5px; color: #CCFBF1; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .orna-header-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
      .orna-icon-btn {
        background: rgba(255,255,255,0.14); color: #FFFFFF; border: none; border-radius: 8px;
        width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background-color 0.15s ease;
      }
      .orna-icon-btn:hover { background: rgba(255,255,255,0.24); }

      .orna-status-bar {
        background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 7px 14px;
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        font-size: 11.5px; color: #475569; flex-shrink: 0;
      }
      .orna-status-dot { width: 7px; height: 7px; border-radius: 9999px; background: #059669; display: inline-block; margin-left: 6px; }

      .orna-feed {
        flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px;
      }
      .orna-msg { display: flex; flex-direction: column; max-width: 90%; gap: 6px; }
      .orna-msg.orna { align-self: flex-start; }
      .orna-msg.user { align-self: flex-end; }
      .orna-bubble {
        padding: 10px 13px; border-radius: 16px; font-size: 13.5px; line-height: 1.55; word-break: break-word;
      }
      .orna-msg.orna .orna-bubble {
        background: #FFFFFF; color: #0F172A; border: 1px solid #E2E8F0; border-top-right-radius: 4px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      }
      .orna-msg.orna.blocked .orna-bubble {
        background: #FFFBEB; border-color: #FCD34D;
      }
      .orna-msg.user .orna-bubble {
        background: #0F766E; color: #FFFFFF; border-top-left-radius: 4px;
      }
      .orna-block-badge {
        display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;
        color: #92400E; background: #FEF3C7; padding: 2px 8px; border-radius: 9999px; align-self: flex-start;
      }

      .orna-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
      .orna-chip {
        background: #FFFFFF; color: #0F766E; border: 1px solid #99F6E4;
        border-radius: 9999px; padding: 6px 11px; font-size: 12px; font-weight: 600;
        cursor: pointer; transition: background-color 0.15s ease, border-color 0.15s ease;
        font-family: inherit;
      }
      .orna-chip:hover { background: #CCFBF1; border-color: #0F766E; }

      .orna-card {
        background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; padding: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05); width: 100%;
      }
      .orna-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
      .orna-card-title { font-size: 13.5px; font-weight: 700; color: #0F172A; }
      .orna-card-sub { font-size: 11.5px; color: #475569; margin-top: 2px; }
      .orna-pill-teal { background: #CCFBF1; color: #134E4A; font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 9999px; white-space: nowrap; }
      .orna-macro-row { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .orna-macro { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; }
      .orna-macro.protein { background: #ECFDF5; color: #047857; }
      .orna-macro.carbs { background: #FFFBEB; color: #D97706; }
      .orna-macro.fat { background: #F8FAFC; color: #B45309; border: 1px solid #E2E8F0; }
      .orna-slot-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
      .orna-slot-row {
        display: flex; flex-direction: column; gap: 2px; padding: 6px 8px;
        background: #F8FAFC; border-radius: 8px; border: 1px solid #EEF2F6;
      }
      .orna-slot-main { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
      .orna-slot-tag { font-size: 10.5px; font-weight: 700; color: #0F766E; white-space: nowrap; }
      .orna-slot-name { font-size: 12px; font-weight: 500; color: #0F172A; }
      .orna-slot-kcal { font-size: 11px; color: #64748B; }
      .orna-card-foot { font-size: 12px; color: #047857; background: #ECFDF5; padding: 6px 10px; border-radius: 8px; margin-bottom: 10px; }
      .orna-card-actions { display: flex; gap: 8px; }
      .orna-btn-primary, .orna-btn-secondary {
        flex: 1; text-align: center; text-decoration: none; border-radius: 8px; padding: 8px 10px;
        font-size: 12.5px; font-weight: 600; cursor: pointer; font-family: inherit; border: none;
      }
      .orna-btn-primary { background: #0F766E; color: #FFFFFF; }
      .orna-btn-primary:hover { background: #115E59; }
      .orna-btn-secondary { background: #F1F5F9; color: #0F172A; border: 1px solid #E2E8F0; }
      .orna-btn-secondary:hover { background: #E2E8F0; }

      .orna-swap-row {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        padding: 8px; border-radius: 10px; background: #F8FAFC; border: 1px solid #E2E8F0; margin-bottom: 6px;
      }
      .orna-swap-row:last-child { margin-bottom: 0; }
      .orna-swap-name { font-size: 12.5px; font-weight: 600; color: #0F172A; }
      .orna-swap-meta { font-size: 11px; color: #475569; margin-top: 2px; }
      .orna-swap-pick {
        background: #0F766E; color: #FFFFFF; border: none; border-radius: 8px;
        padding: 6px 11px; font-size: 12px; font-weight: 600; cursor: pointer; flex-shrink: 0; font-family: inherit;
      }
      .orna-swap-pick:hover { background: #115E59; }

      .orna-typing {
        display: inline-flex; align-items: center; gap: 4px; padding: 10px 14px;
        background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; align-self: flex-start;
      }
      .orna-typing span {
        width: 6px; height: 6px; border-radius: 9999px; background: #0F766E; opacity: 0.4;
        animation: ornaDot 1s infinite ease-in-out;
      }
      .orna-typing span:nth-child(2) { animation-delay: 0.16s; }
      .orna-typing span:nth-child(3) { animation-delay: 0.32s; }
      @keyframes ornaDot { 0%, 80%, 100% { opacity: 0.35; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }

      .orna-composer {
        background: #FFFFFF; border-top: 1px solid #E2E8F0; padding: 10px 12px;
        display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        padding-bottom: max(10px, env(safe-area-inset-bottom));
      }
      #orna-input {
        flex: 1; background: #F1F5F9; color: #0F172A; border: 1px solid #E2E8F0;
        border-radius: 8px; padding: 9px 12px; font-size: 13.5px; font-family: inherit; outline: none;
      }
      #orna-input:focus { border-color: #0F766E; background: #FFFFFF; }
      #orna-send {
        background: #0F766E; color: #FFFFFF; border: none; border-radius: 8px;
        width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; transition: background-color 0.15s ease;
      }
      #orna-send:hover { background: #115E59; }
      #orna-send:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
  }

  let session = null;
  let rootEl = null;

  function mountWidget() {
    if (typeof document === 'undefined' || !SS || !D) return;
    if (document.getElementById('orna-root')) return;
    injectStyles();

    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    if (page === 'onboarding.html') document.body.classList.add('ss-orna-onboarding');

    session = loadSession();
    if (!session.messages.length) {
      session.messages.push(makeWelcomeMessage());
      const p = SS.loadProfile();
      session.step = p.name ? 'ready' : 'ask_name';
      saveSession(session);
    }

    rootEl = document.createElement('div');
    rootEl.id = 'orna-root';
    rootEl.innerHTML = `
      <div id="orna-fab-wrap" ${session.open ? 'hidden' : ''}>
        <div id="orna-nudge" ${session.nudgeDismissed || session.open ? 'hidden' : ''}>
          <span>היי! אני <strong>אורנה</strong>, התזונאית שלך 🥗 רוצה שאבנה לך תפריט לפי רמת הפעילות?</span>
          <button type="button" id="orna-nudge-close" aria-label="סגור הצעה">×</button>
        </div>
        <button type="button" id="orna-fab" aria-label="פתח שיחה עם אורנה התזונאית" aria-expanded="${session.open ? 'true' : 'false'}">
          <span class="orna-fab-avatar">${ORNA_AVATAR_SVG}</span>
          <span class="orna-fab-text">
            <span class="orna-fab-title">אורנה • תזונאית</span>
            <span class="orna-fab-sub">בניית תפריט והתאמה אישית</span>
          </span>
        </button>
      </div>
      <div id="orna-backdrop" ${session.open ? 'style="display:block"' : ''}></div>
      <section id="orna-panel" role="dialog" aria-modal="false" aria-label="שיחה עם אורנה התזונאית" ${session.open ? '' : 'hidden'}>
        <div class="orna-header">
          <div class="orna-header-id">
            <div class="orna-header-avatar">${ORNA_AVATAR_SVG}</div>
            <div style="min-width:0;">
              <div class="orna-header-name">
                <span>אורנה</span>
                <span class="orna-role-pill">תזונאית ShelfSense</span>
              </div>
              <div class="orna-header-sub">מתמחה בהתאמת פעילות ובניית תפריט בלבד</div>
            </div>
          </div>
          <div class="orna-header-actions">
            <button type="button" class="orna-icon-btn" id="orna-reset" title="שיחה חדשה" aria-label="התחל שיחה חדשה">
              <span class="material-symbols-outlined" style="font-size:18px;">refresh</span>
            </button>
            <button type="button" class="orna-icon-btn" id="orna-close" title="סגור" aria-label="סגור צ׳אט">
              <span class="material-symbols-outlined" style="font-size:18px;">close</span>
            </button>
          </div>
        </div>
        <div class="orna-status-bar" id="orna-status-bar"></div>
        <div class="orna-feed" id="orna-feed" aria-live="polite"></div>
        <form class="orna-composer" id="orna-form" autocomplete="off">
          <input type="text" id="orna-input" placeholder="ספר/י לאורנה על הפעילות והתפריט שלך..." aria-label="הודעה לאורנה" maxlength="300" />
          <button type="submit" id="orna-send" aria-label="שלח הודעה">
            <span class="material-symbols-outlined" style="font-size:20px;transform:scaleX(-1);">send</span>
          </button>
        </form>
      </section>
    `;
    document.body.appendChild(rootEl);

    // Wire events
    document.getElementById('orna-fab').addEventListener('click', () => setOpen(true));
    document.getElementById('orna-close').addEventListener('click', () => setOpen(false));
    document.getElementById('orna-backdrop').addEventListener('click', () => setOpen(false));
    document.getElementById('orna-nudge-close').addEventListener('click', () => {
      session.nudgeDismissed = true;
      saveSession(session);
      document.getElementById('orna-nudge').hidden = true;
    });
    document.getElementById('orna-reset').addEventListener('click', resetConversation);

    document.getElementById('orna-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('orna-input');
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      handleUserInput(val);
    });

    document.getElementById('orna-feed').addEventListener('click', (e) => {
      const chip = e.target.closest('.orna-chip');
      if (chip) { handleUserInput(chip.dataset.chip); return; }

      const swapBtn = e.target.closest('.orna-swap-pick');
      if (swapBtn) {
        const reply = executeDishSwap(swapBtn.dataset.ornaSwapSlot, swapBtn.dataset.ornaSwapDish);
        if (reply) {
          session.messages.push(reply);
          saveSession(session);
          renderFeed();
          updateStatusBar();
        }
        return;
      }

      if (e.target.closest('[data-orna-close]')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && session && session.open) setOpen(false);
    });

    window.addEventListener('shelfsense:change', updateStatusBar);

    updateStatusBar();
    renderFeed();
  }

  function updateStatusBar() {
    const bar = document.getElementById('orna-status-bar');
    if (!bar || !SS) return;
    const p = SS.loadProfile();
    const who = p.name ? `${esc(p.name)} · ` : '';
    const act = (SS.ACTIVITY[p.activity] || SS.ACTIVITY.moderate).label;
    bar.innerHTML = `
      <span><span class="orna-status-dot"></span>${who}פעילות: <strong>${esc(act)}</strong></span>
      <span>${SS.num(p.calories)} קק״ל · ${p.protein}ג׳ חלבון</span>
    `;
  }

  function renderFeed(showTyping) {
    const feed = document.getElementById('orna-feed');
    if (!feed || !session) return;
    const lastIdx = session.messages.length - 1;
    feed.innerHTML = session.messages.map((m, idx) => {
      const isLast = idx === lastIdx && !showTyping;
      const chipsHTML = (isLast && m.chips && m.chips.length)
        ? `<div class="orna-chips">${m.chips.map((c) => `<button type="button" class="orna-chip" data-chip="${esc(c)}">${esc(c)}</button>`).join('')}</div>`
        : '';
      const badgeHTML = m.blocked && m.badge
        ? `<span class="orna-block-badge"><span class="material-symbols-outlined" style="font-size:13px;">shield</span>${esc(m.badge)}</span>`
        : '';
      return `
        <div class="orna-msg ${m.role}${m.blocked ? ' blocked' : ''}">
          ${badgeHTML}
          <div class="orna-bubble">${formatRichText(m.text)}</div>
          ${m.card ? renderCardHTML(m.card) : ''}
          ${chipsHTML}
        </div>`;
    }).join('') + (showTyping ? '<div class="orna-typing" aria-label="אורנה מקלידה"><span></span><span></span><span></span></div>' : '');
    feed.scrollTop = feed.scrollHeight;
  }

  function setOpen(isOpen) {
    if (!session) return;
    session.open = !!isOpen;
    if (isOpen) session.nudgeDismissed = true;
    saveSession(session);
    const panel = document.getElementById('orna-panel');
    const fabWrap = document.getElementById('orna-fab-wrap');
    const backdrop = document.getElementById('orna-backdrop');
    const fab = document.getElementById('orna-fab');
    const nudge = document.getElementById('orna-nudge');
    if (panel) {
      panel.hidden = !isOpen;
      panel.classList.toggle('orna-animate', isOpen);
    }
    if (fabWrap) fabWrap.hidden = isOpen;
    if (backdrop) backdrop.style.display = isOpen ? 'block' : 'none';
    if (fab) fab.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (nudge && session.nudgeDismissed) nudge.hidden = true;
    if (isOpen) {
      updateStatusBar();
      renderFeed();
      setTimeout(() => {
        const input = document.getElementById('orna-input');
        if (input) input.focus();
      }, 60);
    }
  }

  function handleUserInput(text) {
    session.messages.push({ role: 'user', text });
    saveSession(session);
    renderFeed(true);
    setTimeout(() => {
      const reply = processMessage(text, session);
      session.messages.push(reply);
      saveSession(session);
      renderFeed(false);
      updateStatusBar();
    }, 280);
  }

  function resetConversation() {
    const wasOpen = session ? session.open : true;
    session = DEFAULT_SESSION();
    session.open = wasOpen;
    session.nudgeDismissed = true;
    const p = SS.loadProfile();
    session.step = p.name ? 'ask_activity' : 'ask_name';
    session.messages.push(makeWelcomeMessage());
    saveSession(session);
    updateStatusBar();
    renderFeed(false);
  }

  window.ShelfSenseOrna = {
    classifyTopic,
    extractEntities,
    processMessage,
    executeDishSwap,
    open: () => setOpen(true),
    close: () => setOpen(false),
    reset: resetConversation,
    getState: () => session
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountWidget);
    else mountWidget();
  }
})();
