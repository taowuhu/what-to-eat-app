import { Ingredient, Recipe, GroupedGroceryItem, MacroNutrients } from '../types';

/**
 * Seasoning scaling factor lookup to prevent over-seasoning when scaling up portions.
 * (e.g. 2 servings does not strictly need 2.0x salt/soy sauce; 1.7x maintains ideal flavor)
 */
export const SEASONING_SCALE_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 1.7,
  3: 2.3,
  4: 2.8,
};

export function getSeasoningScaleFactor(targetServings: number, baseServings: number = 1): number {
  const target = Math.max(1, Math.min(4, targetServings));
  const base = Math.max(1, Math.min(4, baseServings));
  if (target === base) return 1.0;
  const targetFactor = SEASONING_SCALE_FACTORS[target] || Math.pow(target, 0.75);
  const baseFactor = SEASONING_SCALE_FACTORS[base] || Math.pow(base, 0.75);
  return Math.round((targetFactor / baseFactor) * 10) / 10;
}

export function getMainIngredientScaleFactor(targetServings: number, baseServings: number = 1): number {
  const base = baseServings > 0 ? baseServings : 1;
  return targetServings / base;
}

/**
 * Formats scaled quantity cleanly (e.g. 200, 1.5, 0.8)
 */
export function formatScaledAmount(amount: number): number {
  if (Number.isInteger(amount)) return amount;
  const rounded = Math.round(amount * 10) / 10;
  return Number.isInteger(rounded) ? Math.round(rounded) : rounded;
}

/**
 * Scales an individual ingredient safely without mutating the original object
 */
export function scaleIngredient(
  ingredient: Ingredient,
  targetServings: number,
  baseServings: number = 1
): Ingredient {
  const isSeasoning = ingredient.category === '调料辅料';
  const factor = isSeasoning
    ? getSeasoningScaleFactor(targetServings, baseServings)
    : getMainIngredientScaleFactor(targetServings, baseServings);

  const scaledAmount = formatScaledAmount(ingredient.amount * factor);
  const scaledGrams = ingredient.grams !== undefined
    ? Math.round(ingredient.grams * (isSeasoning ? factor : getMainIngredientScaleFactor(targetServings, baseServings)))
    : undefined;

  return {
    ...ingredient,
    amount: scaledAmount,
    grams: scaledGrams,
  };
}

/**
 * Common caloric seasonings density mapping for non-zero macro contributions.
 * Note: Low-calorie or zero-calorie seasonings (salt, pepper, spices, vinegar,
 * scallion, garlic, ginger) are treated as minimal or zero caloric impact.
 */
const CALORIC_SEASONING_KEYWORDS: {
  keyword: string;
  calPerGram: number;
  pPerGram: number;
  cPerGram: number;
  fPerGram: number;
}[] = [
  { keyword: '油', calPerGram: 8.99, pPerGram: 0, cPerGram: 0, fPerGram: 0.999 },
  { keyword: '花生酱', calPerGram: 5.88, pPerGram: 0.25, cPerGram: 0.20, fPerGram: 0.50 },
  { keyword: '芝麻酱', calPerGram: 6.18, pPerGram: 0.19, cPerGram: 0.19, fPerGram: 0.53 },
  { keyword: '芝麻', calPerGram: 5.7, pPerGram: 0.18, cPerGram: 0.12, fPerGram: 0.50 },
  { keyword: '沙拉酱', calPerGram: 4.5, pPerGram: 0.01, cPerGram: 0.15, fPerGram: 0.45 },
  { keyword: '咖喱', calPerGram: 4.1, pPerGram: 0.06, cPerGram: 0.45, fPerGram: 0.24 },
  { keyword: '糖', calPerGram: 4.0, pPerGram: 0, cPerGram: 1.0, fPerGram: 0 },
  { keyword: '蜂蜜', calPerGram: 3.04, pPerGram: 0.003, cPerGram: 0.82, fPerGram: 0 },
  { keyword: '淀粉', calPerGram: 3.5, pPerGram: 0.005, cPerGram: 0.85, fPerGram: 0 },
  { keyword: '生粉', calPerGram: 3.5, pPerGram: 0.005, cPerGram: 0.85, fPerGram: 0 },
  { keyword: '甜面酱', calPerGram: 1.4, pPerGram: 0.05, cPerGram: 0.28, fPerGram: 0.01 },
  { keyword: '蚝油', calPerGram: 1.14, pPerGram: 0.035, cPerGram: 0.24, fPerGram: 0.002 },
  { keyword: '番茄酱', calPerGram: 1.1, pPerGram: 0.02, cPerGram: 0.25, fPerGram: 0 },
  { keyword: '老抽', calPerGram: 0.9, pPerGram: 0.08, cPerGram: 0.145, fPerGram: 0 },
  { keyword: '豆瓣酱', calPerGram: 0.9, pPerGram: 0.07, cPerGram: 0.11, fPerGram: 0.02 },
  { keyword: '料酒', calPerGram: 0.8, pPerGram: 0.01, cPerGram: 0.05, fPerGram: 0 },
  { keyword: '生抽', calPerGram: 0.6, pPerGram: 0.06, cPerGram: 0.085, fPerGram: 0 },
  { keyword: '酱油', calPerGram: 0.6, pPerGram: 0.06, cPerGram: 0.085, fPerGram: 0 },
];

/**
 * Unified calculation source for scaled recipe nutrition:
 * Derives nutrition from the sum of scaled ingredients:
 * - Main ingredients (肉禽蛋、蔬菜、主食、豆制品) scale linearly with target servings.
 * - Seasonings (调料辅料) scale sub-linearly to prevent flavor and sodium/oil oversaturation.
 * - Caloric seasonings (oils, sugars, thick sauces) scale with their physical amounts,
 *   while non-caloric/low-caloric seasonings (salt, spices) contribute 0 calories.
 */
export function calculateRecipeNutrition(recipe: Recipe, targetServings: number): MacroNutrients {
  const baseServings = recipe.servings || 1;
  if (targetServings === baseServings) {
    return {
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    };
  }

  const mainFactor = getMainIngredientScaleFactor(targetServings, baseServings);
  const seasFactor = getSeasoningScaleFactor(targetServings, baseServings);

  // Check if recipe has caloric seasonings
  let hasCaloricSeasoning = false;
  let hasOil = false;
  let totalCaloricSeasGrams = 0;

  for (const ing of recipe.ingredients) {
    if (ing.category === '调料辅料') {
      const g = ing.grams !== undefined ? ing.grams : (ing.unit.includes('克') ? ing.amount : ing.amount * 5);
      for (const item of CALORIC_SEASONING_KEYWORDS) {
        if (ing.name.includes(item.keyword)) {
          hasCaloricSeasoning = true;
          totalCaloricSeasGrams += g;
          if (item.keyword === '油') hasOil = true;
          break;
        }
      }
    }
  }

  if (!hasCaloricSeasoning) {
    // Pure main ingredient dish (e.g. boiled sweet potato, steamed rice, milk oats)
    return {
      calories: Math.round(recipe.calories * mainFactor),
      protein: Math.round(recipe.protein * mainFactor * 10) / 10,
      carbs: Math.round(recipe.carbs * mainFactor * 10) / 10,
      fat: Math.round(recipe.fat * mainFactor * 10) / 10,
    };
  }

  // Weight of caloric seasoning relative to meal baseline:
  // Typically contributes 5% - 20% to total dish calories
  const seasoningCalorieShare = Math.min(0.20, Math.max(0.04, totalCaloricSeasGrams / (totalCaloricSeasGrams + 200)));

  // Blended scaling factor:
  // (1 - share) from main ingredients (linear), share from seasoning (sublinear)
  const effectiveCalorieFactor = (1 - seasoningCalorieShare) * mainFactor + seasoningCalorieShare * seasFactor;

  // Protein comes virtually entirely from main ingredients
  const effectiveProteinFactor = mainFactor;

  // Carbs come almost entirely from main ingredients (with slight adjustment if sweet sauce exists)
  const effectiveCarbFactor = (1 - seasoningCalorieShare * 0.25) * mainFactor + (seasoningCalorieShare * 0.25) * seasFactor;

  // Fat comes from both meat/fish and cooking oil
  const effectiveFatFactor = hasOil
    ? 0.5 * mainFactor + 0.5 * seasFactor
    : mainFactor;

  return {
    calories: Math.round(recipe.calories * effectiveCalorieFactor),
    protein: Math.round(recipe.protein * effectiveProteinFactor * 10) / 10,
    carbs: Math.round(recipe.carbs * effectiveCarbFactor * 10) / 10,
    fat: Math.round(recipe.fat * effectiveFatFactor * 10) / 10,
  };
}

/**
 * Returns a cloned recipe with ingredients and nutrition scaled for target servings.
 * Crucial: Does NOT modify the original recipe data.
 */
export function scaleRecipe(recipe: Recipe, targetServings: number): Recipe {
  const baseServings = recipe.servings || 1;
  if (targetServings === baseServings) {
    return recipe;
  }

  const scaledIngredients = recipe.ingredients.map(ing =>
    scaleIngredient(ing, targetServings, baseServings)
  );

  const scaledNutrition = calculateRecipeNutrition(recipe, targetServings);

  return {
    ...recipe,
    servings: targetServings,
    ingredients: scaledIngredients,
    calories: scaledNutrition.calories,
    protein: scaledNutrition.protein,
    carbs: scaledNutrition.carbs,
    fat: scaledNutrition.fat,
    nutritionEstimate: {
      calories: scaledNutrition.calories,
      protein: scaledNutrition.protein,
      carbs: scaledNutrition.carbs,
      fat: scaledNutrition.fat,
    },
  };
}

/**
 * Scales grocery list items proportionally according to target servings
 */
export function scaleGroceryItems(
  items: GroupedGroceryItem[],
  targetServings: number,
  baseServings: number = 1
): GroupedGroceryItem[] {
  if (targetServings === baseServings) return items;
  return items.map(item => {
    const isSeasoning = item.category === '调味料';
    const factor = isSeasoning
      ? getSeasoningScaleFactor(targetServings, baseServings)
      : getMainIngredientScaleFactor(targetServings, baseServings);

    return {
      ...item,
      amount: formatScaledAmount(item.amount * factor),
    };
  });
}

