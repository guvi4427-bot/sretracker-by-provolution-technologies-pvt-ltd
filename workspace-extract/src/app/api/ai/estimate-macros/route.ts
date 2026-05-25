import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FOOD_DATABASE, UNIT_TO_GRAMS } from '@/lib/constants';
import { SUPPLEMENT_DATABASE, SUPPLEMENT_UNIT_TO_GRAMS } from '@/lib/supplement-db';
import { aiStructuredChat } from '@/lib/ai-provider';
import { db } from '@/lib/db';

// ── Unit Conversion Engine ──
// Converts any user input (quantity + unit) into grams for macro calculation.
// All FOOD_DATABASE and SUPPLEMENT_DATABASE entries are per 100g, so: multiplier = grams / 100

// Imperial unit aliases
const IMPERIAL_ALIASES: Record<string, string> = {
  'oz': 'oz',
  'ounce': 'oz',
  'ounces': 'oz',
  'fl oz': 'fl oz',
  'fl. oz.': 'fl oz',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  'lb': 'lb',
  'lbs': 'lb',
  'pound': 'lb',
  'pounds': 'lb',
};

// Supplement-specific unit aliases
const UNIT_ALIASES: Record<string, string> = {
  ...IMPERIAL_ALIASES,
  'tab': 'tablet',
  'tabs': 'tablet',
  'tablets': 'tablet',
  'cap': 'capsule',
  'caps': 'capsule',
  'capsules': 'capsule',
  'softgels': 'softgel',
  'gummies': 'gummy',
  'pcs': 'piece',
  'pc': 'piece',
  'pieces': 'piece',
  'sachets': 'sachet',
  'packets': 'packet',
  'pkt': 'packet',
  'scoops': 'scoop',
  'servings': 'serving',
  'serve': 'serving',
  'bars': 'bar',
  'mls': 'ml',
  'mgs': 'mg',
  'can': 'can',
  'bottle': 'bottle',
  'drops': 'drop',
};

function convertToGrams(mealName: string, quantity: number, unit: string): number {
  const u = UNIT_ALIASES[unit.toLowerCase().trim()] || unit.toLowerCase().trim();
  const foodKey = mealName.toLowerCase().trim();

  // Direct weight/volume units → already in grams/ml
  if (u === 'g') return quantity;
  if (u === 'ml') return quantity; // 1ml ≈ 1g for water-based foods
  if (u === 'mg') return quantity * 0.001; // milligrams to grams

  // ── Step 1: Check brand+variant specific unit conversions (highest priority) ──
  // Generate comprehensive lookup keys from the food name to match brand+variant entries
  const words = foodKey.split(/\s+/).filter(w => w.length > 0);
  const supplementLookupKeys: string[] = [];

  // Full name match
  supplementLookupKeys.push(`${foodKey}:${u}`);

  // Brand name + partial variant matches (e.g., "nakpro impact whey blend:scoop")
  // Try progressively shorter prefixes
  for (let i = Math.min(words.length, 5); i >= 2; i--) {
    supplementLookupKeys.push(`${words.slice(0, i).join(' ')}:${u}`);
  }

  // First word (brand) + unit
  supplementLookupKeys.push(`${words[0]}:${u}`);

  for (const key of supplementLookupKeys) {
    if (SUPPLEMENT_UNIT_TO_GRAMS[key]) {
      return quantity * SUPPLEMENT_UNIT_TO_GRAMS[key];
    }
  }

  // ── Step 2: Check if the food name matches a supplement entry with servingSize ──
  // This handles brand-specific serving sizes (e.g., "MuscleBlaze Whey" scoop = 36g)
  const supplementMatch = findSupplementInDatabase(foodKey);
  if (supplementMatch && supplementMatch.servingSize) {
    // If the user's unit matches the supplement's default serving unit, use its serving size
    const supUnit = supplementMatch.servingUnit || 'serving';
    const unitMatches = (
      u === supUnit ||
      (u === 'scoop' && supUnit === 'scoop') ||
      (u === 'serving' && (supUnit === 'serving' || supUnit === 'scoop')) ||
      (u === 'bar' && supUnit === 'bar') ||
      (u === 'capsule' && (supUnit === 'capsule' || supUnit === 'softgel')) ||
      (u === 'tablet' && supUnit === 'tablet') ||
      (u === 'softgel' && (supUnit === 'softgel' || supUnit === 'capsule')) ||
      (u === 'gummy' && supUnit === 'gummy') ||
      (u === 'sachet' && (supUnit === 'sachet' || supUnit === 'packet')) ||
      (u === 'packet' && (supUnit === 'packet' || supUnit === 'sachet')) ||
      (u === 'ml' && supUnit === 'ml')
    );
    if (unitMatches) {
      return quantity * supplementMatch.servingSize;
    }
    // For scoop/serving on supplements, always use the supplement's serving size
    // This is the KEY change: when user enters brand+variant and selects "serving",
    // we use the brand-specific serving size, not the generic default
    if ((u === 'scoop' || u === 'serving') && supplementMatch.servingSize) {
      return quantity * supplementMatch.servingSize;
    }
  }

  // ── Step 3: Check food-specific UNIT_TO_GRAMS ──
  const foodLookupKeys = [
    `${foodKey}:${u}`,
    `${foodKey.split(' ')[0]}:${u}`,
  ];

  for (const key of foodLookupKeys) {
    if (UNIT_TO_GRAMS[key]) {
      return quantity * UNIT_TO_GRAMS[key];
    }
  }

  // ── Step 4: Check supplement default unit conversions ──
  const defaultSupplementKey = `default:${u}`;
  if (SUPPLEMENT_UNIT_TO_GRAMS[defaultSupplementKey]) {
    return quantity * SUPPLEMENT_UNIT_TO_GRAMS[defaultSupplementKey];
  }

  // ── Step 5: Fallback to food default conversion for the unit ──
  const defaultKey = `default:${u}`;
  if (UNIT_TO_GRAMS[defaultKey]) {
    return quantity * UNIT_TO_GRAMS[defaultKey];
  }

  // ── Step 6: Food-category-aware piece/serving fallback ──
  // When "piece" is used but no food-specific mapping exists, estimate weight
  // based on what category the food likely belongs to.
  const PIECE_WEIGHT_BY_CATEGORY: [RegExp, number][] = [
    // Nuts & seeds (very small per piece)
    [/\b(almond|cashew|peanut|walnut|pistachio|nut|seed|raisin|cranberry|pecan|hazelnut|macadamia|brazil nut)\b/i, 1.5],
    // Small fruits (berry-sized)
    [/\b(grape|berry|blueberry|strawberry|raspberry|cherry|olive|cranberry)\b/i, 5],
    // Indian breads
    [/\b(chapati|roti|paratha|naan|puri|kulcha|bhatura|thepla|rotli|phulka)\b/i, 40],
    // Eggs
    [/\b(egg)\b/i, 50],
    // Large fruits (whole)
    [/\b(banana|apple|mango|orange|pear|peach|guava|kiwi|lemon|lime)\b/i, 130],
    // Small sweets/confections
    [/\b(ladoo|peda|barfi|katli|sandesh|chikki|toffee|candy|truffle|praline)\b/i, 25],
    // Larger sweets
    [/\b(gulab jamun|rasgulla|rasmalai|imarti|jalebi|doughnut|donut)\b/i, 50],
    // Indian snacks
    [/\b(samosa|kachori|vada|tikki|pakora|bonda|cutlet)\b/i, 60],
    // Chocolates (piece = small square)
    [/\b(chocolate|dark chocolate)\b/i, 10],
    // Cheese (piece = small cube/slice)
    [/\b(cheese|paneer|tofu)\b/i, 30],
    // Cookies/biscuits
    [/\b(cookie|biscuit|cracker|wafer)\b/i, 30],
  ];

  const EXTRA_UNIT_GRAMS: Record<string, number> = {
    'slice': 30, 'bowl': 250, 'plate': 300,
    'glass': 240, 'can': 330, 'bottle': 500, 'packet': 50, 'bar': 60,
    'scoop': 30, 'medium': 150, 'large': 250, 'small': 80, 'whole': 200,
    'half': 100, 'handful': 30, 'katori': 150,
    // Supplement-specific
    'tablet': 1, 'capsule': 0.8, 'softgel': 1, 'gummy': 3,
    'sachet': 30, 'caplet': 1, 'pill': 0.5, 'lozenge': 2,
    'drop': 0.05, 'mg': 0.001,
    // Imperial
    'oz': 28.35, 'fl oz': 30, 'lb': 453.6,
  };

  // For "piece" unit, use category-aware estimation instead of a flat 120g default
  if (u === 'piece') {
    for (const [pattern, weight] of PIECE_WEIGHT_BY_CATEGORY) {
      if (pattern.test(mealName)) {
        return quantity * weight;
      }
    }
    // No category match: use a conservative default of 30g per piece
    // (covers most medium food items; better than the old 120g which was wildly wrong for small items)
    return quantity * 30;
  }

  if (EXTRA_UNIT_GRAMS[u]) {
    return quantity * EXTRA_UNIT_GRAMS[u];
  }

  // Ultimate fallback: treat quantity as grams
  return quantity;
}

// ── Database Search (scoring-based matching) for Food DB ──
function findInDatabase(searchKey: string) {
  let bestMatch: typeof FOOD_DATABASE[number] | null = null;
  let bestScore = 0;
  const searchWords = searchKey.split(/\s+/).filter(w => w.length > 1);

  for (const food of FOOD_DATABASE) {
    const foodKey = food.name.toLowerCase().trim();
    const foodWords = foodKey.split(/\s+/);
    let score = 0;

    // Exact match (highest priority)
    if (searchKey === foodKey) {
      score = 100;
    }
    // One fully contains the other — prefer closer length ratio (more specific match)
    else if (foodKey.includes(searchKey) || searchKey.includes(foodKey)) {
      const ratio = Math.min(searchKey.length, foodKey.length) / Math.max(searchKey.length, foodKey.length);
      score = 70 + ratio * 20; // 70-90 range
    }
    // Word-level matching — count how many search words match food words
    else {
      let matchedWords = 0;
      for (const sw of searchWords) {
        if (foodWords.some(fw => fw === sw || (sw.length > 3 && fw.includes(sw)))) {
          matchedWords++;
        }
      }
      if (matchedWords > 0) {
        score = (matchedWords / Math.max(searchWords.length, foodWords.length)) * 60;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = food;
    }
  }

  // Only return matches above threshold (avoid weak matches)
  return bestScore >= 40 ? bestMatch : null;
}

// ── Supplement Database Search (scoring-based matching) ──
// Also considers brand name for matching
function findSupplementInDatabase(searchKey: string) {
  let bestMatch: typeof SUPPLEMENT_DATABASE[number] | null = null;
  let bestScore = 0;
  const searchWords = searchKey.split(/\s+/).filter(w => w.length > 1);

  for (const supp of SUPPLEMENT_DATABASE) {
    const suppKey = supp.name.toLowerCase().trim();
    const brandKey = (supp.brand || '').toLowerCase().trim();
    const suppWords = suppKey.split(/\s+/);
    let score = 0;

    // Exact name match (highest priority)
    if (searchKey === suppKey) {
      score = 100;
    }
    // Exact match including brand
    else if (brandKey && searchKey === `${brandKey} ${suppKey}`) {
      score = 100;
    }
    // Name contains search or search contains name
    else if (suppKey.includes(searchKey) || searchKey.includes(suppKey)) {
      const ratio = Math.min(searchKey.length, suppKey.length) / Math.max(searchKey.length, suppKey.length);
      score = 70 + ratio * 20;
    }
    // Brand name + product name match
    else if (brandKey && (searchKey.includes(brandKey) || brandKey.includes(searchKey))) {
      const ratio = Math.min(searchKey.length, (brandKey + ' ' + suppKey).length) / Math.max(searchKey.length, (brandKey + ' ' + suppKey).length);
      score = 65 + ratio * 15;
    }
    // Word-level matching
    else {
      let matchedWords = 0;
      const allSearchWords = [...searchWords];
      // Also check against brand words
      const brandWords = brandKey.split(/\s+/).filter(w => w.length > 1);

      for (const sw of allSearchWords) {
        if (suppWords.some(fw => fw === sw || (sw.length > 3 && fw.includes(sw)))) {
          matchedWords++;
        } else if (brandWords.some(bw => bw === sw || (sw.length > 3 && bw.includes(sw)))) {
          matchedWords += 0.8; // Brand match slightly lower weight than product name match
        }
      }
      if (matchedWords > 0) {
        score = (matchedWords / Math.max(allSearchWords.length, suppWords.length)) * 60;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = supp;
    }
  }

  // Only return matches above threshold
  return bestScore >= 40 ? bestMatch : null;
}

// ── Compute DB macros for a given gram weight ──
function computeDbMacros(match: { calories: number; protein: number; carbs: number; fat: number; fiber: number }, grams: number) {
  const multiplier = Math.max(0.01, grams / 100);
  return {
    calories: Math.round(match.calories * multiplier),
    proteinG: Math.round(match.protein * multiplier * 10) / 10,
    carbsG: Math.round(match.carbs * multiplier * 10) / 10,
    fatG: Math.round(match.fat * multiplier * 10) / 10,
    fiberG: Math.round(match.fiber * multiplier * 10) / 10,
  };
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { mealName, quantity, quantityUnit } = await req.json();
    if (!mealName) return NextResponse.json({ error: 'Meal name required' }, { status: 400 });

    const quantityNum = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 1;
    const userUnit = (quantityUnit || 'g').toLowerCase();
    const searchKey = mealName.toLowerCase().trim();

    // Fetch user's fitness profile for context (diet type, unit system)
    let userDietType = '';
    let userUnitSystem = 'metric';
    try {
      const profile = await db.fitnessProfile.findUnique({
        where: { userId: session.user.id },
        select: { dietType: true, unitSystem: true },
      });
      if (profile?.dietType) userDietType = profile.dietType;
      if (profile?.unitSystem) userUnitSystem = profile.unitSystem;
    } catch {}

    // ── Step 1: Convert user input to grams ──
    const grams = convertToGrams(mealName, quantityNum, userUnit);

    // ── Step 2: Run DB lookup (food + supplement) AND AI estimation IN PARALLEL ──
    const [dbResult, supplementResult, aiResult] = await Promise.allSettled([
      // Food DB lookup
      Promise.resolve().then(() => {
        const match = findInDatabase(searchKey);
        if (!match) return null;
        return { ...computeDbMacros(match, grams), _matchName: match.name, _source: 'food' };
      }),
      // Supplement DB lookup
      Promise.resolve().then(() => {
        const match = findSupplementInDatabase(searchKey);
        if (!match) return null;
        return { ...computeDbMacros(match, grams), _matchName: match.name, _brand: match.brand, _source: 'supplement' };
      }),
      // AI estimation (async, 2-5 seconds)
      (async () => {
        const unitContext = userUnitSystem === 'imperial'
          ? 'The user uses the imperial system (oz, lbs, inches). Convert internally to metric for calculations.'
          : '';

        const dietContext = userDietType
          ? `The user follows a ${userDietType} diet.`
          : '';

        // Detect if this is likely a supplement query
        const supplementKeywords = ['whey', 'protein powder', 'creatine', 'bcaa', 'eaa', 'pre-workout', 'preworkout', 'mass gainer', 'fat burner', 'multivitamin', 'omega-3', 'fish oil', 'casein', 'isolate', 'glutamine', 'citrulline', 'beta-alanine', 'collagen', 'ashwagandha', 'shilajit', 'magnesium', 'zinc', 'vitamin', 'capsule', 'tablet', 'bar', 'scoop', 'gummy', 'softgel', 'mb', 'on', 'optimum', 'muscleblaze', 'myprotein', 'gnc', 'dymatize', 'bsn', 'muscletech', 'cellucor', 'ghost', 'isopure', 'quest', 'naked', 'orgain', 'vega', 'garden of life', 'nakpro', 'as-it-is', 'asitis', 'healthkart', 'nutrabay', 'fast&up', 'big muscles', 'six pack', 'labrada', 'herbalife', 'ensure', 'boost', 'horlicks', 'bournvita', 'complan', 'protinex', 'amway', 'huel', 'soylent', 'osoaa', 'avvatar', 'scitron', 'bigflex', 'naturaltein', 'wellcore', 'xlr8', 'fuel one', 'biozyme', 'nitro-tech', 'hydrowhey', 'creapure', 'impact whey', 'rule one', 'r1 protein', 'atom whey'];
        const isSupplementQuery = supplementKeywords.some(kw => searchKey.includes(kw));

        // If we found a supplement match in the DB, include its exact serving size in the AI context
        const supplementMatchForContext = findSupplementInDatabase(searchKey);
        const servingContext = supplementMatchForContext?.servingSize
          ? `\n- The database shows this product has a serving size of ${supplementMatchForContext.servingSize}g per ${supplementMatchForContext.servingUnit || 'serving'} with per-100g macros: ${supplementMatchForContext.protein}g protein, ${supplementMatchForContext.carbs}g carbs, ${supplementMatchForContext.fat}g fat, ${supplementMatchForContext.calories} calories`
          : '';

        const supplementContext = isSupplementQuery
          ? `\n\nIMPORTANT: This appears to be a dietary supplement query. Consider:\n- Protein powders (whey, casein, soy, pea, etc.) are typically measured per scoop (25-35g) or per serving\n- BRAND-SPECIFIC serving sizes vary: ON Gold Standard = 31g, MyProtein Impact Whey = 25g, MuscleBlaze Biozyme = 36g, Dymatize ISO 100 = 30g, Nakpro Impact Whey Blend = 48g, MuscleTech Nitro-Tech = 46g, ON Serious Mass = 334g\n- Creatine monohydrate is 0 calories, typically 3-5g per serving\n- BCAA/EAA powders are nearly calorie-free amino acid blends (~5-10g per serving)\n- Pre-workouts are typically 5-15 calories per serving (6-15g)\n- Vitamins/minerals in capsule/tablet form are negligible calories (1-5 cal each)\n- Protein bars are typically 180-250 cal per bar (50-65g each)\n- Fat burners are typically negligible calories per capsule\n- Mass gainers are typically 600-1250 cal per serving (100-334g powder)\n- Always calculate for the EXACT quantity and unit specified by the user\n- Brand-specific products have different macro profiles and serving sizes than generic versions\n- The gram weight (~${Math.round(grams)}g) was calculated using the brand-specific serving size when available${servingContext}`
          : '';

        const aiPrompt = `Estimate nutritional macros for: "${mealName}", quantity: ${quantityNum} ${userUnit} (~${Math.round(grams)}g).

${dietContext} ${unitContext} ${supplementContext}

This could be an Indian dish (e.g., dal, biryani, paneer butter masala, chole, samosa, dosa, idli, chapati, rajma, sambhar, poha, upma, kadhi, thali, gulab jamun, lassi, etc.) or a Western dish (e.g., pizza, burger, pasta, steak, salad, sandwich, smoothie bowl, etc.) or a dietary supplement (e.g., whey protein, creatine, BCAA, pre-workout, multivitamin, protein bar, mass gainer, etc.) or any world cuisine.

Consider common preparation methods:
- Indian curries: typically cooked with oil/ghee, onions, tomatoes, and spices
- Indian breads: chapati/roti are whole wheat, paratha has more fat, naan uses refined flour
- Dal/lentils: cooked with water, tempered with oil/ghee and spices (tadka)
- Western grilled items: minimal added fat
- Fried items: significantly higher fat content
- Restaurant/hotel preparations: typically 30-50% more oil than home-cooked

Return ONLY JSON: {"calories":number,"proteinG":number,"carbsG":number,"fatG":number,"fiberG":number}
Rules: Calculate for EXACT quantity specified, not per-100g. Use IFCT (Indian Food Composition Tables) for Indian foods, USDA for Western foods. For supplements, use manufacturer label data when known. Be accurate for both home-cooked and restaurant versions — use standard home-cooked estimates unless "restaurant" or "hotel" is specified.`;

        const result = await aiStructuredChat<{
          calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number;
        }>(
          [{ role: 'user', content: aiPrompt }],
          'You are an expert nutrition database specializing in Indian cuisine, Western cuisine, AND dietary supplements (whey protein, creatine, BCAA, pre-workout, mass gainer, protein bars, vitamins, minerals, fat burners, ayurvedic supplements, etc.). You have deep knowledge of IFCT, USDA, and supplement manufacturer label data. You understand regional Indian cooking variations, supplement serving sizes (scoops, capsules, tablets, bars), and can accurately estimate macros for homemade vs restaurant preparations as well as brand-specific supplement products. Return only valid JSON with macro estimates for the exact food quantity specified. Never return per-100g values unless user asked for 100g.',
          150
        );
        return result;
      })(),
    ]);

    const foodMacros = dbResult.status === 'fulfilled' ? dbResult.value : null;
    const supplementMacros = supplementResult.status === 'fulfilled' ? supplementResult.value : null;
    const aiMacros = aiResult.status === 'fulfilled' ? aiResult.value : null;

    // ── Step 3: Select best DB result (prefer supplement DB for supplement queries, food DB for food) ──
    let dbMacros: { calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; _matchName?: string; _brand?: string; _source?: string } | null = null;
    let dbSource = 'database';

    if (supplementMacros && foodMacros) {
      // Both matched — use the one with higher specificity (supplement DB takes priority for brand-specific items)
      dbMacros = supplementMacros;
      dbSource = supplementMacros._brand ? 'supplement+brand' : 'supplement';
    } else if (supplementMacros) {
      dbMacros = supplementMacros;
      dbSource = supplementMacros._brand ? 'supplement+brand' : 'supplement';
    } else if (foodMacros) {
      dbMacros = foodMacros;
      dbSource = 'food_database';
    }

    // ── Step 4: Compare DB and AI results ──
    if (dbMacros && aiMacros && aiMacros.calories >= 0) {
      const calDiff = Math.abs(dbMacros.calories - aiMacros.calories);
      const avgCal = (dbMacros.calories + aiMacros.calories) / 2;
      const percentDiff = avgCal > 0 ? (calDiff / avgCal) * 100 : (calDiff > 0 ? 100 : 0);

      if (percentDiff <= 25) {
        return NextResponse.json({
          calories: dbMacros.calories,
          proteinG: dbMacros.proteinG,
          carbsG: dbMacros.carbsG,
          fatG: dbMacros.fatG,
          fiberG: dbMacros.fiberG,
          source: dbSource === 'supplement+brand' ? 'brand_db+ai' : dbSource === 'supplement' ? 'supplement_db+ai' : 'database+ai',
          confidence: 0.95,
          calculatedGrams: Math.round(grams),
        });
      } else {
        return NextResponse.json({
          calories: Math.round(aiMacros.calories),
          proteinG: Math.round((aiMacros.proteinG || 0) * 10) / 10,
          carbsG: Math.round((aiMacros.carbsG || 0) * 10) / 10,
          fatG: Math.round((aiMacros.fatG || 0) * 10) / 10,
          fiberG: Math.round((aiMacros.fiberG || 0) * 10) / 10,
          source: 'ai',
          confidence: 0.7,
          calculatedGrams: Math.round(grams),
        });
      }
    }

    if (dbMacros) {
      return NextResponse.json({
        calories: dbMacros.calories,
        proteinG: dbMacros.proteinG,
        carbsG: dbMacros.carbsG,
        fatG: dbMacros.fatG,
        fiberG: dbMacros.fiberG,
        source: dbSource === 'supplement+brand' ? 'brand_database' : dbSource === 'supplement' ? 'supplement_database' : 'database',
        confidence: 0.9,
        calculatedGrams: Math.round(grams),
      });
    }

    if (aiMacros && aiMacros.calories >= 0) {
      return NextResponse.json({
        calories: Math.round(aiMacros.calories),
        proteinG: Math.round((aiMacros.proteinG || 0) * 10) / 10,
        carbsG: Math.round((aiMacros.carbsG || 0) * 10) / 10,
        fatG: Math.round((aiMacros.fatG || 0) * 10) / 10,
        fiberG: Math.round((aiMacros.fiberG || 0) * 10) / 10,
        source: 'ai',
        confidence: 0.6,
        calculatedGrams: Math.round(grams),
      });
    }

    // ── Step 5: Local fallback (all sources failed) ──
    const fallbackMultiplier = Math.max(0.01, grams / 100);
    return NextResponse.json({
      calories: Math.round(200 * fallbackMultiplier),
      proteinG: Math.round(10 * fallbackMultiplier * 10) / 10,
      carbsG: Math.round(25 * fallbackMultiplier * 10) / 10,
      fatG: Math.round(8 * fallbackMultiplier * 10) / 10,
      fiberG: Math.round(2 * fallbackMultiplier * 10) / 10,
      source: 'local',
      confidence: 0.3,
      calculatedGrams: Math.round(grams),
    });
  } catch (error) {
    console.error('Estimate macros error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
