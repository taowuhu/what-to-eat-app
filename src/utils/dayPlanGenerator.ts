import { Recipe, DayMealPlan, DayMealSlot, MealType, UserProfile, GroupedGroceryItem, GroceryCategory, ProteinSource } from '../types';
import { ALL_RECIPES } from '../data/recipes';
import { calculateMacroTargets } from './nutrition';
import { composeMeal, filterByDislikes, weightedPickByScore } from './mealComposer';
import { isIngredientMatched, auditMealPantryCoverage } from './ingredientMatcher';
import { filterStrictExclusions } from './scoringEngine';

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
  clearFridgeMode: boolean = false
): DayMealSlot {
  const strictPool = filterStrictExclusions(ALL_RECIPES, userProfile.strictlyExclude);
  const cleanPool = filterByDislikes(strictPool, userProfile.dislikes)
    .filter(r => !excludeRecipeIds.includes(r.id));

  const allAvailable = cleanPool.length >= 10 ? cleanPool : strictPool;

  if (type === 'breakfast') {
    // Look for breakfast recipes
    let breakfastRecipes = allAvailable.filter(
      r => r.category === 'breakfast' || r.mealTypes?.includes('breakfast') || r.tags.includes('早餐')
    );
    if (breakfastRecipes.length === 0) {
      breakfastRecipes = strictPool.filter(r => r.tags.includes('早餐') || r.category === 'breakfast');
    }
    if (breakfastRecipes.length === 0) {
      breakfastRecipes = strictPool;
    }

    const chosenRecipe = weightedPickByScore(breakfastRecipes, {
      pantryIngredientIds,
      userProfile,
    }, {
      topRatio: pantryIngredientIds.length > 0 ? 0.35 : 0.5,
      minPool: 3,
      temperature: 0.8,
    }) || strictPool[0] || ALL_RECIPES[0];

    return {
      type: 'breakfast',
      label: '早餐',
      title: chosenRecipe.name,
      timeMinutes: Math.max(5, chosenRecipe.prepTimeMinutes + chosenRecipe.cookTimeMinutes),
      tags: chosenRecipe.tags.slice(0, 3),
      recipes: [chosenRecipe],
      calories: chosenRecipe.calories,
      protein: chosenRecipe.protein,
      carbs: chosenRecipe.carbs,
      fat: chosenRecipe.fat,
      difficulty: chosenRecipe.difficulty,
    };
  }

  // Lunch or Dinner: Use composeMeal for balanced Main + Veg + Staple (+ optional soup for dinner)
  const mealCombo = composeMeal(allAvailable, {
    mealType: type,
    avoidProtein,
    avoidRecipeIds: excludeRecipeIds,
    includeSoup: type === 'dinner' && Math.random() > 0.4 && !clearFridgeMode,
    userProfile,
    pantryIngredientIds,
    clearFridgeMode,
  });

  const main = mealCombo.recipes[0];
  const side = mealCombo.recipes[1];
  const staple = mealCombo.recipes[2];
  const soup = mealCombo.recipes[3];

  const title = soup
    ? `${main.name} + ${side.name} + ${staple.name} + ${soup.name}`
    : `${main.name} + ${side.name} + ${staple.name}`;

  const tags: string[] = [];
  if (type === 'lunch') {
    tags.push('午间充能');
  } else {
    tags.push('晚间轻负担');
  }
  if (mealCombo.totalProtein >= 30) tags.push('高蛋白');
  if (mealCombo.estimatedTimeMinutes <= 20) tags.push('快手');
  tags.push('荤素搭配');

  return {
    type,
    label: type === 'lunch' ? '午餐' : '晚餐',
    title,
    timeMinutes: mealCombo.estimatedTimeMinutes,
    tags: tags.slice(0, 3),
    recipes: mealCombo.recipes,
    calories: mealCombo.totalCalories,
    protein: mealCombo.totalProtein,
    carbs: mealCombo.totalCarbs,
    fat: mealCombo.totalFat,
    difficulty: mealCombo.difficulty || '小白友好',
  };
}

/**
 * Generate a complete DayMealPlan for user based on targets and preferences
 */
export function generateDayMealPlan(
  userProfile: UserProfile,
  pantryIngredientIds: string[] = [],
  clearFridgeMode: boolean = false
): DayMealPlan {
  const targets = calculateMacroTargets(userProfile);
  const todayDate = new Date().toISOString().split('T')[0];

  // 1. Breakfast
  const breakfast = generateMealSlot('breakfast', userProfile, [], undefined, pantryIngredientIds, clearFridgeMode);
  const breakfastIds = breakfast.recipes.map(r => r.id);

  // 2. Lunch
  const lunch = generateMealSlot('lunch', userProfile, breakfastIds, undefined, pantryIngredientIds, clearFridgeMode);
  const lunchMain = lunch.recipes[0];
  const lunchProtein = lunchMain?.proteinSource;

  // 3. Dinner (avoid repeating main dishes or same protein from lunch)
  const usedIds = [...breakfastIds, ...lunch.recipes.map(r => r.id)];
  const dinner = generateMealSlot('dinner', userProfile, usedIds, lunchProtein, pantryIngredientIds, clearFridgeMode);

  const totalCal = breakfast.calories + lunch.calories + dinner.calories;
  const totalProt = Math.round((breakfast.protein + lunch.protein + dinner.protein) * 10) / 10;
  const totalCarb = Math.round((breakfast.carbs + lunch.carbs + dinner.carbs) * 10) / 10;
  const totalF = Math.round((breakfast.fat + lunch.fat + dinner.fat) * 10) / 10;

  // Calculate day-wide pantry coverage
  let pantryCoverageInfo: DayMealPlan['pantryCoverage'] = undefined;
  if (pantryIngredientIds.length > 0) {
    const allRecipes = [...breakfast.recipes, ...lunch.recipes, ...dinner.recipes];
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
    breakfast,
    lunch,
    dinner,
    pantryCoverage: pantryCoverageInfo,
  };
}

export const generateDayPlan = generateDayMealPlan;

/**
 * Categorize ingredients into four easy shopping sections: 肉蛋奶, 蔬菜, 主食, 调味料
 */
export function buildDayGroceryList(
  plan: DayMealPlan,
  pantryIngredientIds: string[] = []
): Record<GroceryCategory, GroupedGroceryItem[]> {
  const allRecipes = [
    ...plan.breakfast.recipes,
    ...plan.lunch.recipes,
    ...plan.dinner.recipes,
  ];

  const map = new Map<string, { name: string; amount: number; unit: string; category: GroceryCategory; sourceDishes: string[]; isInPantry: boolean }>();

  for (const recipe of allRecipes) {
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

      const existing = map.get(ing.name);
      if (existing) {
        existing.amount += ing.amount;
        if (!existing.sourceDishes.includes(recipe.name)) {
          existing.sourceDishes.push(recipe.name);
        }
      } else {
        map.set(ing.name, {
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: cat,
          sourceDishes: [recipe.name],
          isInPantry: inPantry,
        });
      }
    }
  }

  const result: Record<GroceryCategory, GroupedGroceryItem[]> = {
    '肉蛋奶': [],
    '蔬菜': [],
    '主食': [],
    '调味料': [],
  };

  for (const item of map.values()) {
    result[item.category].push({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      sourceDishes: item.sourceDishes,
      isInPantry: item.isInPantry,
    });
  }

  return result;
}
