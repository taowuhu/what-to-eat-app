import { ALL_RECIPES } from '../src/data/recipes/index';
import {
  isTrueIntegratedMealRecipe,
  isTrueVegetableRecipe,
  isTrueStapleRecipe,
  auditMealCompleteness,
} from '../src/utils/mealComposer';
import { calculateRecipeScore } from '../src/utils/scoringEngine';
import { MealComplexity } from '../src/types';
import {
  getRecipeMatchedPantryIds,
  getComboMatchedPantryIds,
  auditMealPantryCoverage,
} from '../src/utils/ingredientMatcher';
import { CANONICAL_ID_MAP } from '../src/data/canonicalIngredients';
import { DEFAULT_USER_PROFILE } from '../src/data/defaultProfile';

interface Candidate {
  recipes: typeof ALL_RECIPES;
  coverage: number;
  matchedPantryIds: string[];
  complexity: MealComplexity;
  onePot: boolean;
  cookwareCount: number;
  activeTimeMinutes: number;
  passiveTimeMinutes: number;
  isLazyCompatible: boolean;
  score: number;
}

function hasIngredientConflict(a: any, b: any): boolean {
  const dominantKeywords = ['番茄', '西红柿', '鸡蛋', '土豆', '胡萝卜', '西兰花', '豆腐', '黄瓜', '洋葱'];
  for (const kw of dominantKeywords) {
    const aHas = a.name.includes(kw) || a.ingredients?.some((i: any) => i.name.includes(kw));
    const bHas = b.name.includes(kw) || b.ingredients?.some((i: any) => i.name.includes(kw));
    if (aHas && bHas) return true;
  }
  return false;
}

export function composeMealWithMaxCoverage(
  pool: typeof ALL_RECIPES,
  pantryIngredientIds: string[],
  activeFilters: string[],
  historyRecipeIds: string[] = []
) {
  const hasPantry = pantryIngredientIds.length > 0;
  const isLazyMode = activeFilters.includes('lazy_mode');

  const safeIntegrated = pool.filter(r => isTrueIntegratedMealRecipe(r));
  const safeMains = pool.filter(r => r.category === 'main' && !isTrueIntegratedMealRecipe(r));
  const safeVegs = pool.filter(r => isTrueVegetableRecipe(r) && (!r.proteinSource || r.proteinSource === 'none'));
  const safeStaples = pool.filter(r => r.category === 'staple' && !isTrueIntegratedMealRecipe(r));

  const candidates: Candidate[] = [];

  // A. Single integrated
  for (const r of safeIntegrated) {
    const m = getRecipeMatchedPantryIds(r, pantryIngredientIds);
    const onePot = Boolean(r.onePot || r.tags.includes('电饭煲') || r.equipment?.includes('电饭煲'));
    const cookware = r.cookwareCount || (onePot ? 1 : 2);
    const active = r.activeTimeMinutes || r.prepTimeMinutes || 7;
    const passive = r.passiveTimeMinutes || r.cookTimeMinutes || 25;
    candidates.push({
      recipes: [r],
      coverage: m.length,
      matchedPantryIds: m,
      complexity: 'simple',
      onePot,
      cookwareCount: cookware,
      activeTimeMinutes: active,
      passiveTimeMinutes: passive,
      isLazyCompatible: true,
      score: 0,
    });
  }

  // B. Integrated + quick side
  for (const r of safeIntegrated) {
    const mR = getRecipeMatchedPantryIds(r, pantryIngredientIds);
    const unmatched = pantryIngredientIds.filter(p => !mR.includes(p));
    if (unmatched.length > 0) {
      const matchingSides = safeVegs.filter(v =>
        getRecipeMatchedPantryIds(v, unmatched).length > 0 &&
        !hasIngredientConflict(r, v)
      );
      for (const side of matchingSides) {
        const comboM = getComboMatchedPantryIds([r, side], pantryIngredientIds);
        const active = (r.activeTimeMinutes || 6) + (side.activeTimeMinutes || side.prepTimeMinutes || 2);
        const passive = Math.max(r.passiveTimeMinutes || 25, side.passiveTimeMinutes || 5);
        candidates.push({
          recipes: [r, side],
          coverage: comboM.length,
          matchedPantryIds: comboM,
          complexity: 'simple',
          onePot: false,
          cookwareCount: 2,
          activeTimeMinutes: active,
          passiveTimeMinutes: passive,
          isLazyCompatible: active <= 12,
          score: 0,
        });
      }
    }
  }

  // C. Main with veg + staple (2-dish complete meal)
  for (const main of safeMains) {
    const hasVeg = Boolean(main.ingredients?.some((i: any) => i.category === '蔬菜菌菇')) || isTrueVegetableRecipe(main);
    if (hasVeg) {
      const staple = safeStaples[0];
      const comboM = getComboMatchedPantryIds([main, staple], pantryIngredientIds);
      if (comboM.length > 0) {
        const audit = auditMealCompleteness([main, staple], 'lunch');
        if (audit.isComplete) {
          const active = (main.activeTimeMinutes || 5) + 1;
          const passive = Math.max(main.passiveTimeMinutes || 10, staple.passiveTimeMinutes || 15);
          candidates.push({
            recipes: [main, staple],
            coverage: comboM.length,
            matchedPantryIds: comboM,
            complexity: 'simple',
            onePot: false,
            cookwareCount: 2,
            activeTimeMinutes: active,
            passiveTimeMinutes: passive,
            isLazyCompatible: (main.activeTimeMinutes || 5) <= 8,
            score: 0,
          });
        }
      }
    }
  }

  // D. Standard 3-dish (Main + Veg + Staple)
  for (const main of safeMains) {
    const mainM = getRecipeMatchedPantryIds(main, pantryIngredientIds);
    const unmatched = pantryIngredientIds.filter(p => !mainM.includes(p));
    for (const veg of safeVegs) {
      if (hasIngredientConflict(main, veg)) continue;
      if (unmatched.length > 0 && getRecipeMatchedPantryIds(veg, unmatched).length === 0) continue;
      const staple = safeStaples[0];
      const comboM = getComboMatchedPantryIds([main, veg, staple], pantryIngredientIds);
      if (comboM.length === 0) continue;
      const active = (main.activeTimeMinutes || 5) + (veg.activeTimeMinutes || 4) + 1;
      const passive = Math.max(main.passiveTimeMinutes || 10, veg.passiveTimeMinutes || 5, staple.passiveTimeMinutes || 15);
      const cookware = Math.min(3, (main.cookwareCount || 1) + (veg.cookwareCount || 1));
      candidates.push({
        recipes: [main, veg, staple],
        coverage: comboM.length,
        matchedPantryIds: comboM,
        complexity: 'standard',
        onePot: false,
        cookwareCount: cookware,
        activeTimeMinutes: active,
        passiveTimeMinutes: passive,
        isLazyCompatible: active <= 12 && cookware <= 2,
        score: 0,
      });
    }
  }

  // 1. Mode filtering
  let poolCandidates = isLazyMode ? candidates.filter(c => c.isLazyCompatible) : candidates;
  if (poolCandidates.length === 0) poolCandidates = candidates;

  // 2. Max Achievable Coverage
  const maxAchievable = Math.max(0, ...poolCandidates.map(c => c.coverage));

  // 3. Strict Top Coverage Tier Lock!
  const topTier = poolCandidates.filter(c => c.coverage === maxAchievable);

  // 4. Rank within Top Tier
  for (const c of topTier) {
    let s = 100;
    if (isLazyMode) {
      if (c.onePot) s += 150;
      s += (3 - Math.min(3, c.cookwareCount)) * 40;
      s += Math.max(0, 15 - c.activeTimeMinutes) * 6;
    }
    for (const r of c.recipes) {
      if (historyRecipeIds.includes(r.id)) s -= 120;
    }
    c.score = s;
  }

  topTier.sort((a, b) => b.score - a.score);

  // Softmax-like sampling from top tier
  const topPool = topTier.slice(0, Math.max(1, Math.min(6, Math.ceil(topTier.length * 0.6))));
  const minScore = Math.min(...topPool.map(c => c.score));
  const weights = topPool.map(c => Math.exp((c.score - minScore) / 40));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;
  let chosen = topPool[0];
  for (let i = 0; i < topPool.length; i++) {
    if (rand < weights[i]) {
      chosen = topPool[i];
      break;
    }
    rand -= weights[i];
  }

  const selectedRecipes = chosen.recipes;
  const isOnePot = chosen.onePot && selectedRecipes.length === 1;
  const cookwareCount = isOnePot ? 1 : chosen.cookwareCount;
  const activeTimeMinutes = chosen.activeTimeMinutes;
  const matchedPantry = chosen.matchedPantryIds;
  const unusedPantry = pantryIngredientIds.filter(p => !matchedPantry.includes(p));

  const primaryName = selectedRecipes[0].name.replace('家常', '').replace('经典', '');
  let title = '';
  if (isLazyMode) {
    if (isOnePot) {
      title = `电饭煲懒人餐 · ${primaryName}`;
    } else {
      title = `少洗锅懒人餐 · ${primaryName}`;
    }
  } else {
    title = `荤素均衡餐 · ${primaryName}`;
  }

  return {
    title,
    recipes: selectedRecipes,
    matchedPantry,
    unusedPantry,
    coverage: `${matchedPantry.length}/${pantryIngredientIds.length}`,
    coverageRatio: matchedPantry.length / pantryIngredientIds.length,
    onePot: isOnePot,
    cookwareCount,
    activeTimeMinutes,
    maxAchievable,
  };
}

console.log('=== Human Gate 20 Consecutive Runs: Beef + Broccoli + Lazy ===');
let c2 = 0, c1 = 0, c0 = 0;
const history: string[] = [];

for (let i = 0; i < 20; i++) {
  const res = composeMealWithMaxCoverage(ALL_RECIPES, ['beef', 'broccoli'], ['lazy_mode'], history.slice(-4));
  const comps = res.recipes.map(r => r.name);
  console.log(`Run ${i + 1}: [${res.title}] -> Components: [${comps.join(' + ')}] | matched: [${res.matchedPantry.join(',')}] | unused: [${res.unusedPantry.join(',')}] | coverage: ${res.coverage} | onePot: ${res.onePot} | cookware: ${res.cookwareCount} | active: ${res.activeTimeMinutes}m`);
  
  if (res.coverage === '2/2') c2++;
  else if (res.coverage === '1/2') c1++;
  else c0++;

  history.push(...res.recipes.map(r => r.id));
}

console.log('\nStatistics for 20 runs:');
console.log(`2/2: ${c2}/20 (${(c2/20)*100}%)`);
console.log(`1/2: ${c1}/20 (${(c1/20)*100}%)`);
console.log(`0/2: ${c0}/20 (${(c0/20)*100}%)`);
