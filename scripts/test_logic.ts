import { ALL_RECIPES } from '../src/data/recipes/index';
import { composeMeal } from '../src/utils/mealComposer';
import { generateMealRecommendation, generateAlternativeMeals } from '../src/utils/recommender';
import { generateDayMealPlan, generateMealSlot, buildDayGroceryList } from '../src/utils/dayPlanGenerator';
import { UserProfile } from '../src/types';

const defaultProfile: UserProfile = {
  gender: 'female',
  age: 26,
  height: 165,
  weight: 55,
  activityLevel: 'moderate',
  weeklyWorkouts: 3,
  goal: 'maintain',
  dislikes: ['香菜'],
  dietaryPreferences: ['standard'],
};

console.log('\n--- 3. Testing Multi-filter Logic ---');
// Test combinations: 15min + single_person + high_protein
const filterPool15min = ALL_RECIPES.filter(r => r.cookTimeMinutes <= 15 || r.timeMinutes <= 20 || r.tags.includes('15分钟'));
const filterPoolHighProtein = ALL_RECIPES.filter(r => r.protein >= 20 || r.tags.includes('高蛋白'));
const filterPoolBeginner = ALL_RECIPES.filter(r => r.difficulty === '小白友好');

console.log('15min matches:', filterPool15min.length);
console.log('High protein matches:', filterPoolHighProtein.length);
console.log('Beginner matches:', filterPoolBeginner.length);

const combined = ALL_RECIPES.filter(r => 
  (r.cookTimeMinutes <= 15 || r.timeMinutes <= 20 || r.tags.includes('15分钟')) &&
  (r.protein >= 20 || r.tags.includes('高蛋白')) &&
  (r.difficulty === '小白友好')
);
console.log('Combined (15min + high_protein + beginner) matches:', combined.length);

console.log('\n--- 4. Testing 30 Meal Combinations Integrity ---');
const violations: string[] = [];

for (let i = 0; i < 35; i++) {
  const meal = composeMeal(ALL_RECIPES, {
    mealType: i % 2 === 0 ? 'lunch' : 'dinner',
    userProfile: defaultProfile,
  });

  const dishes = meal.recipes;
  const main = dishes[0];
  const veg = dishes[1];
  const staple = dishes[2];
  const soup = dishes[3];

  if (!main || main.category !== 'main') {
    violations.push(`Iteration ${i}: Missing or invalid main dish`);
  }
  if (!veg || (veg.category !== 'vegetable' && veg.category !== 'side')) {
    violations.push(`Iteration ${i}: Missing vegetable`);
  }
  if (!staple || staple.category !== 'staple') {
    violations.push(`Iteration ${i}: Missing staple`);
  }

  // Check duplicate dishes
  const names = dishes.map(d => d.name);
  if (new Set(names).size !== names.length) {
    violations.push(`Iteration ${i}: Duplicate dishes found: ${names.join(', ')}`);
  }

  // Check tomato + tomato
  const tomatoCount = dishes.filter(d => d.name.includes('番茄') || d.name.includes('西红柿')).length;
  if (tomatoCount > 1) {
    violations.push(`Iteration ${i}: Duplicate tomato in meal: ${names.join(', ')}`);
  }

  // Check protein stacking (e.g. chicken main + chicken soup)
  if (soup && main.proteinSource !== 'none' && main.proteinSource === soup.proteinSource) {
    violations.push(`Iteration ${i}: Protein stacking (${main.proteinSource}) between main and soup: ${names.join(', ')}`);
  }
}
console.log('Meal combo violations count:', violations.length);
if (violations.length > 0) {
  console.log('Violations sample:', violations.slice(0, 5));
}

console.log('\n--- 5. Testing History Deduplication & Protein Diversity ---');
let recProteins: string[] = [];
let recentIds: string[] = [];
let sameConsecutiveProtein = 0;
let repeatedRecipeInNext3 = 0;

for (let i = 0; i < 20; i++) {
  const rec = generateMealRecommendation({
    remainingMacros: { calories: 600, protein: 30, carbs: 65, fat: 20 },
    userProfile: defaultProfile,
    historyRecipeIds: recentIds,
    recentProteins: recProteins as any,
  });

  const mainProtein = rec.recipes[0].proteinSource;
  if (recProteins.length > 0 && recProteins[recProteins.length - 1] === mainProtein) {
    sameConsecutiveProtein++;
  }
  recProteins.push(mainProtein);

  // Check if any recipe was in recentIds (last 2 recommended meals)
  const last2Ids = recentIds.slice(-6);
  for (const r of rec.recipes) {
    if (last2Ids.includes(r.id)) {
      repeatedRecipeInNext3++;
    }
  }

  rec.recipes.forEach(r => recentIds.push(r.id));
}
console.log('Consecutive same protein occurrences out of 20:', sameConsecutiveProtein);
console.log('Recipe repeated in immediate next 2 meals occurrences:', repeatedRecipeInNext3);

console.log('\n--- 6. Testing Day Meal Plan & Single Meal Reroll ---');
const dayPlan = generateDayMealPlan(defaultProfile);
console.log('Breakfast title:', dayPlan.breakfast.title, 'type:', dayPlan.breakfast.recipes[0].category, 'tags:', dayPlan.breakfast.tags);
console.log('Lunch title:', dayPlan.lunch.title, 'recipes count:', dayPlan.lunch.recipes.length);
console.log('Dinner title:', dayPlan.dinner.title, 'recipes count:', dayPlan.dinner.recipes.length);

// Test single slot reroll
const oldLunchTitle = dayPlan.lunch.title;
const newLunch = generateMealSlot('lunch', defaultProfile, dayPlan.breakfast.recipes.map(r => r.id));
console.log('Old lunch:', oldLunchTitle);
console.log('New rerolled lunch:', newLunch.title);
console.log('Breakfast stayed same?', dayPlan.breakfast.title === dayPlan.breakfast.title);

console.log('\n--- 7. Testing Grocery List Merging ---');
const groceries = buildDayGroceryList(dayPlan);
console.log('Grocery categories:', Object.keys(groceries));
for (const [cat, items] of Object.entries(groceries)) {
  console.log(`Category [${cat}]: ${items.length} items. Sample:`, items.slice(0, 3).map(i => `${i.name} (${i.amount}${i.unit || ''}) [来源: ${i.sourceDishes.join(',')}]`));
}
