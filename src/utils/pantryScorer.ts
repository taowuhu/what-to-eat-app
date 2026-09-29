import { Recipe } from '../types';
import { isIngredientMatched, isSeasoningOrAuxiliary, getRecipeMatchedPantryIds } from './ingredientMatcher';

/**
 * Calculates a score for how well a recipe matches user's selected pantry ingredients
 */
export function calculateRecipePantryScore(
  recipe: Recipe,
  pantryIngredientIds: string[] = [],
  clearFridgeMode: boolean = false
): { score: number; matchedCount: number; totalCount: number; matchedPantryCount: number } {
  if (!pantryIngredientIds || pantryIngredientIds.length === 0) {
    return { score: 0, matchedCount: 0, totalCount: 0, matchedPantryCount: 0 };
  }
  const nonSeasonings = recipe.ingredients.filter(
    i => i.category !== '调料辅料' && !isSeasoningOrAuxiliary(i.category, i.name)
  );
  let matched = 0;
  for (const ing of nonSeasonings) {
    if (isIngredientMatched(ing, pantryIngredientIds)) {
      matched++;
    }
  }
  const uniquePantryMatched = getRecipeMatchedPantryIds(recipe, pantryIngredientIds).length;
  const total = nonSeasonings.length;
  const missing = Math.max(0, total - matched);
  const ratio = total > 0 ? matched / total : 0;
  const multiplier = clearFridgeMode ? 3.0 : 1.8;

  // Strongly prioritize multi-pantry matches (Tier A > Tier B)
  const multiMatchBonus = uniquePantryMatched >= 2 ? (uniquePantryMatched - 1) * 85 : 0;
  const score = (uniquePantryMatched * 60 + multiMatchBonus + ratio * 80 - missing * 6) * multiplier;

  return { score, matchedCount: matched, totalCount: total, matchedPantryCount: uniquePantryMatched };
}
