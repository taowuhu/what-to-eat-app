import { Recipe } from '../types';
import { isIngredientMatched } from './ingredientMatcher';

/**
 * Calculates a score for how well a recipe matches user's selected pantry ingredients
 */
export function calculateRecipePantryScore(
  recipe: Recipe,
  pantryIngredientIds: string[] = [],
  clearFridgeMode: boolean = false
): { score: number; matchedCount: number; totalCount: number } {
  if (!pantryIngredientIds || pantryIngredientIds.length === 0) {
    return { score: 0, matchedCount: 0, totalCount: 0 };
  }
  const nonSeasonings = recipe.ingredients.filter(i => i.category !== '调料辅料');
  let matched = 0;
  for (const ing of nonSeasonings) {
    if (isIngredientMatched(ing, pantryIngredientIds)) {
      matched++;
    }
  }
  const total = nonSeasonings.length;
  const missing = total - matched;
  const ratio = total > 0 ? matched / total : 0;
  const multiplier = clearFridgeMode ? 2.5 : 1.4;
  const score = (matched * 45 + ratio * 60 - missing * 8) * multiplier;
  return { score, matchedCount: matched, totalCount: total };
}
