// ── Supplement Database (all values per 100g / per 100ml unless noted) ──
// Comprehensive Indian and International brand supplement macros.
// multiplier = userGrams / 100 (same as FOOD_DATABASE)
// For per-serving items (bars, RTD), the macros are normalized to per-100g for consistency.
// Brand-specific entries include the brand name for search matching.

export interface SupplementEntry {
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize?: number; // grams per serving (for unit conversion)
  servingUnit?: string; // default unit for this supplement
}

export const SUPPLEMENT_DATABASE: SupplementEntry[] = [
  // ═══════════════════════════════════════════════════════
  // ─── WHEY PROTEIN (Indian Brands) ───
  // ═══════════════════════════════════════════════════════
  { name: "MuscleBlaze Whey Protein", brand: "MuscleBlaze", calories: 395, protein: 78, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "MuscleBlaze Whey Gold", brand: "MuscleBlaze", calories: 380, protein: 82, carbs: 5, fat: 4.5, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "MuscleBlaze Whey Isolate", brand: "MuscleBlaze", calories: 370, protein: 86, carbs: 3, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "MuscleBlaze Biozyme Whey", brand: "MuscleBlaze", calories: 375, protein: 83, carbs: 4.5, fat: 3, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "MuscleBlaze Biozyme Isolate", brand: "MuscleBlaze", calories: 365, protein: 87, carbs: 2.5, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "MuscleBlaze Beginner Whey", brand: "MuscleBlaze", calories: 400, protein: 72, carbs: 12, fat: 7, fiber: 0, servingSize: 36, servingUnit: "scoop" },
  { name: "MuscleBlaze 100% Whey", brand: "MuscleBlaze", calories: 390, protein: 80, carbs: 6, fat: 5.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "NakPro Whey Protein", brand: "NakPro", calories: 395, protein: 77, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "NakPro Whey Isolate", brand: "NakPro", calories: 370, protein: 85, carbs: 3.5, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "NakPro Gold Whey Isolate", brand: "NakPro", calories: 368, protein: 87, carbs: 2, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "AS-IT-IS Whey Protein", brand: "AS-IT-IS", calories: 395, protein: 78, carbs: 7, fat: 6, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "AS-IT-IS Whey Isolate", brand: "AS-IT-IS", calories: 372, protein: 86, carbs: 3, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "AS-IT-IS Native Whey", brand: "AS-IT-IS", calories: 385, protein: 80, carbs: 6, fat: 4, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "XLR8 Whey Protein", brand: "XLR8", calories: 392, protein: 76, carbs: 9, fat: 6.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "XLR8 Isolate", brand: "XLR8", calories: 372, protein: 85, carbs: 3.5, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Big Muscles Whey Protein", brand: "Big Muscles", calories: 398, protein: 75, carbs: 10, fat: 7, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Big Muscles Gold Whey", brand: "Big Muscles", calories: 385, protein: 80, carbs: 6, fat: 5, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Six Pack Nutrition Whey", brand: "Six Pack Nutrition", calories: 395, protein: 76, carbs: 9, fat: 6.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "British Nutritions Whey", brand: "British Nutritions", calories: 398, protein: 75, carbs: 10, fat: 7, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "GNC Whey Protein", brand: "GNC", calories: 388, protein: 79, carbs: 7, fat: 5, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "GNC Amp Whey Isolate", brand: "GNC", calories: 370, protein: 86, carbs: 3, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Optimum Nutrition Gold Standard India", brand: "Optimum Nutrition", calories: 376, protein: 81, carbs: 5.5, fat: 3.5, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "MyProtein Impact Whey India", brand: "MyProtein", calories: 400, protein: 79, carbs: 8, fat: 5.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "MyProtein Impact Whey Isolate India", brand: "MyProtein", calories: 373, protein: 86, carbs: 3, fat: 1.5, fiber: 0, servingSize: 25, servingUnit: "scoop" },
  { name: "HealthKart Whey Protein", brand: "HealthKart", calories: 395, protein: 76, carbs: 9, fat: 6.5, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "HealthKart Isolate", brand: "HealthKart", calories: 372, protein: 85, carbs: 3.5, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Nutrabay Whey Protein", brand: "Nutrabay", calories: 390, protein: 78, carbs: 7, fat: 6, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Nutrabay Isolate", brand: "Nutrabay", calories: 370, protein: 86, carbs: 3, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Labrada Whey Protein", brand: "Labrada", calories: 385, protein: 80, carbs: 6, fat: 4.5, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Neulife Whey Protein", brand: "Neulife", calories: 395, protein: 76, carbs: 9, fat: 7, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "G Sport Whey Protein", brand: "G Sport", calories: 398, protein: 74, carbs: 10, fat: 7.5, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Node Whey Protein", brand: "Node", calories: 392, protein: 77, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Cureveda Whey", brand: "Cureveda", calories: 388, protein: 78, carbs: 7.5, fat: 5.5, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Muscletech Nitrotech India", brand: "MuscleTech", calories: 385, protein: 80, carbs: 5, fat: 5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Dymatize ISO100 India", brand: "Dymatize", calories: 368, protein: 87, carbs: 2, fat: 1.5, fiber: 0, servingSize: 28, servingUnit: "scoop" },
  { name: "BSN Syntha-6 India", brand: "BSN", calories: 415, protein: 66, carbs: 17, fat: 9, fiber: 1, servingSize: 47, servingUnit: "scoop" },
  { name: "Universal Whey India", brand: "Universal", calories: 395, protein: 77, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Atp Whey Protein", brand: "ATP", calories: 390, protein: 78, carbs: 7, fat: 6, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Fast&Up Whey Protein", brand: "Fast&Up", calories: 388, protein: 79, carbs: 6.5, fat: 5.5, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Fast&Up Isolate", brand: "Fast&Up", calories: 370, protein: 86, carbs: 3, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Muscle Nation Whey", brand: "Muscle Nation", calories: 392, protein: 77, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },

  // ═══════════════════════════════════════════════════════
  // ─── WHEY PROTEIN (International Brands) ───
  // ═══════════════════════════════════════════════════════
  { name: "Optimum Nutrition Gold Standard 100% Whey", brand: "Optimum Nutrition", calories: 376, protein: 81, carbs: 5.5, fat: 3.5, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "Optimum Nutrition Gold Standard Isolate", brand: "Optimum Nutrition", calories: 365, protein: 87, carbs: 2, fat: 1, fiber: 0, servingSize: 29, servingUnit: "scoop" },
  { name: "Dymatize ISO 100 Hydrolyzed", brand: "Dymatize", calories: 368, protein: 87, carbs: 2, fat: 1.5, fiber: 0, servingSize: 28, servingUnit: "scoop" },
  { name: "Dymatize Elite Whey", brand: "Dymatize", calories: 390, protein: 78, carbs: 7, fat: 5.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "BSN Syntha-6", brand: "BSN", calories: 415, protein: 66, carbs: 17, fat: 9, fiber: 1, servingSize: 47, servingUnit: "scoop" },
  { name: "BSN Isoburn", brand: "BSN", calories: 378, protein: 73, carbs: 8, fat: 4.5, fiber: 2, servingSize: 32, servingUnit: "scoop" },
  { name: "MuscleTech Nitro-Tech", brand: "MuscleTech", calories: 385, protein: 80, carbs: 5, fat: 5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "MuscleTech Nitro-Tech Isolate", brand: "MuscleTech", calories: 370, protein: 86, carbs: 2, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "MuscleTech Phase8", brand: "MuscleTech", calories: 400, protein: 70, carbs: 13, fat: 8, fiber: 2, servingSize: 42, servingUnit: "scoop" },
  { name: "Cellucor Whey Sport", brand: "Cellucor", calories: 395, protein: 76, carbs: 8, fat: 6, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Cellucor COR-Performance Whey", brand: "Cellucor", calories: 390, protein: 77, carbs: 8, fat: 5.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "MyProtein Impact Whey", brand: "MyProtein", calories: 400, protein: 79, carbs: 8, fat: 5.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "MyProtein Impact Whey Isolate", brand: "MyProtein", calories: 373, protein: 86, carbs: 3, fat: 1.5, fiber: 0, servingSize: 25, servingUnit: "scoop" },
  { name: "MyProtein Whey Protein Smooth", brand: "MyProtein", calories: 398, protein: 78, carbs: 9, fat: 5.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Naked Nutrition Naked Whey", brand: "Naked Nutrition", calories: 382, protein: 83, carbs: 5, fat: 4, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Ghost Whey Protein", brand: "Ghost", calories: 390, protein: 76, carbs: 8, fat: 6, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Ghost Isolate", brand: "Ghost", calories: 370, protein: 86, carbs: 2, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "IsoPure Zero Carb Whey Isolate", brand: "IsoPure", calories: 368, protein: 88, carbs: 0, fat: 1.5, fiber: 0, servingSize: 29, servingUnit: "scoop" },
  { name: "IsoPure Low Carb Whey", brand: "IsoPure", calories: 375, protein: 84, carbs: 3, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Rule One Proteins R1 Whey", brand: "Rule One", calories: 380, protein: 81, carbs: 5, fat: 4, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "Legion Whey+", brand: "Legion", calories: 385, protein: 80, carbs: 5, fat: 4.5, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "JYM Protein", brand: "JYM", calories: 395, protein: 76, carbs: 8, fat: 6, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Animal Whey", brand: "Universal", calories: 395, protein: 77, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Promix Whey Isolate", brand: "Promix", calories: 370, protein: 86, carbs: 2, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Levels Whey Protein", brand: "Levels", calories: 385, protein: 80, carbs: 5, fat: 4.5, fiber: 0, servingSize: 31, servingUnit: "scoop" },
  { name: "Nutricost Whey Isolate", brand: "Nutricost", calories: 372, protein: 85, carbs: 3, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "BulkSupplements Whey Isolate", brand: "BulkSupplements", calories: 375, protein: 84, carbs: 3, fat: 2.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Now Sports Whey Isolate", brand: "Now Sports", calories: 372, protein: 85, carbs: 3, fat: 2, fiber: 0, servingSize: 30, servingUnit: "scoop" },

  // ═══════════════════════════════════════════════════════
  // ─── PLANT-BASED / VEGAN PROTEIN ───
  // ═══════════════════════════════════════════════════════
  { name: "Vega Protein Smoothie", brand: "Vega", calories: 375, protein: 67, carbs: 14, fat: 7, fiber: 5, servingSize: 30, servingUnit: "scoop" },
  { name: "Vega One All-in-One", brand: "Vega", calories: 380, protein: 60, carbs: 17, fat: 8, fiber: 7, servingSize: 40, servingUnit: "scoop" },
  { name: "Garden of Life Raw Organic Protein", brand: "Garden of Life", calories: 360, protein: 72, carbs: 10, fat: 6, fiber: 4, servingSize: 33, servingUnit: "scoop" },
  { name: "Garden of Life Sport Organic Plant", brand: "Garden of Life", calories: 370, protein: 70, carbs: 11, fat: 7, fiber: 3, servingSize: 34, servingUnit: "scoop" },
  { name: "Orgain Organic Protein", brand: "Orgain", calories: 370, protein: 68, carbs: 13, fat: 7, fiber: 5, servingSize: 34, servingUnit: "scoop" },
  { name: "Orgain Protein Powder", brand: "Orgain", calories: 368, protein: 70, carbs: 12, fat: 6, fiber: 4, servingSize: 33, servingUnit: "scoop" },
  { name: "Naked Nutrition Naked Pea", brand: "Naked Nutrition", calories: 380, protein: 80, carbs: 6, fat: 4, fiber: 2, servingSize: 30, servingUnit: "scoop" },
  { name: "Naked Nutrition Naked Rice", brand: "Naked Nutrition", calories: 370, protein: 78, carbs: 7, fat: 3, fiber: 1, servingSize: 30, servingUnit: "scoop" },
  { name: "MyProtein Vegan Protein Blend", brand: "MyProtein", calories: 385, protein: 70, carbs: 12, fat: 7, fiber: 4, servingSize: 33, servingUnit: "scoop" },
  { name: "MuscleBlaze Plant Protein", brand: "MuscleBlaze", calories: 378, protein: 68, carbs: 14, fat: 8, fiber: 5, servingSize: 35, servingUnit: "scoop" },
  { name: "HealthKart Plant Protein", brand: "HealthKart", calories: 380, protein: 66, carbs: 15, fat: 8, fiber: 5, servingSize: 36, servingUnit: "scoop" },
  { name: "AS-IT-IS Pea Protein", brand: "AS-IT-IS", calories: 375, protein: 75, carbs: 8, fat: 5, fiber: 3, servingSize: 30, servingUnit: "scoop" },
  { name: "Oziva Plant Protein", brand: "Oziva", calories: 385, protein: 65, carbs: 16, fat: 8, fiber: 5, servingSize: 36, servingUnit: "scoop" },
  { name: "Huel Protein", brand: "Huel", calories: 390, protein: 62, carbs: 20, fat: 9, fiber: 6, servingSize: 38, servingUnit: "scoop" },
  { name: "Sprout Living Epic Protein", brand: "Sprout Living", calories: 365, protein: 72, carbs: 10, fat: 7, fiber: 4, servingSize: 32, servingUnit: "scoop" },
  { name: "NorCal Organic Pea Protein", brand: "NorCal", calories: 380, protein: 80, carbs: 5, fat: 3.5, fiber: 2, servingSize: 30, servingUnit: "scoop" },

  // ═══════════════════════════════════════════════════════
  // ─── CASEIN PROTEIN ───
  // ═══════════════════════════════════════════════════════
  { name: "Optimum Nutrition Gold Standard Casein", brand: "Optimum Nutrition", calories: 380, protein: 78, carbs: 8, fat: 5, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Dymatize Elite Casein", brand: "Dymatize", calories: 385, protein: 76, carbs: 9, fat: 5.5, fiber: 0, servingSize: 35, servingUnit: "scoop" },
  { name: "MuscleBlaze Casein", brand: "MuscleBlaze", calories: 388, protein: 75, carbs: 10, fat: 6, fiber: 0, servingSize: 35, servingUnit: "scoop" },
  { name: "BSN Casein", brand: "BSN", calories: 395, protein: 73, carbs: 11, fat: 7, fiber: 1, servingSize: 36, servingUnit: "scoop" },
  { name: "MyProtein Casein", brand: "MyProtein", calories: 383, protein: 77, carbs: 8, fat: 5, fiber: 0, servingSize: 34, servingUnit: "scoop" },
  { name: "Asitis Micellar Casein", brand: "AS-IT-IS", calories: 386, protein: 76, carbs: 9, fat: 5.5, fiber: 0, servingSize: 35, servingUnit: "scoop" },
  { name: "Naked Nutrition Naked Casein", brand: "Naked Nutrition", calories: 378, protein: 80, carbs: 6, fat: 4, fiber: 0, servingSize: 32, servingUnit: "scoop" },

  // ═══════════════════════════════════════════════════════
  // ─── MASS GAINER ───
  // ═══════════════════════════════════════════════════════
  { name: "MuscleBlaze Mass Gainer", brand: "MuscleBlaze", calories: 380, protein: 22, carbs: 68, fat: 4, fiber: 1, servingSize: 75, servingUnit: "scoop" },
  { name: "MuscleBlaze Super Gainer", brand: "MuscleBlaze", calories: 383, protein: 20, carbs: 70, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "MuscleBlaze Mass Gainer XXL", brand: "MuscleBlaze", calories: 378, protein: 18, carbs: 72, fat: 3.5, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "Optimum Nutrition Serious Mass", brand: "Optimum Nutrition", calories: 378, protein: 15, carbs: 75, fat: 2, fiber: 1, servingSize: 128, servingUnit: "scoop" },
  { name: "Optimum Nutrition Gold Mass Gainer", brand: "Optimum Nutrition", calories: 380, protein: 20, carbs: 70, fat: 4, fiber: 1, servingSize: 100, servingUnit: "scoop" },
  { name: "BSN True Mass", brand: "BSN", calories: 388, protein: 20, carbs: 68, fat: 6, fiber: 1, servingSize: 96, servingUnit: "scoop" },
  { name: "Dymatize Super Mass Gainer", brand: "Dymatize", calories: 383, protein: 17, carbs: 74, fat: 3, fiber: 0.5, servingSize: 148, servingUnit: "scoop" },
  { name: "MuscleTech Mass Tech", brand: "MuscleTech", calories: 380, protein: 19, carbs: 72, fat: 3.5, fiber: 1, servingSize: 115, servingUnit: "scoop" },
  { name: "MyProtein Weight Gainer Blend", brand: "MyProtein", calories: 385, protein: 18, carbs: 72, fat: 4, fiber: 1, servingSize: 100, servingUnit: "scoop" },
  { name: "HealthKart Mass Gainer", brand: "HealthKart", calories: 382, protein: 20, carbs: 70, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "NakPro Mass Gainer", brand: "NakPro", calories: 380, protein: 20, carbs: 70, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "Big Muscles Mass Gainer", brand: "Big Muscles", calories: 385, protein: 18, carbs: 72, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "Six Pack Nutrition Mass Gainer", brand: "Six Pack Nutrition", calories: 383, protein: 19, carbs: 71, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "GNC Pro Performance Mass Gainer", brand: "GNC", calories: 385, protein: 18, carbs: 72, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "Cellucor Cor-Performance Gainer", brand: "Cellucor", calories: 382, protein: 20, carbs: 69, fat: 4.5, fiber: 1, servingSize: 95, servingUnit: "scoop" },

  // ═══════════════════════════════════════════════════════
  // ─── CREATINE ───
  // ═══════════════════════════════════════════════════════
  { name: "Creatine Monohydrate", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MuscleBlaze Creatine", brand: "MuscleBlaze", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Optimum Nutrition Micronized Creatine", brand: "Optimum Nutrition", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MuscleTech Creatine", brand: "MuscleTech", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MyProtein Creatine Monohydrate", brand: "MyProtein", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "AS-IT-IS Creatine", brand: "AS-IT-IS", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "NakPro Creatine", brand: "NakPro", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "GNC Creatine", brand: "GNC", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Nutrabay Creatine", brand: "Nutrabay", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Cellucor Creatine", brand: "Cellucor", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "BSN Creatine", brand: "BSN", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Dymatize Creatine", brand: "Dymatize", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Creatine HCL", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 1, servingUnit: "g" },
  { name: "Creatine Ethyl Ester", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },
  { name: "Buffered Creatine Kre-Alkalyn", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── BCAA / EAA ───
  // ═══════════════════════════════════════════════════════
  { name: "BCAA Powder", calories: 10, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "EAA Powder", calories: 15, protein: 55, carbs: 0, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "MuscleBlaze BCAA", brand: "MuscleBlaze", calories: 8, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "Optimum Nutrition BCAA", brand: "Optimum Nutrition", calories: 5, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MyProtein BCAA", brand: "MyProtein", calories: 10, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 6, servingUnit: "g" },
  { name: "Scivation Xtend BCAA", brand: "Scivation", calories: 0, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "Cellucor Alpha Amino BCAA", brand: "Cellucor", calories: 5, protein: 42, carbs: 2, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "BSN Amino X", brand: "BSN", calories: 10, protein: 40, carbs: 2, fat: 0, fiber: 0, servingSize: 14, servingUnit: "g" },
  { name: "Ghost BCAA", brand: "Ghost", calories: 5, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "MuscleTech Amino Build", brand: "MuscleTech", calories: 8, protein: 45, carbs: 1, fat: 0, fiber: 0, servingSize: 9, servingUnit: "g" },
  { name: "Fast&Up BCAA", brand: "Fast&Up", calories: 5, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "Big Muscles BCAA", brand: "Big Muscles", calories: 8, protein: 48, carbs: 0, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "GNC BCAA", brand: "GNC", calories: 5, protein: 50, carbs: 0, fat: 0, fiber: 0, servingSize: 6, servingUnit: "g" },
  { name: "NakPro EAA", brand: "NakPro", calories: 10, protein: 55, carbs: 0, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "Corebolics EAA", brand: "Corebolics", calories: 8, protein: 53, carbs: 0, fat: 0, fiber: 0, servingSize: 9, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── PRE-WORKOUT ───
  // ═══════════════════════════════════════════════════════
  { name: "MuscleBlaze Pre-Workout", brand: "MuscleBlaze", calories: 18, protein: 0, carbs: 3.5, fat: 0, fiber: 0, servingSize: 12, servingUnit: "g" },
  { name: "Optimum Nutrition Gold Standard Pre-Workout", brand: "Optimum Nutrition", calories: 15, protein: 0, carbs: 3, fat: 0, fiber: 0, servingSize: 9, servingUnit: "g" },
  { name: "Cellucor C4 Pre-Workout", brand: "Cellucor", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 6, servingUnit: "g" },
  { name: "Cellucor C4 Sport", brand: "Cellucor", calories: 15, protein: 0, carbs: 3, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },
  { name: "Cellucor C4 Ultimate", brand: "Cellucor", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 14, servingUnit: "g" },
  { name: "BSN N.O.-Xplode", brand: "BSN", calories: 15, protein: 0, carbs: 3, fat: 0, fiber: 0, servingSize: 13, servingUnit: "g" },
  { name: "MuscleTech Vapor X5", brand: "MuscleTech", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 7, servingUnit: "g" },
  { name: "Ghost Pre-Workout", brand: "Ghost", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },
  { name: "MyProtein Pre-Workout", brand: "MyProtein", calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "Nutrabay Pre-Workout", brand: "Nutrabay", calories: 12, protein: 0, carbs: 2.5, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "Fast&Up Pre-Workout", brand: "Fast&Up", calories: 15, protein: 0, carbs: 3, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "GNC Pre-Workout", brand: "GNC", calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0, servingSize: 9, servingUnit: "g" },
  { name: "C4 Original Pre-Workout", brand: "Cellucor", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 6, servingUnit: "g" },
  { name: "Ryse Pre-Workout", brand: "Ryse", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },
  { name: "Alani Nu Pre-Workout", brand: "Alani Nu", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 6, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── PROTEIN BARS ───
  // ═══════════════════════════════════════════════════════
  { name: "Quest Protein Bar", brand: "Quest", calories: 350, protein: 46, carbs: 37, fat: 8, fiber: 14, servingSize: 60, servingUnit: "bar" },
  { name: "Quest Bar", brand: "Quest", calories: 350, protein: 46, carbs: 37, fat: 8, fiber: 14, servingSize: 60, servingUnit: "bar" },
  { name: "Optimum Nutrition Protein Bar", brand: "Optimum Nutrition", calories: 340, protein: 38, carbs: 38, fat: 10, fiber: 8, servingSize: 60, servingUnit: "bar" },
  { name: "MuscleBlaze Protein Bar", brand: "MuscleBlaze", calories: 335, protein: 40, carbs: 36, fat: 9, fiber: 6, servingSize: 60, servingUnit: "bar" },
  { name: "MuscleBlaze Energy Bar", brand: "MuscleBlaze", calories: 345, protein: 30, carbs: 42, fat: 10, fiber: 4, servingSize: 60, servingUnit: "bar" },
  { name: "MyProtein Protein Bar", brand: "MyProtein", calories: 340, protein: 38, carbs: 38, fat: 10, fiber: 8, servingSize: 60, servingUnit: "bar" },
  { name: "BSN Protein Crisp Bar", brand: "BSN", calories: 350, protein: 38, carbs: 36, fat: 11, fiber: 5, servingSize: 56, servingUnit: "bar" },
  { name: "GNC Protein Bar", brand: "GNC", calories: 340, protein: 38, carbs: 37, fat: 10, fiber: 7, servingSize: 60, servingUnit: "bar" },
  { name: "Clif Bar", brand: "Clif", calories: 367, protein: 17, carbs: 58, fat: 7, fiber: 4, servingSize: 68, servingUnit: "bar" },
  { name: "Kind Protein Bar", brand: "Kind", calories: 365, protein: 25, carbs: 38, fat: 14, fiber: 5, servingSize: 50, servingUnit: "bar" },
  { name: "RXBAR", brand: "RXBAR", calories: 360, protein: 30, carbs: 37, fat: 12, fiber: 5, servingSize: 52, servingUnit: "bar" },
  { name: "ThinkThin Protein Bar", brand: "ThinkThin", calories: 330, protein: 40, carbs: 33, fat: 8, fiber: 3, servingSize: 60, servingUnit: "bar" },
  { name: "Pure Protein Bar", brand: "Pure Protein", calories: 335, protein: 42, carbs: 35, fat: 8, fiber: 3, servingSize: 58, servingUnit: "bar" },
  { name: "One Bar", brand: "One", calories: 340, protein: 38, carbs: 37, fat: 9, fiber: 7, servingSize: 60, servingUnit: "bar" },
  { name: "Lenny & Larry's Protein Bar", brand: "Lenny & Larry's", calories: 360, protein: 25, carbs: 48, fat: 11, fiber: 5, servingSize: 56, servingUnit: "bar" },
  { name: "HealthKart Protein Bar", brand: "HealthKart", calories: 340, protein: 38, carbs: 36, fat: 10, fiber: 6, servingSize: 60, servingUnit: "bar" },
  { name: "Yoga Bar Protein Bar", brand: "Yoga Bar", calories: 350, protein: 30, carbs: 40, fat: 12, fiber: 5, servingSize: 60, servingUnit: "bar" },
  { name: "Rite Bite Protein Bar", brand: "Rite Bite", calories: 340, protein: 30, carbs: 42, fat: 10, fiber: 3, servingSize: 50, servingUnit: "bar" },
  { name: "Nature Valley Protein Bar", brand: "Nature Valley", calories: 365, protein: 19, carbs: 53, fat: 9, fiber: 3, servingSize: 42, servingUnit: "bar" },
  { name: "Detour Protein Bar", brand: "Detour", calories: 340, protein: 38, carbs: 35, fat: 10, fiber: 5, servingSize: 62, servingUnit: "bar" },
  { name: "Grenade Protein Bar", brand: "Grenade", calories: 340, protein: 37, carbs: 36, fat: 10, fiber: 7, servingSize: 60, servingUnit: "bar" },
  { name: "No Cow Protein Bar", brand: "No Cow", calories: 335, protein: 36, carbs: 38, fat: 7, fiber: 9, servingSize: 45, servingUnit: "bar" },

  // ═══════════════════════════════════════════════════════
  // ─── MULTIVITAMINS & MINERALS ───
  // ═══════════════════════════════════════════════════════
  { name: "Multivitamin Tablet", calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Multivitamin Capsule", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "MuscleBlaze Multivitamin", brand: "MuscleBlaze", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Optimum Nutrition Opti-Men", brand: "Optimum Nutrition", calories: 5, protein: 0, carbs: 0.8, fat: 0, fiber: 0, servingSize: 3, servingUnit: "tablet" },
  { name: "Optimum Nutrition Opti-Women", brand: "Optimum Nutrition", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },
  { name: "GNC Mega Men", brand: "GNC", calories: 5, protein: 0, carbs: 0.8, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },
  { name: "GNC Women's One Daily", brand: "GNC", calories: 2, protein: 0, carbs: 0.4, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Centrum Multivitamin", brand: "Centrum", calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Centrum Women", brand: "Centrum", calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "MuscleTech Platinum Multivitamin", brand: "MuscleTech", calories: 3, protein: 0, carbs: 0.6, fat: 0, fiber: 0, servingSize: 3, servingUnit: "tablet" },
  { name: "MyProtein Alpha Men", brand: "MyProtein", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 2, servingUnit: "tablet" },
  { name: "HealthKart Multivitamin", brand: "HealthKart", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Nature Made Multivitamin", brand: "Nature Made", calories: 2, protein: 0, carbs: 0.4, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Rainbow Light Men's One", brand: "Rainbow Light", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Garden of Life Vitamin Code", brand: "Garden of Life", calories: 5, protein: 0, carbs: 0.8, fat: 0, fiber: 0, servingSize: 4, servingUnit: "capsule" },
  { name: "Now Foods ADAM", brand: "Now Foods", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },
  { name: "Himalaya Wellness Multivitamin", brand: "Himalaya", calories: 2, protein: 0, carbs: 0.4, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Supradyn Multivitamin", brand: "Supradyn", calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Revital H Multivitamin", brand: "Revital H", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Ensure Complete Nutrition", brand: "Ensure", calories: 430, protein: 15, carbs: 60, fat: 11, fiber: 1.5, servingSize: 230, servingUnit: "ml" },
  { name: "Boost Nutritional Drink", brand: "Boost", calories: 410, protein: 15, carbs: 58, fat: 11, fiber: 1, servingSize: 237, servingUnit: "ml" },
  { name: "Horlicks Protein Plus", brand: "Horlicks", calories: 380, protein: 24, carbs: 55, fat: 6, fiber: 2, servingSize: 30, servingUnit: "g" },
  { name: "Bournvita", brand: "Bournvita", calories: 370, protein: 12, carbs: 73, fat: 3, fiber: 0, servingSize: 20, servingUnit: "g" },
  { name: "Complan", brand: "Complan", calories: 390, protein: 16, carbs: 62, fat: 8, fiber: 1, servingSize: 33, servingUnit: "g" },
  { name: "Protinex", brand: "Protinex", calories: 370, protein: 28, carbs: 52, fat: 5, fiber: 2, servingSize: 30, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── OMEGA-3 / FISH OIL ───
  // ═══════════════════════════════════════════════════════
  { name: "Fish Oil Capsule", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Omega-3 Capsule", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "MuscleBlaze Fish Oil", brand: "MuscleBlaze", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "Optimum Nutrition Fish Oil", brand: "Optimum Nutrition", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "GNC Fish Oil", brand: "GNC", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "GNC Triple Strength Fish Oil", brand: "GNC", calories: 15, protein: 0, carbs: 0, fat: 1.5, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "HealthKart Fish Oil", brand: "HealthKart", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "Nature Made Fish Oil", brand: "Nature Made", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "Now Foods Omega-3", brand: "Now Foods", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "Carlson Fish Oil", brand: "Carlson", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "Nordic Naturals Omega-3", brand: "Nordic Naturals", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "softgel" },
  { name: "Flaxseed Oil Capsule", calories: 10, protein: 0, carbs: 0, fat: 1, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Krill Oil Capsule", calories: 8, protein: 0, carbs: 0, fat: 0.8, fiber: 0, servingSize: 1, servingUnit: "softgel" },

  // ═══════════════════════════════════════════════════════
  // ─── FAT BURNER / WEIGHT LOSS ───
  // ═══════════════════════════════════════════════════════
  { name: "MuscleBlaze Fat Burner", brand: "MuscleBlaze", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "MuscleTech Hydroxycut", brand: "MuscleTech", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },
  { name: "Cellucor SuperHD", brand: "Cellucor", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "BSN Hyper Shred", brand: "BSN", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "GNC Total Lean Burn 60", brand: "GNC", calories: 5, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 2, servingUnit: "tablet" },
  { name: "HealthKart Fat Burner", brand: "HealthKart", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Nutrabay Fat Burner", brand: "Nutrabay", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Animal Cuts", brand: "Universal", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 1, servingUnit: "packet" },
  { name: "Evlution Nutrition LeanMode", brand: "EVL", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Old School Labs Vintage Burn", brand: "Old School Labs", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },

  // ═══════════════════════════════════════════════════════
  // ─── GLUTAMINE ───
  // ═══════════════════════════════════════════════════════
  { name: "L-Glutamine Powder", calories: 0, protein: 83, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MuscleBlaze Glutamine", brand: "MuscleBlaze", calories: 0, protein: 83, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Optimum Nutrition Glutamine", brand: "Optimum Nutrition", calories: 0, protein: 83, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MyProtein Glutamine", brand: "MyProtein", calories: 0, protein: 83, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "AS-IT-IS Glutamine", brand: "AS-IT-IS", calories: 0, protein: 83, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "GNC Glutamine", brand: "GNC", calories: 0, protein: 83, carbs: 0, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── BETA-ALANINE ───
  // ═══════════════════════════════════════════════════════
  { name: "Beta-Alanine Powder", calories: 0, protein: 85, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },
  { name: "MuscleBlaze Beta-Alanine", brand: "MuscleBlaze", calories: 0, protein: 85, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },
  { name: "Optimum Nutrition Beta-Alanine", brand: "Optimum Nutrition", calories: 0, protein: 85, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },
  { name: "MyProtein Beta-Alanine", brand: "MyProtein", calories: 0, protein: 85, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── CITRULLINE / NITRIC OXIDE ───
  // ═══════════════════════════════════════════════════════
  { name: "L-Citrulline Powder", calories: 0, protein: 80, carbs: 0, fat: 0, fiber: 0, servingSize: 6, servingUnit: "g" },
  { name: "Citrulline Malate Powder", calories: 0, protein: 55, carbs: 22, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },
  { name: "MuscleBlaze Citrulline", brand: "MuscleBlaze", calories: 0, protein: 55, carbs: 22, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },
  { name: "Optimum Nutrition Citrulline", brand: "Optimum Nutrition", calories: 0, protein: 55, carbs: 22, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },
  { name: "Nutrabay Citrulline", brand: "Nutrabay", calories: 0, protein: 55, carbs: 22, fat: 0, fiber: 0, servingSize: 8, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── ZMA / SLEEP SUPPLEMENTS ───
  // ═══════════════════════════════════════════════════════
  { name: "ZMA Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Optimum Nutrition ZMA", brand: "Optimum Nutrition", calories: 5, protein: 0, carbs: 0.8, fat: 0, fiber: 0, servingSize: 3, servingUnit: "capsule" },
  { name: "MuscleBlaze ZMA", brand: "MuscleBlaze", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Melatonin Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Ashwagandha Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "MuscleBlaze Ashwagandha", brand: "MuscleBlaze", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Himalaya Ashwagandha", brand: "Himalaya", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "KSM-66 Ashwagandha", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "GNC Ashwagandha", brand: "GNC", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },

  // ═══════════════════════════════════════════════════════
  // ─── CALCIUM / VITAMIN D / BONE HEALTH ───
  // ═══════════════════════════════════════════════════════
  { name: "Calcium Tablet", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Vitamin D3 Tablet", calories: 1, protein: 0, carbs: 0.1, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Vitamin D3 Capsule", calories: 2, protein: 0, carbs: 0.1, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Calcium + Vitamin D Tablet", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "GNC Calcium Plus", brand: "GNC", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 2, servingUnit: "tablet" },
  { name: "Shelcal 500", brand: "Shelcal", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },

  // ═══════════════════════════════════════════════════════
  // ─── JOINT SUPPORT ───
  // ═══════════════════════════════════════════════════════
  { name: "Glucosamine Tablet", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Optimum Nutrition Glucosamine", brand: "Optimum Nutrition", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "MuscleBlaze Joint Support", brand: "MuscleBlaze", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "GNC Triflex", brand: "GNC", calories: 5, protein: 0, carbs: 0.8, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },
  { name: "Collagen Peptides", calories: 370, protein: 90, carbs: 0, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "Vital Proteins Collagen", brand: "Vital Proteins", calories: 370, protein: 90, carbs: 0, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "MuscleBlaze Collagen", brand: "MuscleBlaze", calories: 370, protein: 88, carbs: 1, fat: 0, fiber: 0, servingSize: 10, servingUnit: "g" },
  { name: "Wellbeing Nutrition Collagen", brand: "Wellbeing Nutrition", calories: 365, protein: 85, carbs: 2, fat: 0.5, fiber: 0, servingSize: 10, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── PROBIOTICS / DIGESTIVE ───
  // ═══════════════════════════════════════════════════════
  { name: "Probiotic Capsule", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Digestive Enzyme Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "MuscleBlaze Probiotic", brand: "MuscleBlaze", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "GNC Probiotic", brand: "GNC", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Himalaya Liv.52", brand: "Himalaya", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },

  // ═══════════════════════════════════════════════════════
  // ─── ELECTROLYTE / HYDRATION ───
  // ═══════════════════════════════════════════════════════
  { name: "Electrolyte Powder", calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Fast&Up Reload", brand: "Fast&Up", calories: 8, protein: 0, carbs: 1.5, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "MuscleBlaze Electrolyte", brand: "MuscleBlaze", calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0, servingSize: 5, servingUnit: "g" },
  { name: "Gatorade Powder", brand: "Gatorade", calories: 120, protein: 0, carbs: 30, fat: 0, fiber: 0, servingSize: 33, servingUnit: "g" },
  { name: "Oral Rehydration Salts", calories: 60, protein: 0, carbs: 15, fat: 0, fiber: 0, servingSize: 21, servingUnit: "sachet" },
  { name: "LMNT Electrolyte", brand: "LMNT", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, servingSize: 4, servingUnit: "sachet" },
  { name: "Liquid IV", brand: "Liquid IV", calories: 45, protein: 0, carbs: 11, fat: 0, fiber: 0, servingSize: 6, servingUnit: "sachet" },

  // ═══════════════════════════════════════════════════════
  // ─── TESTOSTERONE BOOSTER ───
  // ═══════════════════════════════════════════════════════
  { name: "Testosterone Booster Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "MuscleBlaze Test Pro", brand: "MuscleBlaze", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "GNC Testosterone Booster", brand: "GNC", calories: 5, protein: 0, carbs: 0.8, fat: 0, fiber: 0, servingSize: 2, servingUnit: "capsule" },
  { name: "MuscleTech Test HD", brand: "MuscleTech", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Tribulus Capsule", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "D-Aspartic Acid Powder", calories: 0, protein: 85, carbs: 0, fat: 0, fiber: 0, servingSize: 3, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── WEIGHT GAINERS / NUTRITIONAL DRINKS ───
  // ═══════════════════════════════════════════════════════
  { name: "Ensure Plus", brand: "Ensure", calories: 148, protein: 5.2, carbs: 20, fat: 4, fiber: 0.3, servingSize: 237, servingUnit: "ml" },
  { name: "Ensure High Protein", brand: "Ensure", calories: 115, protein: 9.5, carbs: 10, fat: 3, fiber: 0.3, servingSize: 237, servingUnit: "ml" },
  { name: "Boost Plus", brand: "Boost", calories: 150, protein: 5.2, carbs: 22, fat: 4, fiber: 0.3, servingSize: 237, servingUnit: "ml" },
  { name: "Boost High Protein", brand: "Boost", calories: 125, protein: 8, carbs: 13, fat: 3.5, fiber: 0.3, servingSize: 237, servingUnit: "ml" },
  { name: "Soylent Drink", brand: "Soylent", calories: 100, protein: 3.3, carbs: 12, fat: 3.5, fiber: 0.4, servingSize: 237, servingUnit: "ml" },
  { name: "Huel Ready-to-Drink", brand: "Huel", calories: 100, protein: 3.3, carbs: 10, fat: 4, fiber: 0.8, servingSize: 237, servingUnit: "ml" },
  { name: "Amway Nutrilite Protein", brand: "Amway", calories: 385, protein: 78, carbs: 7, fat: 5, fiber: 1, servingSize: 10, servingUnit: "g" },
  { name: "Amway Nutrilite All Plant Protein", brand: "Amway", calories: 380, protein: 75, carbs: 10, fat: 6, fiber: 2, servingSize: 10, servingUnit: "g" },
  { name: "Herbalife Formula 1", brand: "Herbalife", calories: 360, protein: 40, carbs: 40, fat: 5, fiber: 3, servingSize: 26, servingUnit: "g" },
  { name: "Herbalife Protein Drink Mix", brand: "Herbalife", calories: 390, protein: 65, carbs: 18, fat: 6, fiber: 2, servingSize: 23, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── RTD (Ready-to-Drink) PROTEIN SHAKES ───
  // ═══════════════════════════════════════════════════════
  { name: "MuscleBlaze RTD Protein Shake", brand: "MuscleBlaze", calories: 95, protein: 20, carbs: 5, fat: 2, fiber: 0.5, servingSize: 300, servingUnit: "ml" },
  { name: "Optimum Nutrition RTD Protein Shake", brand: "Optimum Nutrition", calories: 100, protein: 22, carbs: 5, fat: 2, fiber: 0.5, servingSize: 310, servingUnit: "ml" },
  { name: "Fairlife Protein Shake", brand: "Fairlife", calories: 120, protein: 25, carbs: 6, fat: 2.5, fiber: 0, servingSize: 340, servingUnit: "ml" },
  { name: "Core Power Protein Shake", brand: "Core Power", calories: 110, protein: 26, carbs: 5, fat: 2, fiber: 0, servingSize: 340, servingUnit: "ml" },
  { name: "Premier Protein Shake", brand: "Premier", calories: 110, protein: 25, carbs: 5, fat: 3, fiber: 0, servingSize: 325, servingUnit: "ml" },
  { name: "Orgain Protein Shake", brand: "Orgain", calories: 105, protein: 20, carbs: 7, fat: 2.5, fiber: 1, servingSize: 325, servingUnit: "ml" },
  { name: "Ensure Protein Shake", brand: "Ensure", calories: 115, protein: 9.5, carbs: 10, fat: 3, fiber: 0.3, servingSize: 237, servingUnit: "ml" },

  // ═══════════════════════════════════════════════════════
  // ─── INTRAWORKOUT / CARB POWDER ───
  // ═══════════════════════════════════════════════════════
  { name: "Carb Powder Maltodextrin", calories: 380, protein: 0, carbs: 95, fat: 0, fiber: 0, servingSize: 30, servingUnit: "g" },
  { name: "Vitargo Carb Powder", calories: 380, protein: 0, carbs: 95, fat: 0, fiber: 0, servingSize: 30, servingUnit: "g" },
  { name: "Dextrose Powder", calories: 370, protein: 0, carbs: 93, fat: 0, fiber: 0, servingSize: 30, servingUnit: "g" },
  { name: "Waxy Maize Powder", calories: 375, protein: 0, carbs: 94, fat: 0, fiber: 0, servingSize: 30, servingUnit: "g" },
  { name: "MuscleBlaze Carb Supplement", brand: "MuscleBlaze", calories: 380, protein: 0, carbs: 95, fat: 0, fiber: 0, servingSize: 30, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── GREENS / SUPERFOOD POWDER ───
  // ═══════════════════════════════════════════════════════
  { name: "Greens Powder", calories: 120, protein: 15, carbs: 18, fat: 2, fiber: 5, servingSize: 10, servingUnit: "g" },
  { name: "Athletic Greens AG1", brand: "Athletic Greens", calories: 150, protein: 12, carbs: 20, fat: 2.5, fiber: 5, servingSize: 12, servingUnit: "scoop" },
  { name: "Garden of Life Super Greens", brand: "Garden of Life", calories: 130, protein: 14, carbs: 16, fat: 2, fiber: 6, servingSize: 10, servingUnit: "g" },
  { name: "Amazing Grass Greens Blend", brand: "Amazing Grass", calories: 140, protein: 12, carbs: 20, fat: 2, fiber: 4, servingSize: 8, servingUnit: "g" },
  { name: "Oziva Greens", brand: "Oziva", calories: 125, protein: 13, carbs: 17, fat: 2, fiber: 5, servingSize: 10, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── ENERGY / PRE-WORKOUT GELS ───
  // ═══════════════════════════════════════════════════════
  { name: "Energy Gel", calories: 260, protein: 0, carbs: 65, fat: 0, fiber: 0, servingSize: 32, servingUnit: "sachet" },
  { name: "GU Energy Gel", brand: "GU", calories: 260, protein: 0, carbs: 65, fat: 0, fiber: 0, servingSize: 32, servingUnit: "sachet" },
  { name: "Clif Shot Gel", brand: "Clif", calories: 250, protein: 0, carbs: 62, fat: 0, fiber: 0, servingSize: 34, servingUnit: "sachet" },
  { name: "SIS Go Gel", brand: "SIS", calories: 260, protein: 0, carbs: 65, fat: 0, fiber: 0, servingSize: 60, servingUnit: "ml" },

  // ═══════════════════════════════════════════════════════
  // ─── HYDRATION / SPORTS DRINKS ───
  // ═══════════════════════════════════════════════════════
  { name: "Gatorade", brand: "Gatorade", calories: 26, protein: 0, carbs: 6.4, fat: 0, fiber: 0, servingSize: 240, servingUnit: "ml" },
  { name: "Powerade", brand: "Powerade", calories: 26, protein: 0, carbs: 6.5, fat: 0, fiber: 0, servingSize: 240, servingUnit: "ml" },
  { name: "BodyArmor Sports Drink", brand: "BodyArmor", calories: 30, protein: 0, carbs: 7, fat: 0, fiber: 0, servingSize: 240, servingUnit: "ml" },

  // ═══════════════════════════════════════════════════════
  // ─── MEAL REPLACEMENT ───
  // ═══════════════════════════════════════════════════════
  { name: "Huel Powder", brand: "Huel", calories: 400, protein: 30, carbs: 40, fat: 13, fiber: 8, servingSize: 100, servingUnit: "g" },
  { name: "Soylent Powder", brand: "Soylent", calories: 400, protein: 27, carbs: 43, fat: 13, fiber: 5, servingSize: 100, servingUnit: "g" },
  { name: "Satislent", brand: "Satislent", calories: 400, protein: 28, carbs: 40, fat: 14, fiber: 7, servingSize: 100, servingUnit: "g" },
  { name: "Mana Powder", brand: "Mana", calories: 400, protein: 28, carbs: 38, fat: 16, fiber: 6, servingSize: 100, servingUnit: "g" },
  { name: "Jimmy Joy Plenny Shake", brand: "Jimmy Joy", calories: 395, protein: 27, carbs: 40, fat: 14, fiber: 7, servingSize: 100, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── SPECIALTY / INDIAN AYURVEDIC ───
  // ═══════════════════════════════════════════════════════
  { name: "Shilajit Capsule", calories: 5, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Shilajit Resin", calories: 250, protein: 15, carbs: 40, fat: 3, fiber: 5, servingSize: 300, servingUnit: "mg" },
  { name: "Chyawanprash", calories: 280, protein: 2, carbs: 65, fat: 3, fiber: 1, servingSize: 15, servingUnit: "g" },
  { name: "Dabur Chyawanprash", brand: "Dabur", calories: 280, protein: 2, carbs: 65, fat: 3, fiber: 1, servingSize: 15, servingUnit: "g" },
  { name: "Shatavari Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Gokshura Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Safed Musli Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Moringa Powder", calories: 320, protein: 27, carbs: 40, fat: 5, fiber: 19, servingSize: 5, servingUnit: "g" },
  { name: "Spirulina Tablet", calories: 290, protein: 57, carbs: 24, fat: 5, fiber: 3, servingSize: 1, servingUnit: "tablet" },
  { name: "Spirulina Powder", calories: 290, protein: 57, carbs: 24, fat: 5, fiber: 3, servingSize: 5, servingUnit: "g" },
  { name: "Wheatgrass Powder", calories: 250, protein: 24, carbs: 46, fat: 2, fiber: 14, servingSize: 5, servingUnit: "g" },
  { name: "Giloy Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Triphala Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Amla Powder", calories: 250, protein: 3, carbs: 58, fat: 0.5, fiber: 10, servingSize: 5, servingUnit: "g" },
  { name: "Brahmi Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },

  // ═══════════════════════════════════════════════════════
  // ─── VITAMIN B-COMPLEX / INDIVIDUAL VITAMINS ───
  // ═══════════════════════════════════════════════════════
  { name: "Vitamin B-Complex Tablet", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Vitamin C Tablet", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Vitamin E Capsule", calories: 5, protein: 0, carbs: 0.3, fat: 0.5, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Biotin Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Iron Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Magnesium Tablet", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Zinc Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Potassium Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },
  { name: "Folic Acid Tablet", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "tablet" },

  // ═══════════════════════════════════════════════════════
  // ─── GENERAL SUPPLEMENT TYPES (no brand) ───
  // ═══════════════════════════════════════════════════════
  { name: "Whey Protein", calories: 400, protein: 80, carbs: 10, fat: 5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Whey Protein Isolate", calories: 370, protein: 87, carbs: 3, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Whey Protein Concentrate", calories: 400, protein: 78, carbs: 10, fat: 6, fiber: 0, servingSize: 32, servingUnit: "scoop" },
  { name: "Casein Protein", calories: 380, protein: 78, carbs: 9, fat: 4.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Soy Protein Isolate", calories: 340, protein: 73, carbs: 10, fat: 3, fiber: 2, servingSize: 30, servingUnit: "scoop" },
  { name: "Pea Protein", calories: 375, protein: 75, carbs: 8, fat: 5, fiber: 3, servingSize: 30, servingUnit: "scoop" },
  { name: "Hemp Protein", calories: 370, protein: 50, carbs: 24, fat: 13, fiber: 13, servingSize: 30, servingUnit: "scoop" },
  { name: "Rice Protein", calories: 370, protein: 78, carbs: 7, fat: 3, fiber: 1, servingSize: 30, servingUnit: "scoop" },
  { name: "Egg Protein Powder", calories: 385, protein: 76, carbs: 8, fat: 6, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Beef Protein Isolate", calories: 360, protein: 83, carbs: 3, fat: 3, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "Mass Gainer", calories: 380, protein: 20, carbs: 70, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "Weight Gainer", calories: 385, protein: 18, carbs: 72, fat: 4, fiber: 0.5, servingSize: 100, servingUnit: "scoop" },
  { name: "Protein Bar", calories: 355, protein: 35, carbs: 40, fat: 12, fiber: 5, servingSize: 60, servingUnit: "bar" },
  { name: "Energy Bar", calories: 370, protein: 15, carbs: 55, fat: 9, fiber: 3, servingSize: 65, servingUnit: "bar" },
  { name: "Pre-Workout Powder", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 8, servingUnit: "scoop" },
  { name: "Post-Workout Powder", calories: 380, protein: 30, carbs: 50, fat: 3, fiber: 0.5, servingSize: 45, servingUnit: "scoop" },
  { name: "Meal Replacement Shake", calories: 400, protein: 28, carbs: 42, fat: 13, fiber: 6, servingSize: 100, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── GUMMY VITAMINS ───
  // ═══════════════════════════════════════════════════════
  { name: "Multivitamin Gummy", calories: 10, protein: 0, carbs: 2.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "gummy" },
  { name: "Vitamin C Gummy", calories: 10, protein: 0, carbs: 2.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "gummy" },
  { name: "Omega-3 Gummy", calories: 10, protein: 0, carbs: 2, fat: 0.5, fiber: 0, servingSize: 1, servingUnit: "gummy" },
  { name: "Biotin Gummy", calories: 8, protein: 0, carbs: 2, fat: 0, fiber: 0, servingSize: 1, servingUnit: "gummy" },
  { name: "Melatonin Gummy", calories: 8, protein: 0, carbs: 2, fat: 0, fiber: 0, servingSize: 1, servingUnit: "gummy" },
  { name: "Elderberry Gummy", calories: 10, protein: 0, carbs: 2.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "gummy" },

  // ═══════════════════════════════════════════════════════
  // ─── SLEEP / RECOVERY ───
  // ═══════════════════════════════════════════════════════
  { name: "Casein Protein Before Bed", calories: 380, protein: 78, carbs: 9, fat: 4.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Magnesium Glycinate Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "GABA Capsule", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "5-HTP Capsule", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "L-Theanine Capsule", calories: 2, protein: 0, carbs: 0.3, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },
  { name: "Tart Cherry Extract Capsule", calories: 3, protein: 0, carbs: 0.5, fat: 0, fiber: 0, servingSize: 1, servingUnit: "capsule" },

  // ═══════════════════════════════════════════════════════
  // ─── INDIAN PROTEIN FOODS / SATTU / MILLET ───
  // ═══════════════════════════════════════════════════════
  { name: "Sattu Powder", calories: 370, protein: 22, carbs: 58, fat: 5, fiber: 6, servingSize: 30, servingUnit: "g" },
  { name: "Ragi Powder", calories: 328, protein: 7.3, carbs: 72, fat: 1.3, fiber: 11, servingSize: 30, servingUnit: "g" },
  { name: "Bajra Flour", calories: 361, protein: 11.6, carbs: 67, fat: 5, fiber: 11, servingSize: 30, servingUnit: "g" },
  { name: "Jowar Flour", calories: 349, protein: 10.4, carbs: 72, fat: 1.9, fiber: 10, servingSize: 30, servingUnit: "g" },
  { name: "Amaranth Flour", calories: 371, protein: 13.6, carbs: 65, fat: 7, fiber: 7, servingSize: 30, servingUnit: "g" },
  { name: "Foxtail Millet Flour", calories: 351, protein: 12.3, carbs: 60, fat: 4.3, fiber: 8, servingSize: 30, servingUnit: "g" },
  { name: "Besan (Gram Flour)", calories: 387, protein: 22, carbs: 58, fat: 6.7, fiber: 10, servingSize: 30, servingUnit: "g" },
  { name: "Soya Flour", calories: 440, protein: 48, carbs: 22, fat: 17, fiber: 8, servingSize: 30, servingUnit: "g" },
  { name: "Peanut Powder", calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8, servingSize: 30, servingUnit: "g" },
  { name: "Makhana Powder", calories: 350, protein: 9.7, carbs: 71, fat: 0.1, fiber: 14, servingSize: 20, servingUnit: "g" },

  // ═══════════════════════════════════════════════════════
  // ─── ADDITIONAL INDIAN BRANDS ───
  // ═══════════════════════════════════════════════════════
  { name: "Muscletech India Mass Gainer", brand: "MuscleTech", calories: 380, protein: 19, carbs: 72, fat: 3.5, fiber: 1, servingSize: 115, servingUnit: "scoop" },
  { name: "Dymatize India Mass Gainer", brand: "Dymatize", calories: 383, protein: 17, carbs: 74, fat: 3, fiber: 0.5, servingSize: 148, servingUnit: "scoop" },
  { name: "BSN India True Mass", brand: "BSN", calories: 388, protein: 20, carbs: 68, fat: 6, fiber: 1, servingSize: 96, servingUnit: "scoop" },
  { name: "Universal India Animal Whey", brand: "Universal", calories: 395, protein: 77, carbs: 8, fat: 6, fiber: 0, servingSize: 33, servingUnit: "scoop" },
  { name: "Cellucor India C4", brand: "Cellucor", calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0, servingSize: 6, servingUnit: "scoop" },
  { name: "Optimum Nutrition India Serious Mass", brand: "Optimum Nutrition", calories: 378, protein: 15, carbs: 75, fat: 2, fiber: 1, servingSize: 128, servingUnit: "scoop" },
  { name: "MyProtein India Weight Gainer", brand: "MyProtein", calories: 385, protein: 18, carbs: 72, fat: 4, fiber: 1, servingSize: 100, servingUnit: "scoop" },
  { name: "Big Muscles India Carb Supplement", brand: "Big Muscles", calories: 380, protein: 0, carbs: 95, fat: 0, fiber: 0, servingSize: 30, servingUnit: "g" },
  { name: "Nutrabay India Whey Isolate", brand: "Nutrabay", calories: 370, protein: 86, carbs: 3, fat: 1.5, fiber: 0, servingSize: 30, servingUnit: "scoop" },
  { name: "NakPro India Performance Whey", brand: "NakPro", calories: 390, protein: 78, carbs: 7, fat: 5.5, fiber: 0, servingSize: 33, servingUnit: "scoop" },
];

// ── Supplement-specific unit conversions ──
// Maps supplement names/keywords to their serving size in grams for specific units
export const SUPPLEMENT_UNIT_TO_GRAMS: Record<string, number> = {
  // Default supplement unit conversions
  "default:scoop": 30,
  "default:tablet": 1,
  "default:tab": 1,
  "default:capsule": 0.8,
  "default:cap": 0.8,
  "default:softgel": 1,
  "default:gummy": 3,
  "default:bar": 60,
  "default:packet": 30,
  "default:sachet": 30,
  "default:can": 330,
  "default:caplet": 1,
  "default:pill": 0.5,
  "default:lozenge": 2,
  "default:drop": 0.05,
  "default:ml": 1,
  "default:g": 1,
  "default:serving": 30,
  "default:piece": 60,
  "default:mg": 0.001,

  // Supplement-specific overrides
  "whey protein:scoop": 30,
  "whey protein isolate:scoop": 30,
  "whey protein concentrate:scoop": 32,
  "casein protein:scoop": 33,
  "mass gainer:scoop": 100,
  "weight gainer:scoop": 100,
  "pre-workout:scoop": 8,
  "protein bar:bar": 60,
  "energy bar:bar": 65,
  "creatine:scoop": 5,
  "creatine monohydrate:scoop": 5,
  "bcaa:scoop": 7,
  "eaa:scoop": 10,
  "glutamine:scoop": 5,
  "beta-alanine:scoop": 3,
  "citrulline:scoop": 6,
  "citrulline malate:scoop": 8,
  "greens:scoop": 10,
  "meal replacement:scoop": 100,
  "collagen:scoop": 10,
  "carb powder:scoop": 30,
  "maltodextrin:scoop": 30,
  "electrolyte:scoop": 5,
  "sattu:scoop": 30,
  "protein shake:ml": 1,
  "rtd protein:ml": 1,
  "gatorade:ml": 1,
  "energy gel:sachet": 32,
  "ensure:ml": 1,
  "boost:ml": 1,
  "herbalife:scoop": 26,
  "horlicks:scoop": 20,
  "bournvita:scoop": 20,
  "complan:scoop": 33,
  "protinex:scoop": 30,
  "chyawanprash:tbsp": 20,
  "moringa:tsp": 3,
  "spirulina:tablet": 0.5,
  "wheatgrass:tsp": 3,
};
