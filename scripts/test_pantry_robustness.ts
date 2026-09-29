import { generateMealRecommendation, generateAlternativeMeals } from '../src/utils/recommender';
import { DEFAULT_USER_PROFILE } from '../src/utils/nutrition';
import { getRecipeMatchedPantryIds } from '../src/utils/ingredientMatcher';

console.log('=== Test 1: r_broccoli_beef in history/avoided ===');
for (let i = 0; i < 5; i++) {
  const rec = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    pantryIngredientIds: ['beef', 'broccoli'],
    historyRecipeIds: ['r_broccoli_beef'],
    mealType: 'lunch',
    servings: 1,
  });
  const m = Array.from(new Set(rec.recipes.flatMap(r => getRecipeMatchedPantryIds(r, ['beef', 'broccoli']))));
  console.log(` - Run ${i+1}: ${rec.recipes.map(r => r.name).join(' + ')} | matched: [${m.join(', ')}] (${m.length}/2)`);
}

console.log('\n=== Test 2: Alternative 3 meals with beef + broccoli ===');
const alts = generateAlternativeMeals(3, {
  userProfile: DEFAULT_USER_PROFILE,
  pantryIngredientIds: ['beef', 'broccoli'],
  mealType: 'lunch',
  servings: 1,
});
alts.forEach((alt, idx) => {
  const m = Array.from(new Set(alt.recipes.flatMap(r => getRecipeMatchedPantryIds(r, ['beef', 'broccoli']))));
  console.log(` - Alt ${idx+1}: ${alt.recipes.map(r => r.name).join(' + ')} | matched: [${m.join(', ')}] (${m.length}/2)`);
});

console.log('\n=== Test 3: Clear fridge mode with beef + broccoli ===');
for (let i = 0; i < 3; i++) {
  const rec = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: true,
    mealType: 'dinner',
    servings: 2,
  });
  const m = Array.from(new Set(rec.recipes.flatMap(r => getRecipeMatchedPantryIds(r, ['beef', 'broccoli']))));
  console.log(` - ClearFridge Run ${i+1}: ${rec.recipes.map(r => r.name).join(' + ')} | matched: [${m.join(', ')}] (${m.length}/2) | reason: ${rec.recommendationReason}`);
}

console.log('\n=== Test 4: Single pantry ingredient (only beef) ===');
for (let i = 0; i < 3; i++) {
  const rec = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    pantryIngredientIds: ['beef'],
    mealType: 'lunch',
    servings: 1,
  });
  const m = Array.from(new Set(rec.recipes.flatMap(r => getRecipeMatchedPantryIds(r, ['beef']))));
  console.log(` - Beef only Run ${i+1}: ${rec.recipes.map(r => r.name).join(' + ')} | matched: [${m.join(', ')}] (${m.length}/1)`);
}

console.log('\n=== Test 5: Single pantry ingredient (only broccoli) ===');
for (let i = 0; i < 3; i++) {
  const rec = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    pantryIngredientIds: ['broccoli'],
    mealType: 'lunch',
    servings: 1,
  });
  const m = Array.from(new Set(rec.recipes.flatMap(r => getRecipeMatchedPantryIds(r, ['broccoli']))));
  console.log(` - Broccoli only Run ${i+1}: ${rec.recipes.map(r => r.name).join(' + ')} | matched: [${m.join(', ')}] (${m.length}/1)`);
}
