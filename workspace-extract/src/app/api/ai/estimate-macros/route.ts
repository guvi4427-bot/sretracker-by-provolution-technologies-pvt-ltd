import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FOOD_DATABASE, UNIT_TO_GRAMS } from '@/lib/constants';
import { aiStructuredChat } from '@/lib/ai-provider';
import { db } from '@/lib/db';

// ── Unit Conversion Engine ──
// Converts any user input (quantity + unit) into grams for macro calculation.
// All FOOD_DATABASE entries are per 100g, so: multiplier = grams / 100

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

function convertToGrams(mealName: string, quantity: number, unit: string): number {
  const u = IMPERIAL_ALIASES[unit.toLowerCase().trim()] || unit.toLowerCase().trim();
  const foodKey = mealName.toLowerCase().trim();

  // Direct weight/volume units → already in grams/ml
  if (u === 'g') return quantity;
  if (u === 'ml') return quantity; // 1ml ≈ 1g for water-based foods

  // Volumetric/count units → look up food-specific conversion, then fallback to default
  const lookupKeys = [
    `${foodKey}:${u}`,
    `${foodKey.split(' ')[0]}:${u}`,
  ];

  for (const key of lookupKeys) {
    if (UNIT_TO_GRAMS[key]) {
      return quantity * UNIT_TO_GRAMS[key];
    }
  }

  // Fallback to default conversion for the unit
  const defaultKey = `default:${u}`;
  if (UNIT_TO_GRAMS[defaultKey]) {
    return quantity * UNIT_TO_GRAMS[defaultKey];
  }

  // Common units not in UNIT_TO_GRAMS defaults (includes Indian-specific)
  const EXTRA_UNIT_GRAMS: Record<string, number> = {
    'piece': 120, 'pc': 120, 'slice': 30, 'bowl': 250, 'plate': 300,
    'glass': 240, 'can': 330, 'bottle': 500, 'packet': 50, 'bar': 60,
    'scoop': 30, 'medium': 150, 'large': 250, 'small': 80, 'whole': 200,
    'half': 100, 'handful': 30, 'piece(s)': 120, 'pcs': 120, 'katori': 150,
    // Imperial
    'oz': 28.35, 'fl oz': 30, 'lb': 453.6, 'lbs': 453.6,
  };

  if (EXTRA_UNIT_GRAMS[u]) {
    return quantity * EXTRA_UNIT_GRAMS[u];
  }

  // Ultimate fallback: treat quantity as grams
  return quantity;
}

// ── Database Search (scoring-based matching) ──
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

// ── Compute DB macros for a given gram weight ──
function computeDbMacros(match: typeof FOOD_DATABASE[number], grams: number) {
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

    // ── Step 2: Run DB lookup AND AI estimation IN PARALLEL ──
    const [dbResult, aiResult] = await Promise.allSettled([
      // DB lookup (synchronous, wrapped in promise for parallel execution)
      Promise.resolve().then(() => {
        const match = findInDatabase(searchKey);
        if (!match) return null;
        return { ...computeDbMacros(match, grams), _matchName: match.name };
      }),
      // AI estimation (async, 2-5 seconds)
      (async () => {
        const unitContext = userUnitSystem === 'imperial'
          ? 'The user uses the imperial system (oz, lbs, inches). Convert internally to metric for calculations.'
          : '';

        const dietContext = userDietType
          ? `The user follows a ${userDietType} diet.`
          : '';

        const aiPrompt = `Estimate nutritional macros for: "${mealName}", quantity: ${quantityNum} ${userUnit} (~${Math.round(grams)}g).

${dietContext} ${unitContext}

This could be an Indian dish (e.g., dal, biryani, paneer butter masala, chole, samosa, dosa, idli, chapati, rajma, sambhar, poha, upma, kadhi, thali, gulab jamun, lassi, etc.) or a Western dish (e.g., pizza, burger, pasta, steak, salad, sandwich, smoothie bowl, etc.) or any world cuisine.

Consider common preparation methods:
- Indian curries: typically cooked with oil/ghee, onions, tomatoes, and spices
- Indian breads: chapati/roti are whole wheat, paratha has more fat, naan uses refined flour
- Dal/lentils: cooked with water, tempered with oil/ghee and spices (tadka)
- Western grilled items: minimal added fat
- Fried items: significantly higher fat content
- Restaurant/hotel preparations: typically 30-50% more oil than home-cooked

Return ONLY JSON: {"calories":number,"proteinG":number,"carbsG":number,"fatG":number,"fiberG":number}
Rules: Calculate for EXACT quantity specified, not per-100g. Use IFCT (Indian Food Composition Tables) for Indian foods, USDA for Western foods. Be accurate for both home-cooked and restaurant versions — use standard home-cooked estimates unless "restaurant" or "hotel" is specified.`;

        const result = await aiStructuredChat<{
          calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number;
        }>(
          [{ role: 'user', content: aiPrompt }],
          'You are an expert nutrition database specializing in both Indian and Western cuisines. You have deep knowledge of IFCT (Indian Food Composition Tables) and USDA food data. You understand regional Indian cooking variations (North Indian, South Indian, Gujarati, Bengali, Punjabi, etc.) and can accurately estimate macros for homemade vs restaurant preparations. Return only valid JSON with macro estimates for the exact food quantity specified. Never return per-100g values unless user asked for 100g.',
          150
        );
        return result;
      })(),
    ]);

    const dbMacros = dbResult.status === 'fulfilled' ? dbResult.value : null;
    const aiMacros = aiResult.status === 'fulfilled' ? aiResult.value : null;

    // ── Step 3: Compare DB and AI results ──
    if (dbMacros && aiMacros && aiMacros.calories > 0) {
      const calDiff = Math.abs(dbMacros.calories - aiMacros.calories);
      const avgCal = (dbMacros.calories + aiMacros.calories) / 2;
      const percentDiff = avgCal > 0 ? (calDiff / avgCal) * 100 : 100;

      if (percentDiff <= 25) {
        return NextResponse.json({
          calories: dbMacros.calories,
          proteinG: dbMacros.proteinG,
          carbsG: dbMacros.carbsG,
          fatG: dbMacros.fatG,
          fiberG: dbMacros.fiberG,
          source: 'database+ai',
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
        source: 'database',
        confidence: 0.9,
        calculatedGrams: Math.round(grams),
      });
    }

    if (aiMacros && aiMacros.calories > 0) {
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

    // ── Step 4: Local fallback (both sources failed) ──
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
