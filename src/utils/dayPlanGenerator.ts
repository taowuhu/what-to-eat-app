import { Recipe, DayMealPlan, DayMealSlot, MealType, UserProfile, GroupedGroceryItem, GroceryCategory, ProteinSource, QuickFilterId } from '../types';
import { ALL_RECIPES } from '../data/recipes';
import { calculateMacroTargets, getMealMacroTarget } from './nutrition';
import { composeMeal, filterByDislikes, weightedPickByScore } from './mealComposer';
import { isIngredientMatched, auditMealPantryCoverage } from './ingredientMatcher';
import { filterStrictExclusions } from './scoringEngine';
import { formatScaledAmount, scaleRecipeForServings, tuneRecipeNutritionalPortions } from './servingsScaler';

/**
 * Helper to pick random item from array
 */
function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a single meal slot (breakfast, lunch, or dinner)
 */
export function generateMealSlot(
  type: MealType,
  userProfile: UserProfile,
  excludeRecipeIds: string[] = [],
  avoidProtein?: ProteinSource,
  pantryIngredientIds: string[] = [],
  clearFridgeMode: boolean = false,
  activeFilters: QuickFilterId[] = []
): DayMealSlot {
  const strictPool = filterStrictExclusions(ALL_RECIPES, userProfile.strictlyExclude);
  const cleanPool = filterByDislikes(strictPool, userProfile.dislikes)
    .filter(r => !excludeRecipeIds.includes(r.id));

  const allAvailable = cleanPool.length >= 10 ? cleanPool : strictPool;

  // Use composeMeal for all meals (breakfast, lunch, dinner)
  // Breakfast uses composeBreakfastMeal (Staple + Protein + Drink/Fruit)
  // Lunch and Dinner use Main + Veg + Staple (+ optional soup)
  const mealCombo = composeMeal(allAvailable, {
    mealType: type,
    avoidProtein,
    avoidRecipeIds: excludeRecipeIds,
    includeSoup: type === 'dinner' && Math.random() > 0.4 && !clearFridgeMode,
    userProfile,
    pantryIngredientIds,
    clearFridgeMode,
    activeFilters,
    servings: userProfile.defaultServings || 1,
  });

  const label = type === 'breakfast' ? '早餐' : type === 'lunch' ? '午餐' : '晚餐';
  const title = mealCombo.comboTitle || mealCombo.recipes.map(r => r.name).join(' + ');

  const tags: string[] = [];
  if (type === 'breakfast') {
    tags.push('晨起充能');
  } else if (type === 'lunch') {
    tags.push('午间充能');
  } else {
    tags.push('晚间轻负担');
  }
  if (mealCombo.totalProtein >= 20) tags.push('优质蛋白');
  if (mealCombo.estimatedTimeMinutes <= 15) tags.push('快手');
  if (type !== 'breakfast') tags.push('荤素搭配');

  return {
    type,
    label,
    title,
    timeMinutes: mealCombo.estimatedTimeMinutes,
    tags: tags.slice(0, 3),
    recipes: mealCombo.recipes,
    calories: mealCombo.totalCalories,
    protein: mealCombo.totalProtein,
    carbs: mealCombo.totalCarbs,
    fat: mealCombo.totalFat,
    difficulty: mealCombo.difficulty || '小白友好',
    nutritionValidation: mealCombo.nutritionValidation,
  };
}

/**
 * Generate a complete DayMealPlan for user based on targets and preferences
 */
export function generateDayMealPlan(
  userProfile: UserProfile,
  pantryIngredientIds: string[] = [],
  clearFridgeMode: boolean = false,
  activeFilters: QuickFilterId[] = []
): DayMealPlan {
  const targets = calculateMacroTargets(userProfile);
  const todayDate = new Date().toISOString().split('T')[0];

  // 1. Breakfast
  const breakfast = generateMealSlot('breakfast', userProfile, [], undefined, pantryIngredientIds, clearFridgeMode, activeFilters);
  const breakfastIds = breakfast.recipes.map(r => r.id);

  // 2. Lunch
  const lunch = generateMealSlot('lunch', userProfile, breakfastIds, undefined, pantryIngredientIds, clearFridgeMode, activeFilters);
  const lunchMain = lunch.recipes[0];
  const lunchProtein = lunchMain?.proteinSource;

  // 3. Dinner (avoid repeating main dishes or same protein from lunch)
  const usedIds = [...breakfastIds, ...lunch.recipes.map(r => r.id)];
  const dinner = generateMealSlot('dinner', userProfile, usedIds, lunchProtein, pantryIngredientIds, clearFridgeMode, activeFilters);

  // 4. Day-Level Macro Audit & Soft Balancing (V0.4.7.1)
  const finalBreakfast = breakfast;
  const finalLunch = lunch;
  const finalDinner = dinner;

  let totalCal = finalBreakfast.calories + finalLunch.calories + finalDinner.calories;
  let totalProt = Math.round((finalBreakfast.protein + finalLunch.protein + finalDinner.protein) * 10) / 10;
  let totalCarb = Math.round((finalBreakfast.carbs + finalLunch.carbs + finalDinner.carbs) * 10) / 10;
  let totalF = Math.round((finalBreakfast.fat + finalLunch.fat + finalDinner.fat) * 10) / 10;

  // Audit against daily targets (V0.4.7.3 Bidirectional Day-Level Calibration)
  const calRatio = totalCal / Math.max(1200, targets.calories);
  const protRatio = totalProt / Math.max(40, targets.protein);
  const carbRatio = totalCarb / Math.max(80, targets.carbs);

  // 1. Protein bidirectional calibration (land within target bounds)
  if (protRatio > 1.06) {
    const pTrim = Math.max(0.70, targets.protein / Math.max(1, totalProt));
    for (const slot of [finalLunch, finalDinner]) {
      const mainIdx = slot.recipes.findIndex(r => r.category === 'main');
      if (mainIdx >= 0) {
        slot.recipes[mainIdx] = tuneRecipeNutritionalPortions(slot.recipes[mainIdx], { proteinMultiplier: pTrim });
      } else if (slot.recipes.length > 0) {
        slot.recipes[0] = tuneRecipeNutritionalPortions(slot.recipes[0], { proteinMultiplier: pTrim });
      }
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  } else if (protRatio < 0.94) {
    const pBoost = Math.min(1.35, targets.protein / Math.max(1, totalProt));
    for (const slot of [finalLunch, finalDinner]) {
      const mainIdx = slot.recipes.findIndex(r => r.category === 'main');
      if (mainIdx >= 0) {
        slot.recipes[mainIdx] = tuneRecipeNutritionalPortions(slot.recipes[mainIdx], { proteinMultiplier: pBoost });
      } else if (slot.recipes.length > 0) {
        slot.recipes[0] = tuneRecipeNutritionalPortions(slot.recipes[0], { proteinMultiplier: pBoost });
      }
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  }

  // 2. Carbs bidirectional calibration (land within target bounds)
  totalCarb = Math.round((finalBreakfast.carbs + finalLunch.carbs + finalDinner.carbs) * 10) / 10;
  const currentCarbRatio = totalCarb / Math.max(80, targets.carbs);
  if (currentCarbRatio < 0.92) {
    const cBoost = Math.min(1.30, targets.carbs / Math.max(1, totalCarb));
    for (const slot of [finalLunch, finalDinner]) {
      const stapleIdx = slot.recipes.findIndex(r => r.category === 'staple');
      if (stapleIdx >= 0) {
        slot.recipes[stapleIdx] = tuneRecipeNutritionalPortions(slot.recipes[stapleIdx], { carbMultiplier: cBoost });
      } else if (slot.recipes.length > 0) {
        slot.recipes[0] = tuneRecipeNutritionalPortions(slot.recipes[0], { carbMultiplier: cBoost });
      }
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  } else if (currentCarbRatio > 1.08) {
    const cTrim = Math.max(0.75, targets.carbs / Math.max(1, totalCarb));
    for (const slot of [finalLunch, finalDinner]) {
      const stapleIdx = slot.recipes.findIndex(r => r.category === 'staple');
      if (stapleIdx >= 0) {
        slot.recipes[stapleIdx] = tuneRecipeNutritionalPortions(slot.recipes[stapleIdx], { carbMultiplier: cTrim });
      } else if (slot.recipes.length > 0) {
        slot.recipes[0] = tuneRecipeNutritionalPortions(slot.recipes[0], { carbMultiplier: cTrim });
      }
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  }

  // 3. Fat bidirectional calibration (land within target bounds)
  totalF = Math.round((finalBreakfast.fat + finalLunch.fat + finalDinner.fat) * 10) / 10;
  const currentFatRatio = totalF / Math.max(30, targets.fat);
  if (currentFatRatio < 0.90) {
    const fBoost = Math.min(1.85, targets.fat / Math.max(1, totalF));
    for (const slot of [finalLunch, finalDinner]) {
      slot.recipes = slot.recipes.map(r => tuneRecipeNutritionalPortions(r, { fatMultiplier: fBoost }));
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  } else if (currentFatRatio > 1.12) {
    const fTrim = Math.max(0.65, targets.fat / Math.max(1, totalF));
    for (const slot of [finalLunch, finalDinner]) {
      slot.recipes = slot.recipes.map(r => tuneRecipeNutritionalPortions(r, { fatMultiplier: fTrim }));
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  }

  // 4. Overall calorie sufficiency calibration
  totalCal = finalBreakfast.calories + finalLunch.calories + finalDinner.calories;
  if (totalCal < targets.calories * 0.90) {
    const calScale = Math.min(1.18, targets.calories / Math.max(1, totalCal));
    for (const slot of [finalLunch, finalDinner]) {
      slot.recipes = slot.recipes.map(r => tuneRecipeNutritionalPortions(r, {
        carbMultiplier: calScale,
        fatMultiplier: calScale,
      }));
      slot.calories = slot.recipes.reduce((s, r) => s + r.calories, 0);
      slot.carbs = Math.round(slot.recipes.reduce((s, r) => s + r.carbs, 0) * 10) / 10;
      slot.fat = Math.round(slot.recipes.reduce((s, r) => s + r.fat, 0) * 10) / 10;
      slot.protein = Math.round(slot.recipes.reduce((s, r) => s + r.protein, 0) * 10) / 10;
    }
  }

  // Re-aggregate after day audit
  totalCal = finalBreakfast.calories + finalLunch.calories + finalDinner.calories;
  totalProt = Math.round((finalBreakfast.protein + finalLunch.protein + finalDinner.protein) * 10) / 10;
  totalCarb = Math.round((finalBreakfast.carbs + finalLunch.carbs + finalDinner.carbs) * 10) / 10;
  totalF = Math.round((finalBreakfast.fat + finalLunch.fat + finalDinner.fat) * 10) / 10;

  const calDiffPercent = Math.abs(totalCal - targets.calories) / Math.max(1, targets.calories);
  const protDiffPercent = Math.abs(totalProt - targets.protein) / Math.max(1, targets.protein);
  const targetFitRate = Math.round(Math.max(50, Math.min(99, 100 - (calDiffPercent * 30 + protDiffPercent * 30))));
  const isBalanced = calDiffPercent <= 0.20 && protDiffPercent <= 0.25;

  // Calculate stats for day audit: average, median, min, max deviations across slots
  const slots = [finalBreakfast, finalLunch, finalDinner];
  const mealTargets = [
    getMealMacroTarget(targets, 'breakfast'),
    getMealMacroTarget(targets, 'lunch'),
    getMealMacroTarget(targets, 'dinner'),
  ];

  const calDevs = slots.map((s, i) => Math.abs(s.calories - mealTargets[i].calories.preferred));
  const protDevs = slots.map((s, i) => Math.abs(s.protein - mealTargets[i].protein.preferred));
  const carbDevs = slots.map((s, i) => Math.abs(s.carbs - mealTargets[i].carbs.preferred));
  const fatDevs = slots.map((s, i) => Math.abs(s.fat - mealTargets[i].fat.preferred));

  const calcDist = (arr: number[], unit: string) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const avg = Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 10) / 10;
    const med = sorted[Math.floor(sorted.length / 2)];
    return { average: avg, median: med, min: sorted[0], max: sorted[sorted.length - 1], unit };
  };

  const slotsWithinRange = slots.filter((s, i) => {
    const t = mealTargets[i];
    return (
      s.calories >= t.calories.min && s.calories <= t.calories.max &&
      s.protein >= t.protein.min && s.protein <= t.protein.max
    );
  }).length;

  const dayAudit: DayMealPlan['dayAudit'] = {
    targetFitRate,
    isBalanced,
    targetCalories: targets.calories,
    targetProtein: targets.protein,
    targetCarbs: targets.carbs,
    targetFat: targets.fat,
    proteinDistribution: {
      breakfast: finalBreakfast.protein,
      lunch: finalLunch.protein,
      dinner: finalDinner.protein,
    },
    macroDeviations: {
      calories: calcDist(calDevs, 'kcal'),
      protein: calcDist(protDevs, 'g'),
      carbs: calcDist(carbDevs, 'g'),
      fat: calcDist(fatDevs, 'g'),
    },
    fitRateStats: {
      slotsTotal: slots.length,
      slotsWithinRange,
      summaryText: `全天3餐宏量摄入与个性化目标适配率 ${targetFitRate}%，${slotsWithinRange}/${slots.length} 餐落入适宜范围`,
    },
  };

  // Calculate day-wide pantry coverage
  let pantryCoverageInfo: DayMealPlan['pantryCoverage'] = undefined;
  if (pantryIngredientIds.length > 0) {
    const allRecipes = [...finalBreakfast.recipes, ...finalLunch.recipes, ...finalDinner.recipes];
    const audit = auditMealPantryCoverage(allRecipes, pantryIngredientIds, clearFridgeMode);
    pantryCoverageInfo = {
      coveragePercent: Math.round(audit.coverageRate * 100),
      missingCount: audit.missingCount,
      matchedCount: audit.matchedCount,
      totalCount: audit.totalCount,
    };
  }

  return {
    id: `plan_${Date.now()}`,
    date: todayDate,
    nutritionSummary: `今日全天热量约 ${totalCal} kcal · 优质蛋白 ${totalProt}g · 碳水 ${totalCarb}g · 荤素均衡`,
    totalCalories: totalCal,
    totalProtein: totalProt,
    totalCarbs: totalCarb,
    totalFat: totalF,
    breakfast: finalBreakfast,
    lunch: finalLunch,
    dinner: finalDinner,
    pantryCoverage: pantryCoverageInfo,
    dayAudit,
  };
}

export const generateDayPlan = generateDayMealPlan;

/**
 * Aggregates a list of recipes' ingredients into a unified, deduplicated list.
 * Key rules:
 * 1. Scaled ingredients are combined by name and unit.
 * 2. duplicate ingredients across dishes (e.g. eggs in breakfast + lunch + dinner) are summed without duplicate lines.
 * 3. Pantry status is preserved if any matching ingredient is in pantry.
 */
export function aggregateIngredients(
  recipes: Recipe[],
  pantryIngredientIds: string[] = []
): GroupedGroceryItem[] {
  const map = new Map<string, GroupedGroceryItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      let cat: GroceryCategory = '蔬菜';
      const c = ing.category;
      if (c === '肉禽蛋' || c === '奶类坚果' || c === '豆制品水产') {
        cat = '肉蛋奶';
      } else if (c === '粮谷主食') {
        cat = '主食';
      } else if (c === '调料辅料') {
        cat = '调味料';
      } else {
        cat = '蔬菜';
      }

      const inPantry = pantryIngredientIds.length > 0 && isIngredientMatched(ing, pantryIngredientIds);
      const name = ing.name.trim();
      const unit = ing.unit.trim();
      const key = `${name}_${unit}`;

      const existing = map.get(key);
      if (existing) {
        existing.amount = formatScaledAmount(existing.amount + ing.amount);
        if (!existing.sourceDishes.includes(recipe.name)) {
          existing.sourceDishes.push(recipe.name);
        }
        if (inPantry) {
          existing.isInPantry = true;
        }
      } else {
        map.set(key, {
          name,
          amount: ing.amount,
          unit,
          category: cat,
          sourceDishes: [recipe.name],
          isInPantry: inPantry,
        });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Categorize ingredients into four easy shopping sections: 肉蛋奶, 蔬菜, 主食, 调味料.
 * If targetServings is provided, each recipe is scaled from its base definition first.
 */
export function buildDayGroceryList(
  plan: DayMealPlan,
  pantryIngredientIds: string[] = [],
  targetServings?: number
): Record<GroceryCategory, GroupedGroceryItem[]> {
  const allRawRecipes = [
    ...plan.breakfast.recipes,
    ...plan.lunch.recipes,
    ...plan.dinner.recipes,
  ];

  // If targetServings is specified, guarantee each recipe is scaled from its base
  const allRecipes = targetServings !== undefined
    ? allRawRecipes.map(r => scaleRecipeForServings(r, targetServings))
    : allRawRecipes;

  const items = aggregateIngredients(allRecipes, pantryIngredientIds);

  const result: Record<GroceryCategory, GroupedGroceryItem[]> = {
    '肉蛋奶': [],
    '蔬菜': [],
    '主食': [],
    '调味料': [],
  };

  for (const item of items) {
    const cat = item.category || '蔬菜';
    if (result[cat]) {
      result[cat].push(item);
    } else {
      result['蔬菜'].push(item);
    }
  }

  return result;
}
