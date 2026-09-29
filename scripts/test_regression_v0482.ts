import { generateMealRecommendation } from '../src/utils/recommender';
import { DEFAULT_USER_PROFILE } from '../src/utils/nutrition';
import { ALL_RECIPES } from '../src/data/recipes/index';

console.log('=== Regression Test Suite for V0.4.8.2 ===');

// 1. Normal Pantry Mode: beef + broccoli (Lazy = false, ClearFridge = false)
console.log('\n--- 1. Normal Pantry Mode: beef + broccoli (Lazy=false, ClearFridge=false) ---');
let normal2of2 = 0;
for (let i = 0; i < 10; i++) {
  const meal = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    mealType: 'dinner',
    activeFilters: [],
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: false,
  });
  const matched = meal.pantryCoverage?.matchedPantryCount || 0;
  if (matched === 2) normal2of2++;
}
console.log(`Normal Pantry 2/2 Coverage: ${normal2of2}/10 (${(normal2of2 / 10) * 100}%)`);

// 2. Clear Fridge Normal: beef + broccoli (Lazy = false, ClearFridge = true)
console.log('\n--- 2. Clear Fridge Normal: beef + broccoli (Lazy=false, ClearFridge=true) ---');
let cfNormal2of2 = 0;
for (let i = 0; i < 10; i++) {
  const meal = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    mealType: 'dinner',
    activeFilters: [],
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: true,
  });
  const matched = meal.pantryCoverage?.matchedPantryCount || 0;
  if (matched === 2) cfNormal2of2++;
}
console.log(`Clear Fridge Normal 2/2 Coverage: ${cfNormal2of2}/10 (${(cfNormal2of2 / 10) * 100}%)`);

// 3. Hard Exclusion: user strictly excludes '牛肉' (even if pantry has beef)
console.log('\n--- 3. Hard Exclusion: strictlyExclude 牛肉 ---');
let beefLeakCount = 0;
for (let i = 0; i < 10; i++) {
  const meal = generateMealRecommendation({
    userProfile: {
      ...DEFAULT_USER_PROFILE,
      strictlyExclude: ['牛肉'],
    },
    mealType: 'lunch',
    activeFilters: ['lazy_mode'],
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: false,
  });
  const hasBeef = meal.recipes.some(r =>
    r.dislikeTags.includes('牛肉') ||
    r.ingredients.some(ing => ing.name.includes('牛'))
  );
  if (hasBeef) beefLeakCount++;
}
console.log(`strictlyExclude 牛肉 leaks: ${beefLeakCount}/10 (Must be 0)`);

// 4. Nutrition Guardrail Check (isComplete)
console.log('\n--- 4. Nutrition Guardrail Check ---');
let nutritionCompleteCount = 0;
for (let i = 0; i < 10; i++) {
  const meal = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    mealType: 'lunch',
    activeFilters: ['lazy_mode'],
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: false,
  });
  if (meal.nutritionValidation?.isComplete) {
    nutritionCompleteCount++;
  }
}
console.log(`Nutrition isComplete: ${nutritionCompleteCount}/10 (Must be 10/10)`);

// 5. Check if any fake recipes were added
console.log('\n--- 5. Recipe Count Check ---');
console.log(`Total recipes in ALL_RECIPES: ${ALL_RECIPES.length}`);

// 6. Check if true one-pot beef+broccoli exists in library
const trueOnePotBeefBroccoli = ALL_RECIPES.filter(r => {
  const isOnePot = r.onePot || r.tags.includes('电饭煲') || r.equipment?.includes('电饭煲');
  const hasBeef = r.ingredients.some(i => i.name.includes('牛'));
  const hasBroccoli = r.ingredients.some(i => i.name.includes('西兰花'));
  return isOnePot && hasBeef && hasBroccoli;
});
console.log(`True one-pot beef + broccoli recipes: ${trueOnePotBeefBroccoli.length}`);
