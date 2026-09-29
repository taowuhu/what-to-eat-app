import { ALL_RECIPES } from '../src/data/recipes/index';
import { isTrueIntegratedMealRecipe, isTrueVegetableRecipe, isTrueStapleRecipe, auditMealCompleteness } from '../src/utils/mealComposer';
import { getRecipeMatchedPantryIds, getComboMatchedPantryIds } from '../src/utils/ingredientMatcher';
import { CANONICAL_ID_MAP } from '../src/data/canonicalIngredients';

const pantryIngredientIds = ['beef', 'broccoli'];
const isLazyMode = true;
const pool = ALL_RECIPES;

const integrated = pool.filter(r => isTrueIntegratedMealRecipe(r));
const mains = pool.filter(r => r.category === 'main' && !isTrueIntegratedMealRecipe(r));
const vegs = pool.filter(r => isTrueVegetableRecipe(r) && (!r.proteinSource || r.proteinSource === 'none'));
const staples = pool.filter(r => r.category === 'staple' && !isTrueIntegratedMealRecipe(r));

interface Candidate {
  recipes: typeof ALL_RECIPES;
  coverage: number;
  matched: string[];
  cookwareCount: number;
  onePot: boolean;
  activeTime: number;
  isLazy: boolean;
}

const candidates: Candidate[] = [];

// 1. Single integrated
for (const r of integrated) {
  const m = getRecipeMatchedPantryIds(r, pantryIngredientIds);
  const onePot = Boolean(r.onePot || r.tags.includes('电饭煲') || r.equipment?.includes('电饭煲'));
  candidates.push({
    recipes: [r],
    coverage: m.length,
    matched: m,
    cookwareCount: r.cookwareCount || (onePot ? 1 : 2),
    onePot,
    activeTime: r.activeTimeMinutes || 7,
    isLazy: true,
  });
}

// 2. Integrated + quick side
for (const r of integrated) {
  const mR = getRecipeMatchedPantryIds(r, pantryIngredientIds);
  const unmatched = pantryIngredientIds.filter(p => !mR.includes(p));
  if (unmatched.length > 0) {
    const matchingSides = vegs.filter(v => getRecipeMatchedPantryIds(v, unmatched).length > 0);
    for (const side of matchingSides) {
      const comboM = getComboMatchedPantryIds([r, side], pantryIngredientIds);
      const active = (r.activeTimeMinutes || 6) + (side.activeTimeMinutes || 2);
      candidates.push({
        recipes: [r, side],
        coverage: comboM.length,
        matched: comboM,
        cookwareCount: 2,
        onePot: false,
        activeTime: active,
        isLazy: active <= 12,
      });
    }
  }
}

// 3. Main with veg + staple
for (const main of mains) {
  const hasVeg = Boolean(main.ingredients?.some(i => i.category === '蔬菜菌菇')) || isTrueVegetableRecipe(main);
  if (hasVeg) {
    const staple = staples[0];
    const comboM = getComboMatchedPantryIds([main, staple], pantryIngredientIds);
    if (comboM.length > 0) {
      const audit = auditMealCompleteness([main, staple], 'lunch');
      if (audit.isComplete) {
        const active = (main.activeTimeMinutes || 5) + 1;
        candidates.push({
          recipes: [main, staple],
          coverage: comboM.length,
          matched: comboM,
          cookwareCount: 2,
          onePot: false,
          activeTime: active,
          isLazy: (main.activeTimeMinutes || 5) <= 8,
        });
      }
    }
  }
}

console.log('Total candidates:', candidates.length);
const lazyCandidates = candidates.filter(c => c.isLazy);
console.log('Lazy candidates:', lazyCandidates.length);

const maxAchievable = Math.max(...lazyCandidates.map(c => c.coverage));
console.log('Max Achievable Coverage:', maxAchievable);

const topTier = lazyCandidates.filter(c => c.coverage === maxAchievable);
console.log('Top Tier candidates count:', topTier.length);
for (const c of topTier) {
  console.log(' -', c.recipes.map(r => r.name).join(' + '), '| coverage:', c.coverage, 'onePot:', c.onePot, 'cookware:', c.cookwareCount, 'activeTime:', c.activeTime);
}
