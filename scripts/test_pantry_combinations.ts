import { generateMealRecommendation } from '../src/utils/recommender';
import { DEFAULT_USER_PROFILE } from '../src/utils/nutrition';
import { getRecipeMatchedPantryIds } from '../src/utils/ingredientMatcher';
import { QuickFilterId, ProteinSource } from '../src/types';

const pantryIds = ['beef', 'broccoli'];

const filterCombos: (QuickFilterId[])[] = [
  [],
  ['single_person'],
  ['lazy_mode'],
  ['15min'],
  ['high_protein'],
  ['single_person', 'lazy_mode'],
  ['single_person', '15min'],
];

const mealTypes: ('lunch' | 'dinner' | 'breakfast')[] = ['lunch', 'dinner', 'breakfast'];
const recentProteinsList: (ProteinSource[] | undefined)[] = [undefined, ['beef'], ['pork'], ['chicken']];

console.log('=== Testing Different Scenarios with Pantry: [beef, broccoli] ===\n');

for (const mealType of mealTypes) {
  for (const filters of filterCombos) {
    for (const recent of [undefined, ['beef'] as ProteinSource[]]) {
      for (let run = 0; run < 3; run++) {
        const rec = generateMealRecommendation({
          userProfile: DEFAULT_USER_PROFILE,
          pantryIngredientIds: pantryIds,
          activeFilters: filters,
          mealType,
          recentProteins: recent,
          servings: 1,
        });

        const allMatched = Array.from(new Set(rec.recipes.flatMap(r => getRecipeMatchedPantryIds(r, pantryIds))));
        if (allMatched.length === 0) {
          console.log(`[ALERT 0-MATCH] mealType=${mealType}, filters=${filters.join('+') || 'none'}, recent=${recent}:`);
          console.log(`  Dishes: ${rec.recipes.map(r => `${r.name} (${r.category})`).join(' + ')}`);
        } else if (allMatched.length === 1 && !allMatched.includes('beef') && !allMatched.includes('broccoli')) {
          console.log(`[UNEXPECTED MATCH]`);
        }
      }
    }
  }
}

console.log('\nDone testing scenarios.');
