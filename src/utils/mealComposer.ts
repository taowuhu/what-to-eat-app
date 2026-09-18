import {
  Recipe,
  Meal,
  MealCombo,
  MealType,
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
  const pool = strictlyFiltered.filter(r => !avoidRecipeIds.includes(r.id));

  const safePool = filterStrictExclusions(ALL_RECIPES, userProfile?.strictlyExclude);
  const mains = pool.filter(r => r.category === 'main');
  const vegetables = pool.filter(r => r.category === 'vegetable' || r.category === 'side');
  const staples = pool.filter(r => r.category === 'staple');
  const soups = pool.filter(r => r.category === 'soup');

  // Fallbacks if pool filtered too tightly (guaranteed to respect strict exclusions)
  const safeMains = mains.length > 0 ? mains : safePool.filter(r => r.category === 'main');
  const safeVegs = vegetables.length > 0 ? vegetables : safePool.filter(r => r.category === 'vegetable' || r.category === 'side');
  const safeStaples = staples.length > 0 ? staples : safePool.filter(r => r.category === 'staple');
  const safeSoups = soups.length > 0 ? soups : safePool.filter(r => r.category === 'soup');

  // 2. Filter / Score Main Dish
  let candidateMains = [...safeMains];

  // If 15min quick filter is active, filter candidates for fast cooking time
  if (activeFilters.includes('15min')) {
    const quickMains = candidateMains.filter(r => r.cookTimeMinutes <= 15 || r.tags.includes('15分钟') || r.tags.includes('快手'));
    if (quickMains.length > 0) candidateMains = quickMains;
  }

  // If pantry ingredients provided, ensure recipes that match user's pantry ingredients are prioritized
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

  // Pick main dish using weighted selection
  const main = weightedPickByScore(candidateMains, scoringContext, {
    topRatio: hasPantry ? (clearFridgeMode ? 0.2 : 0.3) : 0.35,
    minPool: hasPantry ? (clearFridgeMode ? 2 : 3) : 4,
    temperature: hasPantry ? 1.0 : 0.8,
  }) || safeMains[0];

  // 3. Pick Complementary Vegetable Dish
  let candidateVegs = safeVegs.filter(v => !hasIngredientConflict(main, v));
  if (candidateVegs.length === 0) candidateVegs = safeVegs;

  if (activeFilters.includes('15min')) {
    const quickVegs = candidateVegs.filter(v => v.cookTimeMinutes <= 12 || v.tags.includes('15分钟') || v.tags.includes('快手'));
    if (quickVegs.length > 0) candidateVegs = quickVegs;
  }

  // If pantry items provided and main dish didn't consume all, prioritize vegs matching pantry
  if (hasPantry) {
    const pantryMatchingVegs = candidateVegs.filter(v =>
      v.ingredients.some(i => i.category !== '调料辅料' && isIngredientMatched(i, pantryIngredientIds))
    );
    if (pantryMatchingVegs.length > 0) {
      candidateVegs = pantryMatchingVegs;
    }
  }

  // Balance cooking method: if main is stir-fried (炒), vegetable could be blanched/steamed/boiled
  const blanchedOrSteamed = candidateVegs.filter(v => v.cookingMethod === '煮' || v.cookingMethod === '凉拌' || v.cookingMethod === '蒸');
  if (!hasPantry && main.cookingMethod === '炒' && blanchedOrSteamed.length > 0 && Math.random() > 0.4) {
    candidateVegs = blanchedOrSteamed;
  }

  const vegetable = weightedPickByScore(candidateVegs, scoringContext, {
    topRatio: hasPantry ? (clearFridgeMode ? 0.2 : 0.3) : 0.4,
    minPool: hasPantry ? (clearFridgeMode ? 2 : 3) : 4,
    temperature: 0.8,
  }) || safeVegs[0];

  // 4. Pick Staple
  const staple = weightedPickByScore(safeStaples, scoringContext, {
    topRatio: 0.5,
    minPool: hasPantry ? 2 : 3,
    temperature: 0.8,
  }) || safeStaples[0];

  // 5. Pick Soup (Optional or required)
  const wantsSoup = forceSoup !== undefined
    ? forceSoup
    : (mealType === 'dinner' || Math.random() > 0.45) && !activeFilters.includes('15min') && !clearFridgeMode;

  let selectedSoup: Recipe | null = null;
  if (wantsSoup && safeSoups.length > 0) {
    const nonConflictSoups = safeSoups.filter(s =>
      !hasIngredientConflict(main, s) &&
      !hasIngredientConflict(vegetable, s) &&
      s.proteinSource !== main.proteinSource
    );
    const soupCandidates = nonConflictSoups.length > 0 ? nonConflictSoups : safeSoups;
    selectedSoup = weightedPickByScore(soupCandidates, scoringContext, {
      topRatio: 0.5,
      minPool: 3,
      temperature: 0.8,
    });
  }

  const selectedRecipes = selectedSoup
    ? [main, vegetable, staple, selectedSoup]
    : [main, vegetable, staple];

  // 6. Aggregate nutritional values
  const totalCalories = selectedRecipes.reduce((sum, r) => sum + r.calories, 0);
  const totalProtein = Math.round(selectedRecipes.reduce((sum, r) => sum + r.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(selectedRecipes.reduce((sum, r) => sum + r.carbs, 0) * 10) / 10;
  const totalFat = Math.round(selectedRecipes.reduce((sum, r) => sum + r.fat, 0) * 10) / 10;

  // Realistic parallel cooking time
  const estimatedTimeMinutes = Math.min(35, Math.max(
    Math.round(main.cookTimeMinutes + (vegetable.cookTimeMinutes * 0.7) + 3),
    15
  ));

  // Determine overall difficulty
  const difficulties: RecipeDifficulty[] = selectedRecipes.map(r => r.difficulty);
  const overallDifficulty: RecipeDifficulty = difficulties.includes('进阶家常')
    ? '新手快手'
    : '小白友好';

  // Generate combo titles and motto
  const dishNames = selectedRecipes.map(r => r.name);
  const cleanMainName = main.name.replace('家常', '').replace('经典', '').replace('老北京', '');
  
  const titleTemplates = [
    `荤素均衡餐 · ${cleanMainName}`,
    `快手下饭餐 · ${cleanMainName}`,
    `少油鲜香餐 · ${cleanMainName}`,
    `元气饱腹餐 · ${cleanMainName}`,
  ];
  const comboTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  // 7. Audit pantry coverage if user has selected pantry items
  const pantryAudit = hasPantry
    ? auditMealPantryCoverage(selectedRecipes, pantryIngredientIds, clearFridgeMode)
    : undefined;

  // Craft a warm home-style recommendation reason
  let reason = '';
  if (pantryAudit && pantryAudit.matchedCount > 0) {
    const matchedNames = pantryAudit.matchedCanonicalNames.slice(0, 3).join('、');
    if (clearFridgeMode) {
      reason = `已优先消耗家中现有的【${matchedNames}】，缺少食材仅需补充 ${pantryAudit.missingCount} 样，搭配省心不浪费。`;
    } else {
      reason = `已充分利用家里现有的【${matchedNames}】，搭配当季清爽时蔬，营养均衡、少买快做。`;
    }
  } else if (favoriteRecipeIds.includes(main.id)) {
    reason = `包含你收藏的拿手好菜【${main.name}】，搭配清爽蔬菜与主食，美味又合心意。`;
  } else if (totalProtein >= 30) {
    reason = `本餐提供 ${totalProtein}g 优质蛋白，主打${main.name}，搭配清爽时蔬与主食，荤素有致、饱腹不油腻。`;
  } else if (activeFilters.includes('15min')) {
    reason = `各环节备料简单，电饭煲煮饭的同时，炒菜约 ${estimatedTimeMinutes} 分钟即可双菜上桌。`;
  } else {
    reason = `一荤一素一主食${selectedSoup ? '一靓汤' : ''}，热量约 ${totalCalories} kcal，少油少盐，适合日常家常做饭。`;
  }

  const tags: string[] = [];
  if (pantryAudit && pantryAudit.matchedCount > 0) {
    tags.push(`已有 ${pantryAudit.matchedCount}/${pantryAudit.totalCount} 样食材`);
    if (clearFridgeMode) tags.push('清冰箱');
  }
  if (favoriteRecipeIds.includes(main.id)) {
    tags.push('包含收藏');
  }
  if (totalProtein >= 30) tags.push('高蛋白');
  if (estimatedTimeMinutes <= 20) tags.push('快手省时');
  tags.push('少油家常');

  return {
    id: `combo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    comboTitle,
    motto: `${dishNames[0]} 搭配 ${dishNames.slice(1).join('、')}`,
    recipes: selectedRecipes,
    recipeIds: selectedRecipes.map(r => r.id),
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    estimatedTimeMinutes,
    ingredientCount: new Set(
      selectedRecipes.flatMap(r => r.ingredients.filter(i => i.category !== '调料辅料').map(i => i.name))
    ).size,
    difficulty: overallDifficulty,
    servingSize: `${servings}人份`,
    tags,
    recommendationReason: reason,
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
  };
}
