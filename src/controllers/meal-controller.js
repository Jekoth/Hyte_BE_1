import {
  getMealsByUserId,
  addMeal,
  deleteMealByIdAndUserId,
} from '../models/meal-model.js';

const SEARCH_URL = 'https://world.openfoodfacts.net/cgi/search.pl';
const FETCH_TIMEOUT_MS = 15000;

const foodTranslations = {
  banaani: 'banana',
  omena: 'apple',
  päärynä: 'pear',
  appelsiini: 'orange',
  mandariini: 'mandarin',
  kana: 'chicken',
  kanafilee: 'chicken breast',
  broileri: 'chicken',
  riisi: 'rice',
  pasta: 'pasta',
  makaroni: 'macaroni',
  kaurahiutaleet: 'oats',
  kaura: 'oats',
  jogurtti: 'yogurt',
  yoghurt: 'yogurt',
  maito: 'milk',
  juusto: 'cheese',
  cheddar: 'cheddar',
  leipä: 'bread',
  ruisleipä: 'rye bread',
  kananmuna: 'egg',
  muna: 'egg',
  lohi: 'salmon',
  tonnikala: 'tuna',
  peruna: 'potato',
  kurkku: 'cucumber',
  tomaatti: 'tomato',
  salaatti: 'lettuce',
  avokado: 'avocado',
  maapähkinävoi: 'peanut butter',
  voi: 'butter',
  kinkku: 'ham',
  jauheliha: 'ground beef',
  naudanliha: 'beef',
  porsaanliha: 'pork',
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const round = (value) => Math.round((value + Number.EPSILON) * 10) / 10;

const normalizeQuery = (query) =>
  query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const translateFoodName = (query) => {
  const normalized = normalizeQuery(query);
  return foodTranslations[normalized] || normalized;
};

const pickNutriment = (nutriments, keys) => {
  for (const key of keys) {
    const value = nutriments?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return toNumber(value);
    }
  }
  return 0;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJsonWithRetry = async (url, retries = 1) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(600);
      }
    }
  }

  throw lastError;
};

const scoreProductMatch = (product, query) => {
  const nutriments = product?.nutriments || {};
  const name = (product?.product_name || '').toLowerCase();
  const brands = (product?.brands || '').toLowerCase();
  const q = normalizeQuery(query);

  let score = 0;

  if (name === q) score += 100;
  if (name.includes(q)) score += 50;
  if (brands.includes(q)) score += 10;

  if (pickNutriment(nutriments, ['energy-kcal_100g', 'energy-kcal']) > 0) score += 5;
  if (pickNutriment(nutriments, ['proteins_100g', 'proteins']) > 0) score += 5;
  if (pickNutriment(nutriments, ['carbohydrates_100g', 'carbohydrates']) > 0) score += 5;
  if (pickNutriment(nutriments, ['fat_100g', 'fat']) > 0) score += 5;

  return score;
};

const searchFood = async (query) => {
  const translatedQuery = translateFoodName(query);

  const url = new URL(SEARCH_URL);
  url.searchParams.set('search_terms', translatedQuery);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', '10');
  url.searchParams.set(
    'fields',
    'product_name,brands,nutriments,nutrition_grades,code'
  );

  const data = await fetchJsonWithRetry(url.toString(), 1);
  const products = Array.isArray(data.products) ? data.products : [];

  const validProducts = products.filter((product) => {
    const nutriments = product?.nutriments || {};
    return (
      pickNutriment(nutriments, ['energy-kcal_100g', 'energy-kcal']) > 0 ||
      pickNutriment(nutriments, ['proteins_100g', 'proteins']) > 0 ||
      pickNutriment(nutriments, ['carbohydrates_100g', 'carbohydrates']) > 0 ||
      pickNutriment(nutriments, ['fat_100g', 'fat']) > 0
    );
  });

  if (!validProducts.length) {
    throw new Error(`Ruoka-aineelle "${query}" ei löytynyt ravintoarvoja.`);
  }

  validProducts.sort(
    (a, b) => scoreProductMatch(b, translatedQuery) - scoreProductMatch(a, translatedQuery)
  );

  return validProducts[0];
};

const getMacrosPer100g = (product) => {
  const nutriments = product?.nutriments || {};

  return {
    kcal: pickNutriment(nutriments, ['energy-kcal_100g', 'energy-kcal']),
    protein: pickNutriment(nutriments, ['proteins_100g', 'proteins']),
    carbs: pickNutriment(nutriments, ['carbohydrates_100g', 'carbohydrates']),
    fat: pickNutriment(nutriments, ['fat_100g', 'fat']),
    sugar: pickNutriment(nutriments, ['sugars_100g', 'sugars']),
    fiber: pickNutriment(nutriments, ['fiber_100g', 'fiber']),
    salt: pickNutriment(nutriments, ['salt_100g', 'salt']),
    sodium: pickNutriment(nutriments, ['sodium_100g', 'sodium']) * 1000,
    nutriGrade: product?.nutrition_grades || '-',
    name: product?.product_name || 'Tuntematon tuote',
    brand: product?.brands || '',
    code: product?.code || '',
  };
};

const scaleMacros = (per100g, grams) => {
  const factor = grams / 100;
  return {
    kcal: per100g.kcal * factor,
    protein: per100g.protein * factor,
    carbs: per100g.carbs * factor,
    fat: per100g.fat * factor,
    sugar: per100g.sugar * factor,
    fiber: per100g.fiber * factor,
    salt: per100g.salt * factor,
    sodium: per100g.sodium * factor,
  };
};

const calculateScore = (totals) => {
  let score = 10;
  const notes = [];

  if (totals.kcal > 950) {
    score -= 3;
    notes.push('Erittäin suuri kalorimäärä yhdelle aterialle.');
  } else if (totals.kcal > 750) {
    score -= 2;
    notes.push('Melko suuri kalorimäärä.');
  } else if (totals.kcal >= 350 && totals.kcal <= 700) {
    notes.push('Kalorimäärä on kohtuullinen.');
  }

  if (totals.fat > 35) {
    score -= 2;
    notes.push('Rasvaa on paljon.');
  } else if (totals.fat > 20) {
    score -= 1;
    notes.push('Rasvaa on melko paljon.');
  }

  if (totals.sugar > 25) {
    score -= 2;
    notes.push('Sokeria on runsaasti.');
  } else if (totals.sugar > 12) {
    score -= 1;
    notes.push('Sokeria on kohtalaisesti.');
  }

  if (totals.salt > 2) {
    score -= 2;
    notes.push('Suolaa on paljon.');
  } else if (totals.salt > 1.2) {
    score -= 1;
    notes.push('Suolaa on melko paljon.');
  }

  if (totals.protein >= 25) {
    score += 1;
    notes.push('Proteiinia on hyvin.');
  }

  if (totals.fiber >= 8) {
    score += 1;
    notes.push('Kuitua on hyvin.');
  }

  if (totals.sugar > 20 && totals.fat > 20) {
    score -= 2;
    notes.push('Yhdistelmässä on paljon sekä sokeria että rasvaa.');
  }

  if (totals.carbs > 70 && totals.fiber < 5) {
    score -= 1;
    notes.push('Hiilihydraatteja on paljon mutta kuitua vähän.');
  }

  score = Math.max(1, Math.min(10, score));

  let label = 'Kohtalainen';
  let cssClass = 'score-mid';

  if (score >= 8) {
    label = 'Hyvä';
    cssClass = 'score-good';
  } else if (score <= 4) {
    label = 'Heikko';
    cssClass = 'score-bad';
  }

  return { score, label, cssClass, notes };
};

const buildMealName = (items) =>
  items
    .slice(0, 3)
    .map((item) => item.inputName)
    .join(', ');

const getMyMeals = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const meals = await getMealsByUserId(user_id);

    const parsedMeals = meals.map((meal) => ({
      ...meal,
      items_json:
        typeof meal.items_json === 'string'
          ? JSON.parse(meal.items_json)
          : meal.items_json,
    }));

    res.json(parsedMeals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Aterioiden haku epäonnistui.' });
  }
};

const postMeal = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const {
      meal_name,
      items_json,
      calories,
      protein,
      carbs,
      fat,
      sugar,
      fiber,
      salt,
      sodium,
      health_score,
      health_label,
      analysis,
    } = req.body;

    if (!Array.isArray(items_json) || items_json.length === 0) {
      return res.status(400).json({ message: 'Aterian sisältö puuttuu.' });
    }

    const meal = await addMeal({
      user_id,
      meal_name,
      items_json,
      calories,
      protein,
      carbs,
      fat,
      sugar,
      fiber,
      salt,
      sodium,
      health_score,
      health_label,
      analysis,
    });

    if (!meal) {
      return res.status(500).json({ message: 'Aterian tallennus epäonnistui.' });
    }

    res.status(201).json({
      message: 'Ateria tallennettu.',
      ...meal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Aterian tallennus epäonnistui.' });
  }
};

const deleteMeal = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const meal_id = Number(req.params.id);

    if (!meal_id) {
      return res.status(400).json({ message: 'Virheellinen meal_id.' });
    }

    const deleted = await deleteMealByIdAndUserId(meal_id, user_id);

    if (!deleted) {
      return res.status(404).json({ message: 'Ateriaa ei löytynyt.' });
    }

    res.json({ message: 'Ateria poistettu.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Aterian poisto epäonnistui.' });
  }
};

const analyzeMeal = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    if (!items.length) {
      return res.status(400).json({
        message: 'Lisää vähintään yksi ruoka-aine ja määrä grammoina.',
      });
    }

    const resolvedItems = [];

    for (const item of items) {
      const inputName = String(item.name || item.inputName || '').trim();
      const grams = Number(item.grams);

      if (!inputName || !Number.isFinite(grams) || grams <= 0) {
        return res.status(400).json({
          message: 'Virheellinen ruoka-aine tai grammamäärä.',
        });
      }

      const product = await searchFood(inputName);
      const per100g = getMacrosPer100g(product);
      const scaled = scaleMacros(per100g, grams);

      resolvedItems.push({
        inputName,
        grams,
        product: per100g,
        totals: scaled,
      });
    }

    const totals = resolvedItems.reduce(
      (sum, item) => ({
        kcal: sum.kcal + item.totals.kcal,
        protein: sum.protein + item.totals.protein,
        carbs: sum.carbs + item.totals.carbs,
        fat: sum.fat + item.totals.fat,
        sugar: sum.sugar + item.totals.sugar,
        fiber: sum.fiber + item.totals.fiber,
        salt: sum.salt + item.totals.salt,
        sodium: sum.sodium + item.totals.sodium,
      }),
      {
        kcal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        sugar: 0,
        fiber: 0,
        salt: 0,
        sodium: 0,
      }
    );

    const roundedTotals = {
      kcal: round(totals.kcal),
      protein: round(totals.protein),
      carbs: round(totals.carbs),
      fat: round(totals.fat),
      sugar: round(totals.sugar),
      fiber: round(totals.fiber),
      salt: round(totals.salt),
      sodium: Math.round(totals.sodium),
    };

    const scoreInfo = calculateScore(roundedTotals);

    const response = {
      mealName: buildMealName(resolvedItems),
      items: resolvedItems,
      totals: roundedTotals,
      scoreInfo,
    };

    if (typeof req.guestUsesRemaining === 'number') {
      response.guestUsesRemaining = req.guestUsesRemaining;
    }

    res.json(response);
  } catch (error) {
    console.error('analyzeMeal failed:', error);
    res.status(500).json({
      message: error.message || 'Aterian laskenta epäonnistui.',
    });
  }
};

export { getMyMeals, postMeal, deleteMeal, analyzeMeal };
