import {
  Recipe,
  MealCombo,
  MacroNutrients,
  UserProfile,
  QuickFilterId,
  ProteinSource,
  MealType,
  CookingFeedback,
  RecommendationFeedback,
} from '../types';
import { ALL_RECIPES } from '../data/recipes';
import { composeMeal, filterByDislikes } from './mealComposer';
import { filterStrictExclusions } from './scoringEngine';

export interface RecommendationOptions {
  remainingMacros?: MacroNutrients;
  userProfile: UserProfile;
  activeFilter?: QuickFilterId | null;
  activeFilters?: QuickFilterId[];
  excludedComboIds?: string[];
  historyRecipeIds?: string[];
  recentProteins?: ProteinSource[];
  pantryIngredientIds?: string[];
  clearFridgeMode?: boolean;
  mealType?: MealType;
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
 * Generates a single balanced home-style meal recommendation
 */
export function generateMealRecommendation(options: RecommendationOptions): MealCombo {
  const {
    userProfile,
    activeFilter,
    activeFilters,
    historyRecipeIds = [],
    recentProteins = [],
    pantryIngredientIds = [],
    clearFridgeMode = false,
    mealType = 'lunch',
    favoriteRecipeIds = [],
    cookingFeedbacks = [],
    recommendationFeedbacks = [],
    temporaryPreferences,
    servings = 1,
  } = options;
  const currentFilters = activeFilters ?? (activeFilter ? [activeFilter] : []);

  // Filter out strict exclusions (不吃的食材)
  const cleanPool = filterStrictExclusions(ALL_RECIPES, userProfile.strictlyExclude);

  // Apply history penalty: recipes cooked recently are filtered out from top selection if alternatives exist
  let pool = cleanPool;
  if (historyRecipeIds.length > 0) {
    const unvisited = cleanPool.filter(r => !historyRecipeIds.includes(r.id));
    if (unvisited.length >= 20) {
      pool = unvisited;
    }
  }

  // De-prioritize most recent protein if multiple options exist
  const lastProtein = recentProteins.length > 0 ? recentProteins[recentProteins.length - 1] : undefined;

  return composeMeal(pool, {
    mealType,
    avoidProtein: lastProtein,
    avoidRecipeIds: historyRecipeIds,
    activeFilters: currentFilters,
    userProfile,
    pantryIngredientIds,
    clearFridgeMode,
    favoriteRecipeIds,
    cookingFeedbacks,
    recommendationFeedbacks,
    temporaryPreferences,
    servings,
  });
}

/**
 * Generates 3 distinct alternative meal combos with varied protein sources & flavor profiles
 * (For the "看看另外3套方案" user request)
 */
export function generateAlternativeMeals(
  count: number = 3,
  options: RecommendationOptions
): MealCombo[] {
  const {
    userProfile,
    activeFilter,
    activeFilters,
    historyRecipeIds = [],
    pantryIngredientIds = [],
    clearFridgeMode = false,
    mealType = 'lunch',
    favoriteRecipeIds = [],
    cookingFeedbacks = [],
    recommendationFeedbacks = [],
    temporaryPreferences,
    servings = 1,
  } = options;
  const currentFilters = activeFilters ?? (activeFilter ? [activeFilter] : []);

  const cleanPool = filterStrictExclusions(ALL_RECIPES, userProfile.strictlyExclude);

  // Define distinct protein tracks to ensure maximum variety
  const proteinTracks: { label: string; primary: ProteinSource[]; secondary?: ProteinSource }[] = [
    { label: '鲜嫩禽肉', primary: ['chicken'] },
    { label: '浓香畜肉', primary: ['beef', 'pork'] },
    { label: '水产或高钙蛋豆', primary: ['fish', 'shrimp', 'tofu', 'egg'] },
  ];

  const results: MealCombo[] = [];
  const usedRecipeIds = new Set<string>(historyRecipeIds);

  for (let i = 0; i < count; i++) {
    const track = proteinTracks[i % proteinTracks.length];
    // Pick preferred protein from track
    const randomProtein = track.primary[Math.floor(Math.random() * track.primary.length)];

    const combo = composeMeal(cleanPool, {
      mealType: i === 2 ? 'dinner' : mealType,
      preferredProtein: randomProtein,
      avoidRecipeIds: Array.from(usedRecipeIds),
      activeFilters: currentFilters,
      includeSoup: i === 1, // mix soup presence
      userProfile,
      pantryIngredientIds,
      clearFridgeMode,
      favoriteRecipeIds,
      cookingFeedbacks,
      recommendationFeedbacks,
      temporaryPreferences,
      servings,
    });

    // Track used recipes to prevent repetition among the 3 options
    combo.recipes.forEach(r => usedRecipeIds.add(r.id));
    results.push(combo);
  }

  return results;
}
