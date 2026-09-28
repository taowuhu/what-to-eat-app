import { generateDayMealPlan } from '../src/utils/dayPlanGenerator';
import { composeMeal, isPureStapleRecipe } from '../src/utils/mealComposer';
import { validateMealNutrition } from '../src/utils/nutrition';
import { ALL_RECIPES } from '../src/data/recipes';
import { UserProfile, QuickFilterId } from '../src/types';

const defaultProfile: UserProfile = {
  gender: 'male',
  age: 28,
  height: 175,
  weight: 68,
  activityLevel: 'light',
  weeklyWorkouts: 2,
  goal: 'maintain',
  dietaryPreferences: ['balanced'],
  defaultServings: 1,
  strictlyExclude: [],
  dislikes: [],
};

const samplePantry = ['ing_egg', 'ing_chicken_breast', 'ing_rice', 'ing_tomato', 'ing_tofu'];

interface TestResult {
  scenario: string;
  runs: number;
  failures: number;
  failureReasons: string[];
  sampleMealPlans: string[];
}

function runScenarioTest(
  scenarioName: string,
  runs: number,
  filters: QuickFilterId[],
  pantryIds: string[] = [],
  clearFridge: boolean = false
): TestResult {
  let failures = 0;
  const failureReasons: string[] = [];
  const sampleMealPlans: string[] = [];

  for (let i = 0; i < runs; i++) {
    try {
      const plan = generateDayMealPlan(defaultProfile, pantryIds, clearFridge, filters);

      // Verify breakfast
      const bkVal = validateMealNutrition(plan.breakfast.recipes, 'breakfast', defaultProfile);
      if (!bkVal.isComplete) {
        failures++;
        failureReasons.push(`[${scenarioName} Run ${i+1}] Breakfast incomplete: ${plan.breakfast.recipes.map(r=>r.name).join('+')} Issues: ${bkVal.issues.join(';')}`);
      }

      // Check single plain components
      if (plan.breakfast.recipes.length === 1) {
        const single = plan.breakfast.recipes[0];
        if (single.name.includes('馒头') || single.name.includes('米饭') || single.id === 'cmp_boiled_egg' || single.id === 'cmp_warm_milk') {
          failures++;
          failureReasons.push(`[${scenarioName} Run ${i+1}] Isolated component as breakfast: ${single.name}`);
        }
      }

      // Verify lunch
      const luVal = validateMealNutrition(plan.lunch.recipes, 'lunch', defaultProfile);
      if (!luVal.isComplete) {
        failures++;
        failureReasons.push(`[${scenarioName} Run ${i+1}] Lunch incomplete: ${plan.lunch.recipes.map(r=>r.name).join('+')} Issues: ${luVal.issues.join(';')}`);
      }
      if (plan.lunch.recipes.length === 1 && (plan.lunch.recipes[0].name.includes('白米饭') || isPureStapleRecipe(plan.lunch.recipes[0]))) {
        failures++;
        failureReasons.push(`[${scenarioName} Run ${i+1}] Only rice in lunch: ${plan.lunch.recipes[0].name}`);
      }

      // Verify dinner
      const diVal = validateMealNutrition(plan.dinner.recipes, 'dinner', defaultProfile);
      if (!diVal.isComplete) {
        failures++;
        failureReasons.push(`[${scenarioName} Run ${i+1}] Dinner incomplete: ${plan.dinner.recipes.map(r=>r.name).join('+')} Issues: ${diVal.issues.join(';')}`);
      }
      if (plan.dinner.recipes.length === 1 && (plan.dinner.recipes[0].name.includes('白米饭') || isPureStapleRecipe(plan.dinner.recipes[0]))) {
        failures++;
        failureReasons.push(`[${scenarioName} Run ${i+1}] Only rice in dinner: ${plan.dinner.recipes[0].name}`);
      }

      if (i < 3) {
        sampleMealPlans.push(
          `  • 早餐: ${plan.breakfast.recipes.map(r => r.name).join(' + ')} (${plan.breakfast.calories} kcal, P:${plan.breakfast.protein}g) [${bkVal.isComplete ? '完整OK' : '不完整'}]\n` +
          `  • 午餐: ${plan.lunch.recipes.map(r => r.name).join(' + ')} (${plan.lunch.calories} kcal, P:${plan.lunch.protein}g) [${luVal.isComplete ? '完整OK' : '不完整'}]\n` +
          `  • 晚餐: ${plan.dinner.recipes.map(r => r.name).join(' + ')} (${plan.dinner.calories} kcal, P:${plan.dinner.protein}g) [${diVal.isComplete ? '完整OK' : '不完整'}]\n` +
          `  • 全天: ${plan.totalCalories} kcal, P:${plan.totalProtein}g, C:${plan.totalCarbs}g, F:${plan.totalFat}g`
        );
      }
    } catch (err: any) {
      failures++;
      failureReasons.push(`[${scenarioName} Run ${i+1}] Runtime exception: ${err.message || err}`);
    }
  }

  return {
    scenario: scenarioName,
    runs,
    failures,
    failureReasons,
    sampleMealPlans,
  };
}

console.log('================================================================');
console.log('V0.4.7 Meal Nutrition Guardrails - Automated 50-Run QA Suite');
console.log('================================================================\n');

const scenarios: [string, QuickFilterId[], string[], boolean][] = [
  ['1. 普通模式 (Normal)', [], [], false],
  ['2. 一人食 (Single-person)', ['single_person'], [], false],
  ['3. 懒人模式 (Lazy Mode)', ['lazy_mode'], [], false],
  ['4. 一人食 + 懒人模式 (Single + Lazy)', ['single_person', 'lazy_mode'], [], false],
  ['5. 已设置 Pantry 食材 (Pantry-enabled)', [], samplePantry, false],
  ['6. 清冰箱模式 (Clear Fridge)', ['lazy_mode'], samplePantry, true],
];

let allPassed = true;

for (const [name, filters, pantry, clear] of scenarios) {
  const res = runScenarioTest(name, 50, filters, pantry, clear);
  const passRate = (((res.runs - res.failures) / res.runs) * 100).toFixed(1);
  console.log(`▶ 场景: ${res.scenario}`);
  console.log(`  执行次数: ${res.runs} 次 | 失败数: ${res.failures} | 通过率: ${passRate}%`);
  
  if (res.failures > 0) {
    allPassed = false;
    console.log(`  ❌ 失败详情 (前5条):`);
    res.failureReasons.slice(0, 5).forEach(f => console.log(`     ${f}`));
  } else {
    console.log(`  ✅ 全部通过！三餐均符合 V0.4.7 营养组合 Guardrail`);
  }

  console.log(`  采样示例:`);
  res.sampleMealPlans.forEach(s => console.log(s));
  console.log('----------------------------------------------------------------\n');
}

// Also test direct composeMeal for edge cases (e.g. 100 iterations of pure components)
console.log('▶ 验证单点 composeMeal 营养守卫:');
let composeFailures = 0;
for (let i = 0; i < 50; i++) {
  const bk = composeMeal(ALL_RECIPES, { mealType: 'breakfast', activeFilters: ['lazy_mode'] });
  const valBk = validateMealNutrition(bk.recipes, 'breakfast');
  if (!valBk.isComplete) composeFailures++;

  const lu = composeMeal(ALL_RECIPES, { mealType: 'lunch', activeFilters: ['lazy_mode', 'single_person'] });
  const valLu = validateMealNutrition(lu.recipes, 'lunch');
  if (!valLu.isComplete) composeFailures++;
}

console.log(`  50 次 composeMeal 极限压力测试: 失败数 ${composeFailures}`);

if (allPassed && composeFailures === 0) {
  console.log('\n🎉 ALL 350 QA RUNS PASSED WITH 100% SUCCESS RATE!');
} else {
  console.log('\n⚠️ Some tests failed, check logs above.');
  process.exit(1);
}
