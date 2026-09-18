import { ALL_RECIPES, getRecipeById } from '../src/data/recipes/index';
import { composeMeal } from '../src/utils/mealComposer';
import { generateMealRecommendation, generateAlternativeMeals } from '../src/utils/recommender';
import { generateDayMealPlan, generateMealSlot, buildDayGroceryList } from '../src/utils/dayPlanGenerator';
import { UserProfile, Recipe } from '../src/types';

console.log('========================================================');
console.log('AUDIT REPORT: Content and Business Logic Authenticity');
console.log('========================================================');

// 1. Total Recipe Count & Field Audit
console.log('\n--- 1. Recipe Count and Integrity ---');
console.log('Total ALL_RECIPES count:', ALL_RECIPES.length);

const byCategory: Record<string, number> = {};
const byProtein: Record<string, number> = {};
const duplicateIds = new Set<string>();
const duplicateNames = new Set<string>();
const seenIds = new Set<string>();
const seenNames = new Map<string, string>(); // name -> id
const missingFieldsList: { id: string; name: string; missing: string[] }[] = [];
const vagueIngredientsList: { id: string; name: string; ing: string }[] = [];
const briefStepsList: { id: string; name: string; stepText: string }[] = [];

for (const r of ALL_RECIPES) {
  byCategory[r.category] = (byCategory[r.category] || 0) + 1;
  byProtein[r.proteinSource] = (byProtein[r.proteinSource] || 0) + 1;

  if (seenIds.has(r.id)) duplicateIds.add(r.id);
  seenIds.add(r.id);

  if (seenNames.has(r.name)) {
    duplicateNames.add(`${r.name} (id1: ${seenNames.get(r.name)}, id2: ${r.id})`);
  }
  seenNames.set(r.name, r.id);

  // Check required fields
  const missing: string[] = [];
  if (!r.name) missing.push('name');
  if (!r.category) missing.push('category');
  if (typeof r.timeMinutes !== 'number' || r.timeMinutes <= 0) missing.push('timeMinutes');
  if (!r.difficulty) missing.push('difficulty');
  if (!r.servings || r.servings <= 0) missing.push('servings');
  if (!Array.isArray(r.ingredients) || r.ingredients.length === 0) missing.push('ingredients');
  if (!Array.isArray(r.tags) || r.tags.length === 0) missing.push('tags');
  if (!Array.isArray(r.steps) || r.steps.length === 0) missing.push('steps');
  if (!r.summary) missing.push('summary');
  if (!r.imageUrl) missing.push('imageUrl');
  if (!r.nutritionEstimate || typeof r.calories !== 'number') missing.push('nutrition');

  if (missing.length > 0) {
    missingFieldsList.push({ id: r.id, name: r.name, missing });
  }

  // Check for vague ingredients (like "适量" as main ingredient amount)
  for (const ing of r.ingredients) {
    if (ing.category !== '调料辅料' && (ing.unit === '适量' || ing.unit === '少许' || ing.amount <= 0)) {
      vagueIngredientsList.push({ id: r.id, name: r.name, ing: `${ing.name}: ${ing.amount}${ing.unit}` });
    }
  }

  // Check for overly brief step actions (e.g. "放入锅中炒熟即可" or < 15 chars)
  for (const step of r.steps) {
    const text = step.action || '';
    if (text.includes('炒熟即可') || text.includes('煮熟即可') || text.length < 15) {
      briefStepsList.push({ id: r.id, name: r.name, stepText: text });
    }
  }
}

console.log('Category breakdown:', byCategory);
console.log('Protein breakdown:', byProtein);
console.log('Duplicate IDs count:', duplicateIds.size, Array.from(duplicateIds));
console.log('Duplicate Names count:', duplicateNames.size, Array.from(duplicateNames));
console.log('Recipes with missing fields:', missingFieldsList.length, missingFieldsList);
console.log('Vague main ingredients count:', vagueIngredientsList.length, vagueIngredientsList.slice(0, 5));
console.log('Brief steps count:', briefStepsList.length, briefStepsList.slice(0, 5));

console.log('\n--- 2. Seasonings & Steps completeness ---');
const missingSeasonings = ALL_RECIPES.filter(r => !r.seasonings || r.seasonings.length === 0);
console.log('Recipes missing seasonings array:', missingSeasonings.length);
if (missingSeasonings.length > 0) {
  console.log('Sample missing seasonings IDs:', missingSeasonings.slice(0, 5).map(r => r.id));
}
