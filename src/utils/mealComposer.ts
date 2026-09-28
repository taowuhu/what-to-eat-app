import {
  Recipe,
  Meal,
  MealCombo,
  MealType,
  MealComplexity,
  ProteinSource,
  UserProfile,
  RecipeDifficulty,
  CookingFeedback,
  RecommendationFeedback,
} from '../types';
import { getRecipeById, ALL_RECIPES } from '../data/recipes';
import { isIngredientMatched, auditMealPantryCoverage } from './ingredientMatcher';
import { calculateRecipePantryScore } from './pantryScorer';
import {
  filterStrictExclusions,
  calculateRecipeScore,
  ScoringContext,
} from './scoringEngine';
import {
  validateMealNutrition,
  getMealMacroTarget,
  calculateMacroTargets,
  DEFAULT_USER_PROFILE,
  isStapleComponent,
} from './nutrition';
import { tuneRecipeNutritionalPortions } from './servingsScaler';
export { calculateRecipePantryScore };

export interface MealCompositionOptions {
  mealType?: MealType;
  preferredProtein?: ProteinSource;
  avoidProtein?: ProteinSource;
  avoidRecipeIds?: string[];
  activeFilters?: string[];
  includeSoup?: boolean;
  targetCalories?: number;
  userProfile?: UserProfile;
  pantryIngredientIds?: string[];
  clearFridgeMode?: boolean;
  favoriteRecipeIds?: string[];
  cookingFeedbacks?: CookingFeedback[];
  recommendationFeedbacks?: RecommendationFeedback[];
  temporaryPreferences?: {
    noMeatToday?: boolean;
    preferLight?: boolean;
    tooTroublesome?: boolean;
  };
  servings?: number;
}

/**
 * Checks if two recipes have conflicting main ingredients
 * (e.g. Both have tomato, both have eggs, both are potato-heavy)
 */
function hasIngredientConflict(a: Recipe, b: Recipe): boolean {
  // Check common primary ingredients
  const dominantKeywords = ['番茄', '西红柿', '鸡蛋', '土豆', '胡萝卜', '西兰花', '豆腐', '黄瓜', '洋葱'];
  for (const kw of dominantKeywords) {
    const aHas = a.name.includes(kw) || a.ingredients.some(i => i.name.includes(kw));
    const bHas = b.name.includes(kw) || b.ingredients.some(i => i.name.includes(kw));
    if (aHas && bHas) return true;
  }
  return false;
}

/**
 * Checks if a recipe is a staple or contains main grain staples
 */
export function isTrueStapleRecipe(r: Recipe): boolean {
  if (r.category === 'staple') return true;
  if (r.tags?.some(t => ['焖饭', '炒饭', '盖饭', '炒面', '汤面', '拌面'].includes(t))) return true;
  if (['焖饭', '炒饭', '盖饭', '炒面', '汤面', '拌面', '乌冬'].some(kw => r.name.includes(kw))) return true;
  return Boolean(r.ingredients?.some(i => i.category === '粮谷主食' && !i.name.includes('淀粉') && !i.name.includes('生粉')));
}

/**
 * Checks if a recipe is a pure staple without significant protein
 */
export function isPureStapleRecipe(r: Recipe): boolean {
  if (r.category !== 'staple') return false;
  if (['白米饭', '杂粮饭', '糙米饭', '白粥', '胚芽米饭', '红薯黄金饭'].some(kw => r.name.includes(kw))) return true;
  return !r.proteinSource || r.proteinSource === 'none';
}

/**
 * Checks if a recipe is a true vegetable dish (vegetable/side and non-meat/egg)
 * Must NOT be a staple, breakfast grain, or soup.
 */
export function isTrueVegetableRecipe(r: Recipe): boolean {
  if (r.category === 'staple' || r.category === 'soup' || r.category === 'breakfast') return false;
  if (isTrueStapleRecipe(r)) return false;
  if (r.proteinSource && r.proteinSource !== 'none') return false;
  if (r.category === 'vegetable') return true;
  if (r.category === 'side') return true;
  return Boolean(r.ingredients?.some(i => i.category === '蔬菜菌菇'));
}

/**
 * Checks if a recipe provides meaningful protein
 */
export function isTrueProteinRecipe(r: Recipe): boolean {
  if (r.category === 'staple' && (!r.proteinSource || r.proteinSource === 'none')) return false;
  if (r.proteinSource && r.proteinSource !== 'none') return true;
  if (r.protein >= 15) return true;
  return Boolean(r.ingredients?.some(i => i.category === '肉禽蛋' || i.category === '豆制品水产'));
}

/**
 * Checks if a recipe is a complete integrated meal in ONE dish:
 * Contains Protein + Vegetable + Staple (e.g. 焖饭、炒饭、盖饭、面食)
 * For lunch and dinner: must not be a breakfast-only light dish and must meet minimum protein & calorie thresholds.
 */
export function isTrueIntegratedMealRecipe(r: Recipe, mealType?: MealType): boolean {
  if (r.category === 'soup') return false;
  if (isPureStapleRecipe(r)) return false;
  if (mealType && (mealType === 'lunch' || mealType === 'dinner')) {
    if (r.mealTypes && !r.mealTypes.includes(mealType) && !r.mealTypes.includes('lunch') && !r.mealTypes.includes('dinner')) {
      return false;
    }
    if (r.category === 'breakfast') return false;
    if (r.protein < 16) return false;
    if (r.calories < 300) return false;
  }
  const hasStap = isTrueStapleRecipe(r);
  const hasProt = isTrueProteinRecipe(r);
  const hasVeg = Boolean(r.ingredients?.some(i => i.category === '蔬菜菌菇'));
  return hasStap && hasProt && hasVeg;
}

export interface MealAuditResult {
  hasProtein: boolean;
  hasVegetable: boolean;
  hasStaple: boolean;
  isComplete: boolean;
  isIntegrated: boolean;
  isWhiteRiceAlone: boolean;
  isSingleProteinAlone: boolean;
  issues: string[];
}

/**
 * Audits a combination of recipes for nutritional completeness.
 * For lunch and dinner:
 * hasProtein = true
 * hasVegetable = true
 * hasStaple = true
 * Single plain rice or single protein without veg/staple are forbidden.
 */
export function auditMealCompleteness(recipes: Recipe[], mealType: MealType = 'lunch'): MealAuditResult {
  const val = validateMealNutrition(recipes, mealType);
  const isSingle = recipes.length === 1;
  const singleDish = recipes[0];
  const isIntegrated = isSingle && isTrueIntegratedMealRecipe(singleDish, mealType);

  const isWhiteRiceAlone = isSingle && (
    singleDish.name.includes('白米饭') ||
    singleDish.name.includes('米饭') ||
    isPureStapleRecipe(singleDish)
  );
  const isSingleProteinAlone = isSingle && isTrueProteinRecipe(singleDish) && (!val.hasVegetableOrFruit || !val.hasCarbSource);

  return {
    hasProtein: val.hasProteinSource,
    hasVegetable: val.hasVegetableOrFruit,
    hasStaple: val.hasCarbSource,
    isComplete: val.isComplete,
    isIntegrated,
    isWhiteRiceAlone,
    isSingleProteinAlone,
    issues: val.issues,
  };
}

/**
 * Modern Fisher-Yates array shuffle helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Weighted random candidate pick by scoring engine output.
 * Avoids rigid top-3/top-4 lock-in while preserving scoring preferences.
 * Includes pre-shuffle to eliminate bias on score ties.
 */
export function weightedPickByScore(
  candidates: Recipe[],
  scoringContext: ScoringContext,
  options?: {
    topRatio?: number;
    minPool?: number;
    temperature?: number;
  }
): Recipe {
  if (candidates.length === 0) {
    return ALL_RECIPES[0];
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  const minPool = options?.minPool ?? 4;
  const topRatio = options?.topRatio ?? 0.35;
  const temperature = options?.temperature ?? 0.8;

  // 1. Calculate scores and pre-shuffle to prevent insertion-order bias on ties
  const shuffled = shuffleArray(candidates);
  const scored = shuffled.map(r => ({
    recipe: r,
    score: calculateRecipeScore(r, scoringContext),
  }));

  // 2. Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // 3. Select elite pool based on ratio and minimum threshold
  const poolSize = Math.max(minPool, Math.ceil(scored.length * topRatio));
  const pool = scored.slice(0, Math.min(scored.length, poolSize));

  // 4. Softmax / exponential weighting
  const minScore = pool[pool.length - 1].score;
  const weights = pool.map(item => {
    const diff = (item.score - minScore) / 25;
    return Math.exp(diff * temperature);
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let randomVal = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    randomVal -= weights[i];
    if (randomVal <= 0) {
      return pool[i].recipe;
    }
  }

  return pool[0].recipe;
}

/**
 * Filter out user dislikes / strict exclusions from recipe list
 */
export function filterByDislikes(recipes: Recipe[], dislikes: string[] = []): Recipe[] {
  if (!dislikes || dislikes.length === 0) return recipes;
  return filterStrictExclusions(recipes, dislikes);
}

/**
 * Composes a balanced breakfast adhering to V0.4.7 Meal Nutrition Guardrails.
 * 
 * Breakfast composition principles:
 * - Must contain Staple + Protein + Fat + [optional Milk/Soy / Fruit].
 * - Single isolated components (e.g. only 馒头, only 鸡蛋, only 牛奶, only 白粥) are strictly forbidden.
 * - When a component is chosen (e.g. 馒头), automatically complement with missing parts (e.g. 鸡蛋 + 牛奶).
 * - Guaranteed validateMealNutrition(recipes, 'breakfast').isComplete === true.
 */
export function composeBreakfastMeal(
  availablePool: Recipe[],
  options: MealCompositionOptions = {},
  scoringContext: ScoringContext,
  safePool: Recipe[]
): MealCombo {
  const {
    avoidRecipeIds = [],
    activeFilters = [],
    userProfile,
    pantryIngredientIds = [],
    clearFridgeMode = false,
    favoriteRecipeIds = [],
    servings = 1,
  } = options;

  const isLazyMode = activeFilters.includes('lazy_mode');
  const hasPantry = pantryIngredientIds.length > 0;

  // Filter pool for breakfast recipes
  const breakfastPool = availablePool.filter(r =>
    (r.mealTypes?.includes('breakfast') || r.category === 'breakfast' || r.id.startsWith('bk_') || r.id.startsWith('cmp_') || r.tags?.includes('早餐')) &&
    !avoidRecipeIds.includes(r.id)
  );
  const pool = breakfastPool.length >= 3 ? breakfastPool : safePool.filter(r =>
    r.mealTypes?.includes('breakfast') || r.category === 'breakfast' || r.id.startsWith('bk_') || r.id.startsWith('cmp_')
  );

  // Categorize breakfast items
  // 1. Complete breakfast recipes (e.g., 三明治、牛奶燕麦粥配水煮蛋、小馄饨、瘦肉粥、汤面)
  const completeBreakfasts = pool.filter(r => validateMealNutrition([r], 'breakfast', userProfile).isComplete);

  // 2. Staple components (馒头、南瓜粥、全麦吐司、燕麦、甜玉米) - excluding complete breakfasts that already contain meat/eggs
  const stapleComponents = pool.filter(r =>
    !completeBreakfasts.some(c => c.id === r.id) &&
    (
      r.category === 'staple' ||
      r.tags?.some(t => ['粗粮主食', '面食', '主食'].includes(t)) ||
      r.name.includes('馒头') || r.name.includes('吐司') || r.name.includes('粥') || r.name.includes('玉米')
    )
  );

  // 3. Simple standalone protein components (水煮蛋、蒸蛋、煎蛋、鸡胸肉条、希腊酸奶)
  const proteinComponents = pool.filter(r =>
    (r.id.startsWith('cmp_') && (r.name.includes('蛋') || r.name.includes('鸡') || r.name.includes('酸奶'))) ||
    r.id === 'rc_steamed_egg' ||
    (r.category !== 'staple' && !r.name.includes('面') && !r.name.includes('饭') && !r.name.includes('粥') && !r.name.includes('馄饨') && (r.proteinSource && r.proteinSource !== 'none'))
  );

  // 4. Drink & Fruit components (牛奶、豆浆、香蕉、圣女果)
  const drinkFruitComponents = pool.filter(r =>
    r.id.startsWith('cmp_') && (r.name.includes('奶') || r.name.includes('豆浆') || r.name.includes('香蕉') || r.name.includes('圣女果'))
  );

  // Reliable fallback components
  const boiledEgg = safePool.find(r => r.id === 'cmp_boiled_egg') || safePool.find(r => r.name.includes('水煮蛋')) || safePool.find(r => r.id === 'rc_steamed_egg')!;
  const panFriedEgg = safePool.find(r => r.id === 'cmp_pan_fried_egg') || boiledEgg;
  const warmMilk = safePool.find(r => r.id === 'cmp_warm_milk') || safePool.find(r => r.id === 'cmp_warm_soymilk')!;
  const greekYogurt = safePool.find(r => r.id === 'cmp_plain_greek_yogurt') || warmMilk;
  const wholeWheatMantou = safePool.find(r => r.id === 'st_whole_wheat_mantou') || safePool.find(r => r.id === 'cmp_whole_wheat_toast')!;
  const freshFruit = safePool.find(r => r.id === 'cmp_fresh_banana') || safePool.find(r => r.id === 'cmp_cherry_tomatoes')!;

  // Target macro partitioning for breakfast
  const dailyTarget = userProfile
    ? calculateMacroTargets(userProfile)
    : calculateMacroTargets(DEFAULT_USER_PROFILE);
  const mealTarget = getMealMacroTarget(dailyTarget, 'breakfast');

  let selectedRecipes: Recipe[] = [];

  // Decide whether to serve a Complete Integrated Breakfast or an Assembled Component Combo
  const preferCombo = Math.random() < 0.6 || completeBreakfasts.length === 0;

  if (!preferCombo && completeBreakfasts.length > 0) {
    const mainBreakfast = weightedPickByScore(completeBreakfasts, scoringContext, { topRatio: 0.4, temperature: 0.85 });
    selectedRecipes = [mainBreakfast];

    const alreadyHasDairy = mainBreakfast.name.includes('奶') || mainBreakfast.name.includes('豆浆') ||
      Boolean(mainBreakfast.ingredients?.some(i => i.name.includes('奶') || i.name.includes('豆浆')));

    if (mainBreakfast.protein < mealTarget.protein.min || mainBreakfast.calories < mealTarget.calories.min) {
      if (!alreadyHasDairy && warmMilk) {
        selectedRecipes.push(warmMilk);
      } else if (freshFruit) {
        selectedRecipes.push(freshFruit);
      }
    } else if (freshFruit) {
      selectedRecipes.push(freshFruit);
    }
  } else {
    const stapleCand = stapleComponents.length > 0
      ? weightedPickByScore(stapleComponents, scoringContext, { topRatio: 0.5, temperature: 0.8 })
      : wholeWheatMantou;

    // Check if the chosen staple already contains significant protein (e.g., seafood/meat congee, wonton, noodle)
    const stapleAlreadyHasProtein = Boolean(
      (stapleCand.proteinSource && stapleCand.proteinSource !== 'none') ||
      (stapleCand.protein && stapleCand.protein >= 11)
    );

    // Pick standalone protein dish ONLY if staple doesn't already provide protein
    let protCand: Recipe | undefined;
    if (!stapleAlreadyHasProtein) {
      protCand = proteinComponents.length > 0
        ? weightedPickByScore(proteinComponents, scoringContext, { topRatio: 0.5, temperature: 0.8 })
        : boiledEgg;
    }

    // Drinks and fruits:
    // If we already have protCand or stapleAlreadyHasProtein, pair with fresh fruit to avoid duplicate protein
    let drinkFruitCand: Recipe | undefined;
    if (protCand || stapleAlreadyHasProtein) {
      drinkFruitCand = freshFruit || warmMilk;
    } else {
      drinkFruitCand = warmMilk || freshFruit;
    }

    selectedRecipes = [stapleCand, protCand, drinkFruitCand].filter(Boolean) as Recipe[];
  }

  // Deduplicate and filter out redundant duplicate staples early
  const seenIdsEarly = new Set<string>();
  let uniqueSelectedEarly: Recipe[] = [];
  let foundStaple = false;
  for (const r of selectedRecipes) {
    if (!r || seenIdsEarly.has(r.id)) continue;
    if (isStapleComponent(r)) {
      if (foundStaple) continue; // Skip secondary staple to prevent carb stacking
      foundStaple = true;
    }
    seenIdsEarly.add(r.id);
    uniqueSelectedEarly.push(r);
  }
  selectedRecipes = uniqueSelectedEarly;

  // Failsafe validation & auto-repair loop (Layer 1: Structural Completeness)
  let validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
  if (!validation.isComplete) {
    if (!validation.hasProteinSource && boiledEgg && !selectedRecipes.some(r => r.id === boiledEgg.id)) {
      selectedRecipes.push(boiledEgg);
    }
    if (!validation.hasCarbSource && wholeWheatMantou && !selectedRecipes.some(r => isStapleComponent(r))) {
      selectedRecipes.unshift(wholeWheatMantou);
    }
    if (!validation.hasFatSource) {
      if (!selectedRecipes.some(r => r.name.includes('蛋') || (r.proteinSource && r.proteinSource !== 'none'))) {
        if (panFriedEgg) selectedRecipes.push(panFriedEgg);
      } else if (selectedRecipes[0]) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], { fatMultiplier: 1.35 });
      }
    }
    // Prevent single item
    if (selectedRecipes.length === 1) {
      const single = selectedRecipes[0];
      if (isStapleComponent(single)) {
        selectedRecipes = [single, boiledEgg, freshFruit || warmMilk].filter(Boolean) as Recipe[];
      } else {
        selectedRecipes = [wholeWheatMantou, single, freshFruit || warmMilk].filter(Boolean) as Recipe[];
      }
    }
    validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
  }

  // Layer 2: Macro Adequacy Repair Loop (Bidirectional & Component Redundancy Cleanup)
  // Check component redundancies: strictly prevent multiple protein dishes (e.g. egg + chicken breast, or egg + milk)
  const isProteinSourceRecipe = (r: Recipe) =>
    (r.id.startsWith('cmp_') && (r.name.includes('蛋') || r.name.includes('鸡') || r.name.includes('酸奶') || r.name.includes('奶') || r.name.includes('豆浆'))) ||
    r.id === 'rc_steamed_egg' ||
    (r.proteinSource && r.proteinSource !== 'none' && !isPureStapleRecipe(r));

  let protItems = selectedRecipes.filter(isProteinSourceRecipe);
  while (protItems.length > 1) {
    // Drop the redundant protein component to avoid over-target protein stacking
    const dropCandidate = protItems[protItems.length - 1];
    const candidateList = selectedRecipes.filter(r => r.id !== dropCandidate.id);
    const testVal = validateMealNutrition(candidateList, 'breakfast', userProfile);
    if (testVal.proteinAmount >= mealTarget.protein.min * 0.85) {
      selectedRecipes = candidateList;
      protItems = selectedRecipes.filter(isProteinSourceRecipe);
      validation = testVal;
    } else {
      break;
    }
  }

  // Prioritize adjusting existing ingredient portions (Bidirectional protein tuning)
  if (validation.proteinAmount > mealTarget.protein.max || validation.macroAdequacy?.proteinStatus === 'high') {
    const mainProtIdx = selectedRecipes.findIndex(r => isProteinSourceRecipe(r));
    if (mainProtIdx >= 0) {
      const currentP = selectedRecipes[mainProtIdx].protein || 1;
      const excess = validation.proteinAmount - mealTarget.protein.preferred;
      const desiredP = Math.max(5, currentP - excess);
      const ratio = Math.max(0.55, Math.min(0.92, desiredP / currentP));
      selectedRecipes[mainProtIdx] = tuneRecipeNutritionalPortions(selectedRecipes[mainProtIdx], {
        proteinMultiplier: ratio,
      });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  } else if (validation.proteinAmount < mealTarget.protein.min) {
    // If protein is low, first tune up existing protein dish or staple before adding extra recipes
    const mainProtIdx = selectedRecipes.findIndex(r => isProteinSourceRecipe(r));
    if (mainProtIdx >= 0) {
      const currentP = selectedRecipes[mainProtIdx].protein || 1;
      const deficit = mealTarget.protein.preferred - validation.proteinAmount;
      const desiredP = currentP + deficit;
      const ratio = Math.min(1.45, desiredP / currentP);
      selectedRecipes[mainProtIdx] = tuneRecipeNutritionalPortions(selectedRecipes[mainProtIdx], {
        proteinMultiplier: ratio,
      });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    } else if (boiledEgg) {
      selectedRecipes.push(boiledEgg);
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  }

  // Carbs bidirectional tuning
  if (validation.carbAmount < mealTarget.carbs.min) {
    const stapleIdx = selectedRecipes.findIndex(r => isStapleComponent(r));
    if (stapleIdx >= 0) {
      selectedRecipes[stapleIdx] = tuneRecipeNutritionalPortions(selectedRecipes[stapleIdx], {
        carbMultiplier: 1.35,
      });
    } else if (wholeWheatMantou) {
      selectedRecipes.unshift(wholeWheatMantou);
    }
    validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
  } else if (validation.macroAdequacy?.carbsStatus === 'high') {
    const stapleIdx = selectedRecipes.findIndex(r => isStapleComponent(r));
    if (stapleIdx >= 0) {
      selectedRecipes[stapleIdx] = tuneRecipeNutritionalPortions(selectedRecipes[stapleIdx], {
        carbMultiplier: 0.8,
      });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  }

  // Fat bidirectional tuning: tune existing portion rather than adding new dishes
  if (validation.fatAmount < mealTarget.fat.min) {
    const eggIdx = selectedRecipes.findIndex(r => r.id === boiledEgg.id);
    if (eggIdx >= 0 && panFriedEgg) {
      selectedRecipes[eggIdx] = panFriedEgg;
    } else if (selectedRecipes[0]) {
      selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], { fatMultiplier: 1.25 });
    }
    validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
  } else if (validation.macroAdequacy?.fatStatus === 'high') {
    // If fat is high, swap pan-fried egg to boiled egg or reduce fat multiplier
    const panFriedIdx = selectedRecipes.findIndex(r => r.id === panFriedEgg?.id);
    if (panFriedIdx >= 0 && boiledEgg) {
      selectedRecipes[panFriedIdx] = boiledEgg;
    } else if (selectedRecipes[0]) {
      selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], { fatMultiplier: 0.75 });
    }
    validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
  }

  // Final deduplication & clean-up: strictly single staple and single protein component
  const seenIds = new Set<string>();
  const uniqueSelected: Recipe[] = [];
  let keptOneStaple = false;
  let keptOneProtein = false;
  for (const r of selectedRecipes) {
    if (!r || seenIds.has(r.id)) continue;
    if (isStapleComponent(r)) {
      if (keptOneStaple) continue;
      keptOneStaple = true;
    }
    if (isProteinSourceRecipe(r)) {
      if (keptOneProtein) continue; // Guarantee NO duplicate protein component stacking
      keptOneProtein = true;
    }
    seenIds.add(r.id);
    uniqueSelected.push(r);
  }
  selectedRecipes = uniqueSelected;

  // Final re-validation with final recipe set
  validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);

  // Exact target-fit tuning: calibrate portion of existing dishes to land within target ranges
  const finalProtIdx = selectedRecipes.findIndex(r => isProteinSourceRecipe(r));
  if (finalProtIdx >= 0) {
    const curP = validation.proteinAmount;
    if (curP > mealTarget.protein.max || curP < mealTarget.protein.min) {
      const dishP = selectedRecipes[finalProtIdx].protein || 1;
      const otherP = curP - dishP;
      const desiredDishP = Math.max(8, mealTarget.protein.preferred - otherP);
      const ratio = Math.max(0.55, Math.min(1.4, desiredDishP / dishP));
      selectedRecipes[finalProtIdx] = tuneRecipeNutritionalPortions(selectedRecipes[finalProtIdx], {
        proteinMultiplier: ratio,
      });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  }

  const finalStapleIdx = selectedRecipes.findIndex(r => isStapleComponent(r));
  if (finalStapleIdx >= 0) {
    const curC = validation.carbAmount;
    if (curC > mealTarget.carbs.max || curC < mealTarget.carbs.min) {
      const dishC = selectedRecipes[finalStapleIdx].carbs || 1;
      const otherC = curC - dishC;
      const desiredDishC = Math.max(20, mealTarget.carbs.preferred - otherC);
      const ratio = Math.max(0.65, Math.min(1.4, desiredDishC / dishC));
      selectedRecipes[finalStapleIdx] = tuneRecipeNutritionalPortions(selectedRecipes[finalStapleIdx], {
        carbMultiplier: ratio,
      });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  }

  if (validation.fatAmount < mealTarget.fat.min) {
    const fRatio = Math.min(1.4, mealTarget.fat.preferred / Math.max(1, validation.fatAmount));
    if (selectedRecipes[0]) {
      selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], { fatMultiplier: fRatio });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  } else if (validation.fatAmount > mealTarget.fat.max) {
    const fRatio = Math.max(0.65, mealTarget.fat.preferred / Math.max(1, validation.fatAmount));
    if (selectedRecipes[0]) {
      selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], { fatMultiplier: fRatio });
      validation = validateMealNutrition(selectedRecipes, 'breakfast', userProfile);
    }
  }

  // Aggregate macros
  const totalCalories = selectedRecipes.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = Math.round(selectedRecipes.reduce((sum, r) => sum + r.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(selectedRecipes.reduce((sum, r) => sum + r.carbs, 0) * 10) / 10;
  const totalFat = Math.round(selectedRecipes.reduce((sum, r) => sum + r.fat, 0) * 10) / 10;

  const activeTimeMinutes = Math.min(15, Math.max(...selectedRecipes.map(r => r.activeTimeMinutes || 5)));
  const passiveTimeMinutes = Math.max(...selectedRecipes.map(r => r.passiveTimeMinutes || 0));
  const totalTimeMinutes = activeTimeMinutes + passiveTimeMinutes;
  const estimatedTimeMinutes = Math.min(20, Math.max(5, activeTimeMinutes + Math.round(passiveTimeMinutes * 0.5)));
  const cookwareCount = selectedRecipes.length === 1 ? 1 : 2;

  // Combo title & motto
  const dishNames = selectedRecipes.map(r => r.name);
  let comboTitle = '';
  if (selectedRecipes.length > 1) {
    comboTitle = `元气晨食 · ${selectedRecipes.slice(0, 2).map(r => r.name.replace('经典', '').replace('热腾腾', '').replace('营养', '')).join('配')}`;
  } else {
    comboTitle = `活力营养早餐 · ${selectedRecipes[0].name}`;
  }

  const motto = dishNames.join(' + ');
  const reason = `早餐碳水、优质蛋白与乳品均衡搭配，热量约 ${totalCalories} kcal，提供 ${totalProtein}g 蛋白，晨起活力充沛。`;

  const tags = ['营养早餐', '蛋白充足'];
  if (activeTimeMinutes <= 10) tags.push(`快手${activeTimeMinutes}分`);
  if (isLazyMode) tags.push('懒人免繁琐');
  if (totalProtein >= 20) tags.push('高蛋白');

  // Audit pantry coverage
  const pantryAudit = hasPantry
    ? auditMealPantryCoverage(selectedRecipes, pantryIngredientIds, clearFridgeMode)
    : undefined;

  return {
    id: `combo_bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    comboTitle,
    motto,
    recipes: selectedRecipes,
    recipeIds: selectedRecipes.map(r => r.id),
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    estimatedTimeMinutes,
    complexity: selectedRecipes.length === 1 ? 'simple' : 'standard',
    activeTimeMinutes,
    passiveTimeMinutes,
    totalTimeMinutes,
    isLazy: isLazyMode || activeTimeMinutes <= 8,
    cookwareCount,
    ingredientCount: new Set(
      selectedRecipes.flatMap(r => r.ingredients.filter(i => i.category !== '调料辅料').map(i => i.name))
    ).size,
    difficulty: '小白友好',
    servingSize: `${servings}人份`,
    tags,
    recommendationReason: reason,
    nutritionValidation: validation,
    pantryCoverage: pantryAudit
      ? {
          totalCount: pantryAudit.totalCount,
          matchedCount: pantryAudit.matchedCount,
          missingCount: pantryAudit.missingCount,
          coverageRate: pantryAudit.coverageRate,
          matchedIngredients: pantryAudit.matchedIngredients.map(m => ({
            name: m.ingredient.name,
            amount: m.ingredient.amount,
            unit: m.ingredient.unit,
            category: m.ingredient.category,
          })),
          missingIngredients: pantryAudit.missingIngredients.map(m => ({
            name: m.ingredient.name,
            amount: m.ingredient.amount,
            unit: m.ingredient.unit,
            category: m.ingredient.category,
          })),
          matchedCanonicalNames: pantryAudit.matchedCanonicalNames,
          missingCanonicalNames: pantryAudit.missingCanonicalNames,
        }
      : undefined,
  };
}

/**
 * Composes a balanced Chinese home-style meal following nutritional rules:
 * 1 Main Dish + 1 Vegetable + 1 Staple + [Optional Soup]
 */
export function composeMeal(
  availablePool: Recipe[],
  options: MealCompositionOptions = {}
): MealCombo {
  const {
    mealType = 'lunch',
    preferredProtein,
    avoidProtein,
    avoidRecipeIds = [],
    activeFilters = [],
    includeSoup: forceSoup,
    userProfile,
    pantryIngredientIds = [],
    clearFridgeMode = false,
    favoriteRecipeIds = [],
    cookingFeedbacks = [],
    recommendationFeedbacks = [],
    temporaryPreferences,
    servings = 1,
  } = options;

  const hasPantry = pantryIngredientIds.length > 0;

  // 0. Build scoring context
  const scoringContext: ScoringContext = {
    userProfile,
    favoriteRecipeIds,
    cookingFeedbacks,
    recommendationFeedbacks,
    pantryIngredientIds,
    clearFridgeMode,
    activeFilters,
    temporaryPreferences,
    historyRecipeIds: avoidRecipeIds,
  };

  // 1. Separate pools by categories (applying strict exclusions first)
  const strictlyFiltered = filterStrictExclusions(availablePool, userProfile?.strictlyExclude);
  const pool = strictlyFiltered.filter(r => {
    if (avoidRecipeIds.includes(r.id)) return false;
    if (mealType && (mealType === 'lunch' || mealType === 'dinner')) {
      if (r.mealTypes && r.mealTypes.length === 1 && r.mealTypes[0] === 'breakfast') return false;
      if (r.category === 'breakfast' && !r.mealTypes?.includes(mealType)) return false;
    }
    return true;
  });

  const safePool = filterStrictExclusions(ALL_RECIPES, userProfile?.strictlyExclude).filter(r => {
    if (mealType && (mealType === 'lunch' || mealType === 'dinner')) {
      if (r.mealTypes && r.mealTypes.length === 1 && r.mealTypes[0] === 'breakfast') return false;
      if (r.category === 'breakfast' && !r.mealTypes?.includes(mealType)) return false;
    }
    return true;
  });

  // 1.1 Breakfast Specialized Composition Route
  if (mealType === 'breakfast') {
    return composeBreakfastMeal(availablePool, options, scoringContext, safePool);
  }

  // Pool categorization:
  // Integrated meals: single-dish complete meals with Protein + Vegetable + Staple (e.g. 焖饭、炒饭、盖饭、面食)
  const integratedPool = pool.filter(r => isTrueIntegratedMealRecipe(r, mealType));
  const safeIntegrated = integratedPool.length > 0 ? integratedPool : safePool.filter(r => isTrueIntegratedMealRecipe(r, mealType));

  // Pure mains: dishes eaten WITH rice/staple (e.g. 经典青椒肉丝, 爽脆青椒爆炒鸡丁, 开胃番茄巴沙鱼柳片, 西红柿炒鸡蛋)
  const pureMains = pool.filter(r => r.category === 'main' && !isTrueIntegratedMealRecipe(r, mealType));
  const safeMains = pureMains.length > 0 ? pureMains : safePool.filter(r => r.category === 'main' && !isTrueIntegratedMealRecipe(r, mealType));

  // Pure vegetables: dishes that are vegetables and NOT meat/eggs (eliminates steamed egg as a vegetable)
  const pureVegs = pool.filter(r => isTrueVegetableRecipe(r) && (!r.proteinSource || r.proteinSource === 'none'));
  const safeVegs = pureVegs.length > 0 ? pureVegs : safePool.filter(r => isTrueVegetableRecipe(r) && (!r.proteinSource || r.proteinSource === 'none'));

  // Pure staples: staples to accompany multi-dish meals (e.g. 白米饭、杂粮饭)
  const pureStaples = pool.filter(r => r.category === 'staple' && !isTrueIntegratedMealRecipe(r, mealType));
  const safeStaples = pureStaples.length > 0 ? pureStaples : safePool.filter(r => r.category === 'staple' && !isTrueIntegratedMealRecipe(r, mealType));

  const safeSoups = safePool.filter(r => r.category === 'soup');

  // 2. Determine Meal Complexity
  const isLazyMode = activeFilters.includes('lazy_mode');
  const isSinglePersonFilter = activeFilters.includes('single_person');
  const is15Min = activeFilters.includes('15min');
  const isTooTroublesome = temporaryPreferences?.tooTroublesome;

  // Personalized macro targets for this meal
  const dailyTarget = userProfile
    ? calculateMacroTargets(userProfile)
    : calculateMacroTargets(DEFAULT_USER_PROFILE);
  const mealTarget = getMealMacroTarget(dailyTarget, mealType);

  let complexity: MealComplexity;
  if (isLazyMode) {
    // Lazy mode strictly preserves single-cookware simplicity (1-pot / rice cooker)
    complexity = 'simple';
  } else if (servings === 1) {
    if (is15Min || isTooTroublesome) {
      complexity = Math.random() < 0.85 ? 'simple' : 'standard';
    } else if (isSinglePersonFilter) {
      complexity = Math.random() < 0.72 ? 'simple' : 'standard';
    } else {
      complexity = Math.random() < 0.62 ? 'simple' : 'standard';
    }
  } else if (servings === 2) {
    const rand = Math.random();
    if (rand < 0.25) complexity = 'simple';
    else if (rand < 0.95) complexity = 'standard';
    else complexity = 'rich';
  } else {
    // 3~4 people
    complexity = Math.random() < 0.55 ? 'rich' : 'standard';
  }

  let selectedRecipes: Recipe[] = [];

  if (complexity === 'simple') {
    // =========================================================================
    // 1. Simple (极简一餐): 1道完整一锅出/焖饭/炒面/盖饭 (必须包含肉蛋+菜+主食)
    // =========================================================================
    let candidateIntegrated = safeIntegrated.filter(r => !avoidRecipeIds.includes(r.id));
    if (candidateIntegrated.length === 0) candidateIntegrated = safeIntegrated;

    if (avoidProtein) {
      const filtered = candidateIntegrated.filter(r => r.proteinSource !== avoidProtein);
      if (filtered.length > 0) candidateIntegrated = filtered;
    }
    if (preferredProtein) {
      const matched = candidateIntegrated.filter(r => r.proteinSource === preferredProtein);
      if (matched.length > 0) candidateIntegrated = matched;
    }

    if (hasPantry) {
      const pantryMatchingIntegrated = candidateIntegrated.filter(r =>
        r.ingredients.some(i => i.category !== '调料辅料' && isIngredientMatched(i, pantryIngredientIds))
      );
      if (pantryMatchingIntegrated.length > 0) {
        candidateIntegrated = pantryMatchingIntegrated;
      }
    }

    const primaryDish = weightedPickByScore(candidateIntegrated, scoringContext, {
      topRatio: hasPantry ? (clearFridgeMode ? 0.2 : 0.3) : (isLazyMode ? 0.25 : 0.35),
      minPool: hasPantry ? 2 : 3,
      temperature: hasPantry ? 1.0 : 0.8,
    }) || candidateIntegrated[0];

    if (primaryDish && isTrueIntegratedMealRecipe(primaryDish, mealType)) {
      if (Math.random() < 0.20 && !isLazyMode) {
        const quickSides = safeVegs.filter(v =>
          (v.cookTimeMinutes <= 8 || v.cookingMethod === '凉拌' || v.cookingMethod === '煮') &&
          !hasIngredientConflict(primaryDish, v)
        );
        const sideDish = quickSides.length > 0
          ? weightedPickByScore(quickSides, scoringContext, { minPool: 2 })
          : undefined;
        selectedRecipes = sideDish ? [primaryDish, sideDish] : [primaryDish];
      } else {
        selectedRecipes = [primaryDish];
      }
    } else {
      // Fallback: If no integrated meal available, fall back to balanced 3-dish meal
      const main = weightedPickByScore(safeMains, scoringContext, { minPool: 3 }) || safeMains[0];
      const veg = safeVegs.find(v => !hasIngredientConflict(main, v)) || safeVegs[0];
      const staple = safeStaples[0];
      selectedRecipes = [main, veg, staple];
    }

  } else if (complexity === 'standard') {
    // =========================================================================
    // 2. Standard (标准三道): 1主菜 + 1蔬菜 + 1主食
    // =========================================================================
    let candidateMains = [...safeMains];

    if (activeFilters.includes('15min')) {
      const quickMains = candidateMains.filter(r => r.cookTimeMinutes <= 15 || r.tags.includes('15分钟') || r.tags.includes('快手'));
      if (quickMains.length > 0) candidateMains = quickMains;
    }

    if (hasPantry) {
      const pantryMatchingMains = candidateMains.filter(r =>
        r.ingredients.some(i => i.category !== '调料辅料' && isIngredientMatched(i, pantryIngredientIds))
      );
      if (pantryMatchingMains.length > 0) {
        candidateMains = pantryMatchingMains;
      }
    }

    if (avoidProtein) {
      const filtered = candidateMains.filter(r => r.proteinSource !== avoidProtein);
      if (filtered.length > 0) candidateMains = filtered;
    }
    if (preferredProtein) {
      const matched = candidateMains.filter(r => r.proteinSource === preferredProtein);
      if (matched.length > 0) candidateMains = matched;
    }

    const main = weightedPickByScore(candidateMains, scoringContext, {
      topRatio: hasPantry ? (clearFridgeMode ? 0.2 : 0.3) : 0.35,
      minPool: hasPantry ? (clearFridgeMode ? 2 : 3) : 4,
      temperature: hasPantry ? 1.0 : 0.8,
    }) || safeMains[0];

    let candidateVegs = safeVegs.filter(v => !hasIngredientConflict(main, v));
    if (candidateVegs.length === 0) candidateVegs = safeVegs;

    if (activeFilters.includes('15min')) {
      const quickVegs = candidateVegs.filter(v => v.cookTimeMinutes <= 12 || v.tags.includes('15分钟') || v.tags.includes('快手'));
      if (quickVegs.length > 0) candidateVegs = quickVegs;
    }

    if (hasPantry) {
      const pantryMatchingVegs = candidateVegs.filter(v =>
        v.ingredients.some(i => i.category !== '调料辅料' && isIngredientMatched(i, pantryIngredientIds))
      );
      if (pantryMatchingVegs.length > 0) {
        candidateVegs = pantryMatchingVegs;
      }
    }

    const vegetable = weightedPickByScore(candidateVegs, scoringContext, {
      topRatio: hasPantry ? (clearFridgeMode ? 0.2 : 0.3) : 0.4,
      minPool: hasPantry ? (clearFridgeMode ? 2 : 3) : 4,
      temperature: 0.8,
    }) || safeVegs[0];

    const staple = weightedPickByScore(safeStaples, scoringContext, {
      topRatio: 0.5,
      minPool: hasPantry ? 2 : 3,
      temperature: 0.8,
    }) || safeStaples[0];

    selectedRecipes = [main, vegetable, staple];

  } else {
    // =========================================================================
    // 3. Rich (丰盛多道): 2主菜 + 1蔬菜 + 1主食 + [1汤]
    // =========================================================================
    let candidateMains = [...safeMains];
    const main1 = weightedPickByScore(candidateMains, scoringContext, { minPool: 3 }) || safeMains[0];

    const secondaryMains = safeMains.filter(m =>
      m.id !== main1.id &&
      m.proteinSource !== main1.proteinSource &&
      !hasIngredientConflict(main1, m)
    );
    const main2 = secondaryMains.length > 0
      ? weightedPickByScore(secondaryMains, scoringContext, { minPool: 2 })
      : safeVegs[0];

    const candidateVegs = safeVegs.filter(v => !hasIngredientConflict(main1, v) && !hasIngredientConflict(main2, v));
    const vegetable = candidateVegs.length > 0
      ? weightedPickByScore(candidateVegs, scoringContext, { minPool: 2 })
      : safeVegs[0];

    const staple = weightedPickByScore(safeStaples, scoringContext, { minPool: 2 }) || safeStaples[0];

    const soupCandidates = safeSoups.filter(s =>
      !hasIngredientConflict(main1, s) &&
      !hasIngredientConflict(vegetable, s)
    );
    const soup = soupCandidates.length > 0
      ? weightedPickByScore(soupCandidates, scoringContext, { minPool: 2 })
      : undefined;

    selectedRecipes = soup ? [main1, main2, vegetable, staple, soup] : [main1, main2, vegetable, staple];
  }

  // 4. Fail-Safe Completeness Audit & Auto-Repair
  // Every lunch and dinner MUST contain: Protein + Vegetable + Staple.
  // White rice alone = FORBIDDEN.
  // Single protein alone = FORBIDDEN.
  const completeness = auditMealCompleteness(selectedRecipes, mealType);
  if (!completeness.isComplete) {
    if (!completeness.hasStaple) {
      const staple = safeStaples[0];
      if (staple && !selectedRecipes.some(r => r.id === staple.id)) {
        selectedRecipes.push(staple);
      }
    }
    if (!completeness.hasVegetable) {
      const veg = safeVegs.find(v => !hasIngredientConflict(selectedRecipes[0], v)) || safeVegs[0];
      if (veg && !selectedRecipes.some(r => r.id === veg.id)) {
        selectedRecipes.splice(1, 0, veg);
      }
    }
    if (!completeness.hasProtein) {
      const prot = safeMains[0];
      if (prot && !selectedRecipes.some(r => r.id === prot.id)) {
        selectedRecipes.unshift(prot);
      }
    }
    const currentProtein = selectedRecipes.reduce((s, r) => s + (r.protein || 0), 0);
    if (currentProtein < mealTarget.protein.min) {
      if (isLazyMode || (selectedRecipes.length === 1 && isTrueIntegratedMealRecipe(selectedRecipes[0], mealType))) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], { proteinMultiplier: 1.4 });
      } else {
        const prot = safeMains[0];
        if (prot && !selectedRecipes.some(r => r.id === prot.id)) {
          selectedRecipes.unshift(prot);
        }
      }
    }
    if (selectedRecipes.length === 1 && !isTrueIntegratedMealRecipe(selectedRecipes[0], mealType)) {
      if (selectedRecipes[0].category === 'staple') {
        selectedRecipes = [safeMains[0], safeVegs[0], selectedRecipes[0]];
      } else {
        selectedRecipes = [selectedRecipes[0], safeVegs[0], safeStaples[0]];
      }
    }
  }

  // Deduplicate and filter out redundant plain staples if multiple staples were picked
  const uniqueSelected: Recipe[] = [];
  const seenIds = new Set<string>();
  for (const r of selectedRecipes) {
    if (!r || seenIds.has(r.id)) continue;
    seenIds.add(r.id);
    uniqueSelected.push(r);
  }

  // If there are multiple staples and at least one is an integrated meal, drop pure staples
  const stapleCount = uniqueSelected.filter(r => isTrueStapleRecipe(r)).length;
  if (stapleCount > 1) {
    const hasIntegrated = uniqueSelected.some(r => isTrueIntegratedMealRecipe(r));
    if (hasIntegrated) {
      selectedRecipes = uniqueSelected.filter(r => !isPureStapleRecipe(r));
    } else {
      let keptStaple = false;
      selectedRecipes = uniqueSelected.filter(r => {
        if (!isTrueStapleRecipe(r)) return true;
        if (!keptStaple) {
          keptStaple = true;
          return true;
        }
        return false;
      });
    }
  } else {
    selectedRecipes = uniqueSelected;
  }

  // 5. V0.4.7.3 Macro Adequacy Layer (Lunch & Dinner - Bidirectional)
  // Low complexity portion tuning:
  // - If protein is low: tune main dish portion up (1.35x); if high: tune main dish portion down (0.78x).
  // - If carbs are low: tune staple portion up (1.25x); if high: tune staple portion down (0.80x).
  // - If fat is low: tune fat portion up (1.2x); if high: tune fat portion down (0.75x).
  // - In Lazy Mode: adjust ingredient ratios directly inside the one-pot integrated meal.
  let validation = validateMealNutrition(selectedRecipes, mealType, userProfile);

  if (!validation.isAdequate) {
    const isSingleIntegrated = selectedRecipes.length === 1 && isTrueIntegratedMealRecipe(selectedRecipes[0], mealType);

    // Protein bidirectional tuning
    if (validation.macroAdequacy?.proteinStatus === 'low') {
      if (isSingleIntegrated || isLazyMode) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], {
          proteinMultiplier: 1.35,
        });
      } else {
        const mainIdx = selectedRecipes.findIndex(r => r.category === 'main');
        if (mainIdx >= 0) {
          selectedRecipes[mainIdx] = tuneRecipeNutritionalPortions(selectedRecipes[mainIdx], {
            proteinMultiplier: 1.3,
          });
        }
      }
      validation = validateMealNutrition(selectedRecipes, mealType, userProfile);
    } else if (validation.macroAdequacy?.proteinStatus === 'high') {
      if (isSingleIntegrated || isLazyMode) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], {
          proteinMultiplier: 0.78,
        });
      } else {
        const mainIdx = selectedRecipes.findIndex(r => r.category === 'main');
        if (mainIdx >= 0) {
          selectedRecipes[mainIdx] = tuneRecipeNutritionalPortions(selectedRecipes[mainIdx], {
            proteinMultiplier: 0.78,
          });
        }
      }
      validation = validateMealNutrition(selectedRecipes, mealType, userProfile);
    }

    // Carbs bidirectional tuning
    if (validation.macroAdequacy?.carbsStatus === 'low') {
      if (isSingleIntegrated || isLazyMode) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], {
          carbMultiplier: 1.25,
        });
      } else {
        const stapleIdx = selectedRecipes.findIndex(r => r.category === 'staple');
        if (stapleIdx >= 0) {
          selectedRecipes[stapleIdx] = tuneRecipeNutritionalPortions(selectedRecipes[stapleIdx], {
            carbMultiplier: 1.25,
          });
        }
      }
      validation = validateMealNutrition(selectedRecipes, mealType, userProfile);
    } else if (validation.macroAdequacy?.carbsStatus === 'high') {
      if (isSingleIntegrated || isLazyMode) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], {
          carbMultiplier: 0.80,
        });
      } else {
        const stapleIdx = selectedRecipes.findIndex(r => r.category === 'staple');
        if (stapleIdx >= 0) {
          selectedRecipes[stapleIdx] = tuneRecipeNutritionalPortions(selectedRecipes[stapleIdx], {
            carbMultiplier: 0.80,
          });
        }
      }
      validation = validateMealNutrition(selectedRecipes, mealType, userProfile);
    }

    // Fat bidirectional tuning
    if (validation.macroAdequacy?.fatStatus === 'low') {
      if (selectedRecipes[0]) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], {
          fatMultiplier: 1.2,
        });
      }
      validation = validateMealNutrition(selectedRecipes, mealType, userProfile);
    } else if (validation.macroAdequacy?.fatStatus === 'high') {
      if (selectedRecipes[0]) {
        selectedRecipes[0] = tuneRecipeNutritionalPortions(selectedRecipes[0], {
          fatMultiplier: 0.75,
        });
      }
      validation = validateMealNutrition(selectedRecipes, mealType, userProfile);
    }
  }

  // 6. Aggregate nutritional values
  const totalCalories = selectedRecipes.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = Math.round(selectedRecipes.reduce((sum, r) => sum + r.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(selectedRecipes.reduce((sum, r) => sum + r.carbs, 0) * 10) / 10;
  const totalFat = Math.round(selectedRecipes.reduce((sum, r) => sum + r.fat, 0) * 10) / 10;

  // Real-world Time & Cookware Calculation
  const isRiceCookerMeal = selectedRecipes.some(r => r.equipment?.includes('rice-cooker') || r.tags.includes('电饭煲'));
  const isOnePotMeal = selectedRecipes.length === 1 && (selectedRecipes[0].onePot || isRiceCookerMeal);

  const activeTimeMinutes = selectedRecipes.length === 1
    ? (selectedRecipes[0].activeTimeMinutes || selectedRecipes[0].prepTimeMinutes || 7)
    : Math.min(30, Math.max(...selectedRecipes.map(r => r.activeTimeMinutes || 6)) + (selectedRecipes.length - 1) * 3);

  const passiveTimeMinutes = Math.max(...selectedRecipes.map(r => r.passiveTimeMinutes || r.cookTimeMinutes || 15));
  const totalTimeMinutes = isRiceCookerMeal ? Math.max(activeTimeMinutes + passiveTimeMinutes, selectedRecipes[0].timeMinutes) : activeTimeMinutes + passiveTimeMinutes;

  const estimatedTimeMinutes = isRiceCookerMeal
    ? totalTimeMinutes
    : Math.min(45, Math.max(15, activeTimeMinutes + Math.round(passiveTimeMinutes * 0.7)));

  const cookwareCount = isOnePotMeal
    ? 1
    : Math.min(3, selectedRecipes.reduce((sum, r) => sum + (r.cookwareCount || 1), 0));

  const isLazy = Boolean(isLazyMode || isRiceCookerMeal || (cookwareCount <= 1 && activeTimeMinutes <= 10));

  // Determine overall difficulty
  const difficulties: RecipeDifficulty[] = selectedRecipes.map(r => r.difficulty);
  const overallDifficulty: RecipeDifficulty = difficulties.includes('进阶家常')
    ? '新手快手'
    : '小白友好';

  // Generate combo titles and motto
  // Anchor dish MUST be a protein main or integrated meal dish, never a plain staple like 白米饭/杂粮饭
  const anchorDish = selectedRecipes.find(r => r.category !== 'staple' || isTrueIntegratedMealRecipe(r)) || selectedRecipes[0];
  const primaryName = anchorDish.name.replace('家常', '').replace('经典', '').replace('老北京', '');
  const dishNames = selectedRecipes.map(r => r.name);

  let comboTitle = '';
  if (isLazy) {
    const lazyTitles = [
      `电饭煲懒人餐 · ${primaryName}`,
      `免看火一锅搞定 · ${primaryName}`,
      `少洗锅懒人餐 · ${primaryName}`,
    ];
    comboTitle = lazyTitles[Math.floor(Math.random() * lazyTitles.length)];
  } else if (complexity === 'simple') {
    const simpleTitles = [
      `一人食一碗搞定 · ${primaryName}`,
      `快手省心餐 · ${primaryName}`,
      `一盘搞定 · ${primaryName}`,
    ];
    comboTitle = simpleTitles[Math.floor(Math.random() * simpleTitles.length)];
  } else if (complexity === 'rich') {
    comboTitle = `丰盛四重奏 · ${primaryName}`;
  } else {
    const standardTitles = [
      `荤素均衡餐 · ${primaryName}`,
      `少油鲜香餐 · ${primaryName}`,
      `元气家常餐 · ${primaryName}`,
    ];
    comboTitle = standardTitles[Math.floor(Math.random() * standardTitles.length)];
  }

  // 7. Audit pantry coverage if user has selected pantry items
  const pantryAudit = hasPantry
    ? auditMealPantryCoverage(selectedRecipes, pantryIngredientIds, clearFridgeMode)
    : undefined;

  // Craft warm, natural recommendation reason
  let reason = '';
  if (pantryAudit && pantryAudit.matchedCount > 0) {
    const matchedNames = pantryAudit.matchedCanonicalNames.slice(0, 3).join('、');
    if (isLazy) {
      reason = `已优先用家里现有的【${matchedNames}】做一锅端，动手仅需 ${activeTimeMinutes} 分钟，剩下交给电饭煲，少洗锅超省心。`;
    } else if (clearFridgeMode) {
      reason = `已优先消耗家中现有的【${matchedNames}】，缺少食材仅需补充 ${pantryAudit.missingCount} 样，搭配省心不浪费。`;
    } else {
      reason = `已充分利用家里现有的【${matchedNames}】，搭配当季清爽时蔬，营养均衡、少买快做。`;
    }
  } else if (isLazy) {
    reason = `备好食材，剩下交给电饭煲。动手仅约 ${activeTimeMinutes} 分钟，等待约 ${passiveTimeMinutes} 分钟，免看火少洗锅，下班回家静享美味。`;
  } else if (complexity === 'simple') {
    reason = `专为一人食精简搭配，动手仅需 ${activeTimeMinutes} 分钟，一碗涵盖优质蛋白质与主食，少切配少洗碗。`;
  } else if (favoriteRecipeIds.includes(selectedRecipes[0].id)) {
    reason = `包含你收藏的拿手好菜【${selectedRecipes[0].name}】，搭配清爽蔬菜与主食，美味又合心意。`;
  } else if (totalProtein >= 30) {
    reason = `本餐提供 ${totalProtein}g 优质蛋白，主打${selectedRecipes[0].name}，搭配清爽时蔬与主食，荤素有致、饱腹不油腻。`;
  } else if (activeFilters.includes('15min')) {
    reason = `各环节备料简单，炒菜约 ${activeTimeMinutes} 分钟即可上桌，快手省时。`;
  } else {
    reason = `荤素均衡搭配，热量约 ${totalCalories} kcal，少油少盐，适合日常家常做饭。`;
  }

  const tags: string[] = [];
  if (pantryAudit && pantryAudit.matchedCount > 0) {
    tags.push(`已有 ${pantryAudit.matchedCount}/${pantryAudit.totalCount} 样食材`);
    if (clearFridgeMode) tags.push('清冰箱');
  }
  if (isLazy) {
    tags.push('懒人模式');
    tags.push('免看火');
  } else if (complexity === 'simple') {
    tags.push('一碗搞定');
  }
  if (cookwareCount <= 1) {
    tags.push('1个锅');
  }
  if (favoriteRecipeIds.includes(selectedRecipes[0].id)) {
    tags.push('包含收藏');
  }
  if (totalProtein >= 30) tags.push('高蛋白');
  if (activeTimeMinutes <= 10) tags.push(`动手${activeTimeMinutes}分`);
  tags.push('少油家常');

  const nutritionValidation = validateMealNutrition(selectedRecipes, mealType, userProfile);

  return {
    id: `combo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    comboTitle,
    motto: dishNames.length > 1
      ? `${anchorDish.name} 搭配 ${dishNames.filter(n => n !== anchorDish.name).join('、')}`
      : `${anchorDish.name}，一碗搞定荤素主食`,
    recipes: selectedRecipes,
    recipeIds: selectedRecipes.map(r => r.id),
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    estimatedTimeMinutes,
    complexity,
    activeTimeMinutes,
    passiveTimeMinutes,
    totalTimeMinutes,
    isLazy,
    cookwareCount,
    ingredientCount: new Set(
      selectedRecipes.flatMap(r => r.ingredients.filter(i => i.category !== '调料辅料').map(i => i.name))
    ).size,
    difficulty: overallDifficulty,
    servingSize: `${servings}人份`,
    tags,
    recommendationReason: reason,
    nutritionValidation,
    pantryCoverage: pantryAudit
      ? {
          totalCount: pantryAudit.totalCount,
          matchedCount: pantryAudit.matchedCount,
          missingCount: pantryAudit.missingCount,
          coverageRate: pantryAudit.coverageRate,
          matchedIngredients: pantryAudit.matchedIngredients.map(m => ({
            name: m.ingredient.name,
            amount: m.ingredient.amount,
            unit: m.ingredient.unit,
            category: m.ingredient.category,
          })),
          missingIngredients: pantryAudit.missingIngredients.map(m => ({
            name: m.ingredient.name,
            amount: m.ingredient.amount,
            unit: m.ingredient.unit,
            category: m.ingredient.category,
          })),
          matchedCanonicalNames: pantryAudit.matchedCanonicalNames,
          missingCanonicalNames: pantryAudit.missingCanonicalNames,
        }
      : undefined,
  };
}

/**
 * Hydrates a Meal entity (which only stores recipeIds) into a complete MealCombo
 */
export function hydrateMeal(meal: Meal): MealCombo {
  const recipes = meal.recipeIds
    .map(id => getRecipeById(id))
    .filter((r): r is Recipe => Boolean(r));

  const totalCalories = recipes.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = Math.round(recipes.reduce((sum, r) => sum + r.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(recipes.reduce((sum, r) => sum + r.carbs, 0) * 10) / 10;
  const totalFat = Math.round(recipes.reduce((sum, r) => sum + r.fat, 0) * 10) / 10;

  const uniqueIngredients = new Set(
    recipes.flatMap(r => r.ingredients.filter(i => i.category !== '调料辅料').map(i => i.name))
  );

  const isRiceCookerMeal = recipes.some(r => r.equipment?.includes('rice-cooker') || r.tags.includes('电饭煲'));
  const isOnePotMeal = recipes.length === 1 && (recipes[0].onePot || isRiceCookerMeal);
  const activeTimeMinutes = recipes.length === 1
    ? (recipes[0].activeTimeMinutes || recipes[0].prepTimeMinutes || 7)
    : Math.min(30, Math.max(...recipes.map(r => r.activeTimeMinutes || 6)) + (recipes.length - 1) * 3);
  const passiveTimeMinutes = Math.max(...recipes.map(r => r.passiveTimeMinutes || r.cookTimeMinutes || 15));
  const totalTimeMinutes = isRiceCookerMeal ? Math.max(activeTimeMinutes + passiveTimeMinutes, recipes[0].timeMinutes) : activeTimeMinutes + passiveTimeMinutes;
  const cookwareCount = isOnePotMeal ? 1 : Math.min(3, recipes.reduce((sum, r) => sum + (r.cookwareCount || 1), 0));
  const complexity: MealComplexity = recipes.length === 1 ? 'simple' : recipes.length <= 3 ? 'standard' : 'rich';
  const isLazy = Boolean(isRiceCookerMeal || (cookwareCount <= 1 && activeTimeMinutes <= 10));

  return {
    id: meal.id,
    comboTitle: meal.title,
    motto: meal.motto || recipes.map(r => r.name).join(' + '),
    recipeIds: meal.recipeIds,
    recipes,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    estimatedTimeMinutes: meal.estimatedTimeMinutes || 25,
    ingredientCount: uniqueIngredients.size,
    difficulty: meal.difficulty || '小白友好',
    servingSize: meal.servingSize || '1~2人份刚好',
    tags: meal.tags || ['一荤一素'],
    recommendationReason: meal.recommendationReason || '均衡家常搭配，营养适口。',
    complexity,
    activeTimeMinutes,
    passiveTimeMinutes,
    totalTimeMinutes,
    isLazy,
    cookwareCount,
  };
}
