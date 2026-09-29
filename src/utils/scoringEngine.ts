import { Recipe, UserProfile, RecommendationFeedback, CookingFeedback } from '../types';
import { calculateRecipePantryScore } from './pantryScorer';

export interface ScoringContext {
  userProfile?: UserProfile;
  favoriteRecipeIds?: string[];
  historyRecipeIds?: string[];
  cookingFeedbacks?: CookingFeedback[];
  recommendationFeedbacks?: RecommendationFeedback[];
  pantryIngredientIds?: string[];
  clearFridgeMode?: boolean;
  activeFilters?: string[];
  temporaryPreferences?: {
    noMeatToday?: boolean;
    preferLight?: boolean;
    tooTroublesome?: boolean;
  };
}

/**
 * Strict exclusion filter: completely drops recipes matching user's "不吃的食材"
 */
export function filterStrictExclusions(recipes: Recipe[], strictlyExclude: string[] = []): Recipe[] {
  if (!strictlyExclude || strictlyExclude.length === 0) return recipes;
  const trimmed = strictlyExclude.map(s => s.trim().toLowerCase()).filter(Boolean);
  if (trimmed.length === 0) return recipes;

  return recipes.filter(r => {
    // 1. Check recipe name
    const nameLower = r.name.toLowerCase();
    if (trimmed.some(d => nameLower.includes(d))) {
      return false;
    }

    // 2. Check dislike tags (e.g. '牛肉', '猪肉', '辛辣', '虾', '海鲜', '香菜')
    const hasExcludedTag = r.dislikeTags.some(tag => {
      const tagLower = tag.toLowerCase();
      return trimmed.some(d => d.includes(tagLower) || tagLower.includes(d));
    });
    if (hasExcludedTag) return false;

    // 3. Check general tags
    const hasExcludedGeneralTag = r.tags.some(tag => {
      const tagLower = tag.toLowerCase();
      return trimmed.some(d => d.includes(tagLower) || tagLower.includes(d));
    });
    if (hasExcludedGeneralTag) return false;

    // 4. Check ingredient names
    const hasExcludedIng = r.ingredients.some(ing => {
      const ingLower = ing.name.toLowerCase();
      return trimmed.some(d => ingLower.includes(d) || d.includes(ingLower));
    });
    return !hasExcludedIng;
  });
}

/**
 * Checks if recipe contains any "不喜欢的食材" (soft dislike)
 */
export function containsDislikedIngredients(recipe: Recipe, dislikes: string[] = []): boolean {
  if (!dislikes || dislikes.length === 0) return false;
  const trimmed = dislikes.map(s => s.trim()).filter(Boolean);
  if (trimmed.length === 0) return false;

  const hasDislikedTag = recipe.dislikeTags.some(tag =>
    trimmed.some(d => d.includes(tag) || tag.includes(d))
  );
  if (hasDislikedTag) return true;

  return recipe.ingredients.some(ing =>
    trimmed.some(d => ing.name.includes(d) || d.includes(ing.name))
  );
}

/**
 * Calculates a comprehensive recommendation score for a candidate recipe
 * Higher score = higher priority in selection pool
 */
export function calculateRecipeScore(recipe: Recipe, context: ScoringContext = {}): number {
  let score = 100; // base score

  const {
    userProfile,
    favoriteRecipeIds = [],
    cookingFeedbacks = [],
    recommendationFeedbacks = [],
    pantryIngredientIds = [],
    clearFridgeMode = false,
    activeFilters = [],
    temporaryPreferences = {},
    historyRecipeIds = [],
  } = context;

  // 1. Pantry match score & Intent Tiering
  if (pantryIngredientIds.length > 0) {
    const pantryRes = calculateRecipePantryScore(recipe, pantryIngredientIds, clearFridgeMode);
    score += pantryRes.score;
    if (pantryRes.matchedPantryCount >= 2) {
      score += 150; // Extra boost for multi-pantry Tier A recipes
    } else if (pantryRes.matchedPantryCount === 1) {
      score += 40; // Tier B boost
    } else {
      // Intent Penalty: when user actively selects pantry ingredients, 0-match recipes get heavily de-prioritized
      score *= clearFridgeMode ? 0.05 : 0.2;
    }
  }

  // 2. Favorites (收藏 → 小幅增加权重)
  if (favoriteRecipeIds.includes(recipe.id)) {
    score *= 1.25;
  }

  // 3. Post-Cooking Feedback (做饭完成后的反馈)
  const recipeFeedbacks = cookingFeedbacks.filter(f => f.recipeId === recipe.id);
  for (const fb of recipeFeedbacks) {
    if (fb.rating === 'like' || fb.tags.includes('下次还想吃')) {
      score *= 1.35; // 好评增权
    } else if (fb.rating === 'dislike') {
      score *= 0.15; // 不喜欢大幅降权
    }
  }

  // Global cooking feedback patterns (e.g. user consistently flagged '太辣' or '有点麻烦')
  const recentSpicyComplaints = cookingFeedbacks
    .slice(0, 10)
    .filter(f => f.tags.includes('太辣')).length;
  const isSpicyRecipe = recipe.tags.some(t => ['辛辣', '辣', '香辣', '微辣', '麻辣', '川味'].includes(t)) ||
    recipe.dislikeTags.includes('辛辣');
  if (recentSpicyComplaints > 0 && isSpicyRecipe) {
    // Penalty scales with how often user flagged spicy
    score *= Math.max(0.1, 0.4 - recentSpicyComplaints * 0.1);
  }

  const recentTroublesomeComplaints = cookingFeedbacks
    .slice(0, 10)
    .filter(f => f.tags.includes('有点麻烦')).length;
  if ((recentTroublesomeComplaints > 0 || temporaryPreferences.tooTroublesome) &&
      (recipe.difficulty === '进阶家常' || recipe.cookTimeMinutes > 20)) {
    score *= 0.35;
  }

  // 4. Recommendation Feedback (“不想吃这个” 的轻反馈)
  const recentSkips = recommendationFeedbacks.slice(0, 15);
  // Specifically disliked this recipe
  const dishDislikes = recentSkips.filter(s => s.reason === 'dislike_dish' && s.recipeIds.includes(recipe.id));
  if (dishDislikes.length > 0) {
    score *= 0.15;
  }

  // 5. Soft Disliked Ingredients (不喜欢的食材 → 降权而非强制剔除)
  if (userProfile?.dislikes && containsDislikedIngredients(recipe, userProfile.dislikes)) {
    score *= 0.25;
  }

  // 6. Temporary Preferences from "不想吃这个"
  if (temporaryPreferences.noMeatToday) {
    if (recipe.proteinSource === 'pork' || recipe.proteinSource === 'beef') {
      score *= 0.1;
    } else if (recipe.category === 'vegetable' || recipe.proteinSource === 'tofu' || recipe.proteinSource === 'egg') {
      score *= 1.5;
    }
  }

  if (temporaryPreferences.preferLight) {
    const isLight = recipe.tags.includes('清淡') || recipe.tags.includes('少油') ||
      recipe.cookingMethod === '煮' || recipe.cookingMethod === '凉拌' || recipe.cookingMethod === '蒸';
    const isHeavy = isSpicyRecipe || recipe.tags.includes('红烧') || recipe.tags.includes('油炸');
    if (isLight) score *= 1.5;
    if (isHeavy) score *= 0.2;
  }

  // 7. Active Quick Filters
  if (activeFilters.includes('lazy_mode')) {
    const isRiceCooker = recipe.equipment?.some(eq => eq.includes('rice-cooker') || eq.includes('电饭煲')) || recipe.tags.includes('电饭煲');
    const isOnePot = recipe.onePot || recipe.tags.includes('一锅出') || recipe.tags.includes('一锅搞定');
    const isHandsOff = recipe.handsOff || recipe.tags.includes('免看火');
    const activeTime = recipe.activeTimeMinutes ?? (recipe.prepTimeMinutes || 8);
    const cookwares = recipe.cookwareCount ?? (isOnePot ? 1 : 2);
    const stepsCount = recipe.steps?.length || 4;

    // Heavily boost hands-off, rice cooker, one-pot recipes
    if (isRiceCooker) {
      score *= 2.2;
    }
    if (isOnePot) {
      score *= 1.6;
    }
    if (isHandsOff) {
      score *= 1.5;
    }
    if (activeTime <= 8) {
      score *= 1.4;
    } else if (activeTime <= 12) {
      score *= 1.15;
    } else if (activeTime > 18) {
      score *= 0.4;
    }

    if (cookwares <= 1) {
      score *= 1.35;
    } else if (cookwares > 1) {
      score *= 0.45;
    }

    if (recipe.prepComplexity === 'low') {
      score *= 1.25;
    } else if (recipe.prepComplexity === 'high') {
      score *= 0.4;
    }

    if (stepsCount <= 4) {
      score *= 1.2;
    } else if (stepsCount >= 6) {
      score *= 0.6;
    }

    // Penalize dishes that require continuous active stir-frying in lazy mode
    if (recipe.cookingMethod === '炒' || recipe.tags.includes('爆炒')) {
      score *= 0.75;
    }
  }

  if (activeFilters.includes('15min')) {
    const totalTime = recipe.totalTimeMinutes ?? recipe.timeMinutes ?? (recipe.cookTimeMinutes + recipe.prepTimeMinutes);
    if (totalTime <= 15 || recipe.tags.includes('15分钟')) {
      score *= 1.5;
    } else {
      score *= 0.5;
    }
  }
  if (activeFilters.includes('high_protein')) {
    score += recipe.protein * 2.5;
  }
  if (activeFilters.includes('single_person')) {
    if (recipe.isCompleteMeal || recipe.tags.includes('一人食') || recipe.tags.includes('一锅搞定')) {
      score *= 1.6;
    } else if (recipe.category === 'main') {
      score *= 1.2;
    }
  }
  if (activeFilters.includes('homestyle') && recipe.tags.includes('家常菜')) {
    score *= 1.25;
  }

  // 8. Recent History Deduplication (近期已食用/已安排防连续重复)
  if (historyRecipeIds.includes(recipe.id)) {
    score *= 0.25;
  }

  return Math.max(1, score);
}
