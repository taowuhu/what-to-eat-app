import { generateMealRecommendation } from '../src/utils/recommender';
import { DEFAULT_USER_PROFILE } from '../src/utils/nutrition';
import { ALL_RECIPES } from '../src/data/recipes/index';

console.log('Total recipes:', ALL_RECIPES.length);

// 1. Check if there are any true onePot recipes matching both beef and broccoli
const trueOnePotBeefBroccoli = ALL_RECIPES.filter(r => {
  const isOnePot = r.onePot || r.tags.includes('电饭煲') || r.equipment?.includes('电饭煲');
  const hasBeef = r.ingredients.some(i => i.name.includes('牛'));
  const hasBroccoli = r.ingredients.some(i => i.name.includes('西兰花'));
  return isOnePot && hasBeef && hasBroccoli;
});

console.log('True one-pot recipes with both beef AND broccoli:', trueOnePotBeefBroccoli.length);
if (trueOnePotBeefBroccoli.length > 0) {
  console.log('Found:', trueOnePotBeefBroccoli.map(r => r.name));
} else {
  console.log('-> No true one-pot recipe has BOTH beef and broccoli!');
}

console.log('\n--- Test 20 Runs: Pantry [beef, broccoli] + Lazy Mode (ClearFridge = false) ---');
let count2of2 = 0;
let count1of2 = 0;
let onePotCount = 0;
let totalCookware = 0;
let totalActiveTime = 0;

for (let i = 0; i < 20; i++) {
  const meal = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    mealType: 'lunch',
    activeFilters: ['lazy_mode'],
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: false,
  });

  const matched = meal.pantryCoverage?.matchedPantryCount || 0;
  const total = meal.pantryCoverage?.selectedPantryCount || 2;
  const isOnePot = Boolean(meal.onePot || meal.isOnePot);
  const cookware = meal.cookwareCount || 1;
  const activeTime = meal.activeTimeMinutes || 0;
  const unused = (meal.pantryCoverage?.unusedPantryIngredients || []).join('、') || '无';

  if (matched === 2) count2of2++;
  if (matched === 1) count1of2++;
  if (isOnePot) onePotCount++;
  totalCookware += cookware;
  totalActiveTime += activeTime;

  console.log(`[Run ${(i + 1).toString().padStart(2, ' ')}] ${meal.comboTitle}`);
  console.log(`  Recipes: ${meal.recipes.map(r => r.name).join(' + ')}`);
  console.log(`  Coverage: ${matched}/${total} | onePot: ${isOnePot} | cookware: ${cookware} | active: ${activeTime}min | unused: ${unused}`);
}

console.log('\n=== Summary: Lazy Mode (ClearFridge = false) ===');
console.log(`2/2 Coverage: ${count2of2}/20 (${(count2of2 / 20) * 100}%)`);
console.log(`1/2 Coverage: ${count1of2}/20 (${(count1of2 / 20) * 100}%)`);
console.log(`onePot ratio: ${onePotCount}/20 (${(onePotCount / 20) * 100}%)`);
console.log(`Avg cookware: ${(totalCookware / 20).toFixed(2)}`);
console.log(`Avg active time: ${(totalActiveTime / 20).toFixed(1)} min`);

console.log('\n--- Test 10 Runs: Pantry [beef, broccoli] + Lazy Mode + ClearFridge = true ---');
let cf2of2 = 0;
let cf1of2 = 0;
let cfOnePotCount = 0;
let cfCookware = 0;
let cfActive = 0;

for (let i = 0; i < 10; i++) {
  const meal = generateMealRecommendation({
    userProfile: DEFAULT_USER_PROFILE,
    mealType: 'lunch',
    activeFilters: ['lazy_mode'],
    pantryIngredientIds: ['beef', 'broccoli'],
    clearFridgeMode: true,
  });

  const matched = meal.pantryCoverage?.matchedPantryCount || 0;
  const total = meal.pantryCoverage?.selectedPantryCount || 2;
  const isOnePot = Boolean(meal.onePot || meal.isOnePot);
  const cookware = meal.cookwareCount || 1;
  const activeTime = meal.activeTimeMinutes || 0;
  const unused = (meal.pantryCoverage?.unusedPantryIngredients || []).join('、') || '无';

  if (matched === 2) cf2of2++;
  if (matched === 1) cf1of2++;
  if (isOnePot) cfOnePotCount++;
  cfCookware += cookware;
  cfActive += activeTime;

  console.log(`[CF Run ${(i + 1).toString().padStart(2, ' ')}] ${meal.comboTitle}`);
  console.log(`  Recipes: ${meal.recipes.map(r => r.name).join(' + ')}`);
  console.log(`  Coverage: ${matched}/${total} | onePot: ${isOnePot} | cookware: ${cookware} | active: ${activeTime}min | unused: ${unused}`);
}

console.log('\n=== Summary: Lazy Mode + ClearFridge = true ===');
console.log(`2/2 Coverage: ${cf2of2}/10 (${(cf2of2 / 10) * 100}%)`);
console.log(`1/2 Coverage: ${cf1of2}/10 (${(cf1of2 / 10) * 100}%)`);
console.log(`onePot ratio: ${cfOnePotCount}/10 (${(cfOnePotCount / 10) * 100}%)`);
console.log(`Avg cookware: ${(cfCookware / 10).toFixed(2)}`);
console.log(`Avg active time: ${(cfActive / 10).toFixed(1)} min`);
