import { UserProfile, MacroNutrients, DailyLog, MealType, MealMacroTarget, MealNutritionValidationResult, Recipe } from '../types';

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor Formula
 */
export function calculateBMR(profile: UserProfile): number {
  const { gender, weight, height, age } = profile;
  if (gender === 'male') {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
    return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on activity and workouts
 */
export function calculateTDEE(profile: UserProfile): number {
  const bmr = calculateBMR(profile);
  let multiplier = 1.2;

  switch (profile.activityLevel) {
    case 'sedentary':
      multiplier = 1.2;
      break;
    case 'light':
      multiplier = 1.375;
      break;
    case 'moderate':
      multiplier = 1.55;
      break;
    case 'active':
      multiplier = 1.725;
      break;
  }

  // Adjust slightly for weekly workouts if not already captured
  if (profile.weeklyWorkouts >= 5) {
    multiplier = Math.max(multiplier, 1.65);
  } else if (profile.weeklyWorkouts >= 3) {
    multiplier = Math.max(multiplier, 1.45);
  }

  return Math.round(bmr * multiplier);
}

/**
 * Calculates daily target calories and macronutrient breakdown
 */
export function calculateMacroTargets(profile: UserProfile): MacroNutrients {
  if (profile.customCalorieTarget && profile.customCalorieTarget > 800) {
    const calories = profile.customCalorieTarget;
    const proteinGrams = Math.round(profile.weight * 1.6);
    const fatGrams = Math.round((calories * 0.25) / 9);
    const carbGrams = Math.max(30, Math.round((calories - (proteinGrams * 4 + fatGrams * 9)) / 4));
    return { calories, protein: proteinGrams, carbs: carbGrams, fat: fatGrams };
  }

  const tdee = calculateTDEE(profile);
  const bmr = calculateBMR(profile);
  let targetCalories = tdee;

  let proteinFactor = 1.6; // g per kg

  if (profile.goal === 'fat_loss') {
    // 350-450 kcal deficit, safe floor is BMR
    targetCalories = Math.max(bmr, tdee - 400);
    proteinFactor = 1.8; // higher protein to preserve lean muscle during deficit
  } else if (profile.goal === 'muscle_gain') {
    targetCalories = tdee + 300;
    proteinFactor = 1.8;
  } else {
    // maintain
    targetCalories = tdee;
    proteinFactor = 1.4;
  }

  const proteinGrams = Math.round(profile.weight * proteinFactor);
  // Fat: 25% of energy
  const fatCalories = targetCalories * 0.26;
  const fatGrams = Math.round(fatCalories / 9);
  // Carbs: remaining energy
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - (proteinGrams * 4 + fatGrams * 9));
  const carbGrams = Math.round(remainingCaloriesForCarbs / 4);

  return {
    calories: Math.round(targetCalories),
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  };
}

/**
 * Sums up current day intake from logged records
 */
export function calculateCurrentIntake(dailyLog: DailyLog): MacroNutrients {
  return dailyLog.records.reduce(
    (acc, record) => {
      return {
        calories: acc.calories + (record.calories || 0),
        protein: Math.round((acc.protein + (record.protein || 0)) * 10) / 10,
        carbs: Math.round((acc.carbs + (record.carbs || 0)) * 10) / 10,
        fat: Math.round((acc.fat + (record.fat || 0)) * 10) / 10,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/**
 * Computes remaining nutrients for the day
 */
export function calculateRemainingMacros(
  targets: MacroNutrients,
  current: MacroNutrients
): MacroNutrients {
  return {
    calories: Math.max(0, targets.calories - current.calories),
    protein: Math.max(0, Math.round((targets.protein - current.protein) * 10) / 10),
    carbs: Math.max(0, Math.round((targets.carbs - current.carbs) * 10) / 10),
    fat: Math.max(0, Math.round((targets.fat - current.fat) * 10) / 10),
  };
}

export const DEFAULT_USER_PROFILE: UserProfile = {
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

/**
 * Calculates dynamically partitioned meal macronutrient targets and tolerance ranges
 * based on user's daily nutrition target and meal slot.
 *
 * Proportion distributions:
 * - Breakfast: 20% ~ 30% of daily target (preferred 25%)
 * - Lunch: 32% ~ 42% of daily target (preferred 37.5%)
 * - Dinner: 30% ~ 40% of daily target (preferred 35%)
 * - Snack: remaining portion (preferred ~8%)
 */
export function getMealMacroTarget(
  dailyTarget: MacroNutrients,
  mealType: MealType
): MealMacroTarget {
  let ratio = 0.35;
  let minRatio = 0.30;
  let maxRatio = 0.40;

  if (mealType === 'breakfast') {
    ratio = 0.25;
    minRatio = 0.20;
    maxRatio = 0.30;
  } else if (mealType === 'lunch') {
    ratio = 0.375;
    minRatio = 0.32;
    maxRatio = 0.42;
  } else if (mealType === 'dinner') {
    ratio = 0.35;
    minRatio = 0.30;
    maxRatio = 0.40;
  } else if (mealType === 'snack') {
    ratio = 0.08;
    minRatio = 0.05;
    maxRatio = 0.15;
  }

  // Dynamic macro target ranges calculated directly from user's personalized daily targets
  // and meal partition ratio tolerances:
  // Breakfast: ~20%-30% | Lunch: ~32%-42% | Dinner: ~30%-40% | Snack: ~5%-15%
  const calMin = Math.round(dailyTarget.calories * minRatio);
  const calPreferred = Math.round(dailyTarget.calories * ratio);
  const calMax = Math.round(dailyTarget.calories * maxRatio);

  const protMin = Math.round(dailyTarget.protein * minRatio);
  const protPreferred = Math.round(dailyTarget.protein * ratio);
  const protMax = Math.round(dailyTarget.protein * maxRatio);

  const carbMin = Math.round(dailyTarget.carbs * minRatio);
  const carbPreferred = Math.round(dailyTarget.carbs * ratio);
  const carbMax = Math.round(dailyTarget.carbs * maxRatio);

  const fatMin = Math.round(dailyTarget.fat * minRatio);
  const fatPreferred = Math.round(dailyTarget.fat * ratio);
  const fatMax = Math.round(dailyTarget.fat * maxRatio);

  return {
    mealType,
    targetCalories: calPreferred,
    targetProtein: protPreferred,
    targetCarbs: carbPreferred,
    targetFat: fatPreferred,
    calorieRange: [calMin, calMax],
    proteinRange: [protMin, protMax],
    carbRange: [carbMin, carbMax],
    fatRange: [fatMin, fatMax],
    calories: { min: calMin, preferred: calPreferred, max: calMax },
    protein: { min: protMin, preferred: protPreferred, max: protMax },
    carbs: { min: carbMin, preferred: carbPreferred, max: carbMax },
    fat: { min: fatMin, preferred: fatPreferred, max: fatMax },
  };
}

export interface RecipeNutritionalRoles {
  containsStaple: boolean;
  containsProtein: boolean;
  containsVegetable: boolean;
  containsFat: boolean;
}

/**
 * Classify nutritional roles for any recipe (composite or component)
 * Prevents classifying compound dishes (e.g. 皮蛋瘦肉粥, 水煎包, 鲜虾青菜面) as pure single roles
 */
export function getRecipeNutritionalRoles(recipe: Recipe): RecipeNutritionalRoles {
  // 1. containsStaple:
  // - Category is 'staple'
  // - Tags contains '主食', '粗粮主食', '面食', '焖饭', '炒饭', '汤面', '炒面', '盖饭', '包子', '水饺'
  // - Ingredients contain '粮谷主食'
  // - Or dish contains grains, dough, tuber, noodles, congee, buns (e.g. 粥, 面, 粉, 馒头, 包, 吐司, 燕麦, 玉米, 红薯, 紫薯, 馄饨, 饺)
  const hasGrainIngredient = Boolean(recipe.ingredients?.some(i =>
    i.category === '粮谷主食' ||
    ['米', '面粉', '全麦', '挂面', '通心粉', '米粉', '年糕', '燕麦', '小米', '玉米', '红薯', '紫薯'].some(k => i.name.includes(k))
  ));
  const hasStapleTag = Boolean(recipe.tags?.some(t =>
    ['主食', '粗粮主食', '面食', '焖饭', '炒饭', '汤面', '炒面', '盖饭', '包子', '水饺'].includes(t)
  ));
  const hasStapleCategory = recipe.category === 'staple';
  const hasStapleName = ['粥', '面', '粉', '饭', '馒头', '花卷', '包', '水煎包', '生煎', '吐司', '燕麦', '玉米', '红薯', '紫薯', '馄饨', '水饺', '饺子', '软饼'].some(k => recipe.name.includes(k));
  const containsStaple = (hasStapleCategory || hasGrainIngredient || hasStapleTag || hasStapleName) &&
    (recipe.carbs || 0) >= 12 &&
    recipe.id !== 'cmp_boiled_egg' &&
    recipe.id !== 'cmp_pan_fried_egg' &&
    recipe.id !== 'cmp_warm_milk' &&
    recipe.id !== 'cmp_warm_soymilk' &&
    recipe.id !== 'cmp_plain_greek_yogurt' &&
    recipe.id !== 'cmp_fresh_banana' &&
    recipe.id !== 'cmp_cherry_tomatoes' &&
    recipe.id !== 'cmp_boiled_broccoli';

  // 2. containsProtein:
  // - Category is 'main' (which represents dedicated meat/fish/egg/tofu dishes)
  // - proteinSource is not 'none' and not undefined
  // - Ingredients contain '肉禽蛋' or '豆制品水产' or '奶类坚果'
  // - Or has >= 10g protein from dedicated sources
  const hasProteinIngredient = Boolean(recipe.ingredients?.some(i =>
    i.category === '肉禽蛋' ||
    i.category === '豆制品水产' ||
    i.category === '奶类坚果' ||
    ['肉', '排骨', '鸡', '牛', '猪', '虾', '鱼', '蛋', '豆腐', '豆浆', '牛奶', '酸奶', '巴沙鱼', '鲈鱼', '鲫鱼'].some(k => i.name.includes(k))
  ));
  const hasProteinSourceProp = Boolean(recipe.proteinSource && recipe.proteinSource !== 'none');
  const containsProtein = recipe.category === 'main' || hasProteinSourceProp || hasProteinIngredient || (recipe.protein || 0) >= 12;

  // 3. containsVegetable:
  // - Category is 'vegetable'
  // - Ingredients contain '蔬菜菌菇' or prominent vegetables
  const hasVegIngredient = Boolean(recipe.ingredients?.some(i =>
    i.category === '蔬菜菌菇' ||
    ['青菜', '生菜', '菠菜', '油麦菜', '西兰花', '黄瓜', '番茄', '西红柿', '木耳', '菌', '菇', '菜心', '芹菜', '白菜', '包菜', '胡萝卜', '笋', '椒', '蒜薹', '荷兰豆', '空心菜'].some(k => i.name.includes(k))
  ));
  const containsVegetable = recipe.category === 'vegetable' || hasVegIngredient;

  // 4. containsFat:
  // - Has >= 6g fat or includes cooking oil, nuts, sesame, fatty meat, egg yolk
  const containsFat = (recipe.fat || 0) >= 6 || Boolean(recipe.ingredients?.some(i =>
    (i.category === '调料辅料' && (i.name.includes('油') || i.name.includes('芝麻') || i.name.includes('花生'))) ||
    i.category === '奶类坚果' ||
    i.name.includes('五花') ||
    i.name.includes('蛋') ||
    i.name.includes('肉')
  ));

  return { containsStaple, containsProtein, containsVegetable, containsFat };
}

/**
 * Helper to identify whether a recipe is or contains a carbohydrate staple component
 */
export function isStapleComponent(recipe: Recipe): boolean {
  return getRecipeNutritionalRoles(recipe).containsStaple;
}

/**
 * Unified pure validation function for meal nutrition guardrails & macro adequacy (V0.4.7.1).
 *
 * Layer 1: Structural Completeness (Protein, Carb, Fat, Vegetable/Fruit sources, no forbidden singles)
 * Layer 2: Macro Adequacy (Target Range Fit, No Carb Stacking, Sufficient Protein & Fat grams)
 */
export function validateMealNutrition(
  meal: { recipes: Recipe[] } | Recipe[],
  mealType: MealType = 'lunch',
  userProfileOrTarget?: UserProfile | MacroNutrients
): MealNutritionValidationResult {
  const recipes: Recipe[] = Array.isArray(meal) ? meal : (meal?.recipes || []);
  const issues: string[] = [];

  // Derive unified daily target & meal target
  let dailyTarget: MacroNutrients;
  if (userProfileOrTarget) {
    if ('targetCalories' in userProfileOrTarget && !('protein' in userProfileOrTarget)) {
      dailyTarget = {
        calories: (userProfileOrTarget as any).targetCalories || 1800,
        protein: (userProfileOrTarget as any).weight ? Math.round((userProfileOrTarget as any).weight * 1.5) : 75,
        carbs: 220,
        fat: 50,
      };
    } else if ('calories' in userProfileOrTarget) {
      dailyTarget = userProfileOrTarget as MacroNutrients;
    } else {
      dailyTarget = calculateMacroTargets(userProfileOrTarget as UserProfile);
    }
  } else {
    dailyTarget = calculateMacroTargets(DEFAULT_USER_PROFILE);
  }

  const mealTarget = getMealMacroTarget(dailyTarget, mealType);

  if (!recipes || recipes.length === 0) {
    return {
      hasProteinSource: false,
      hasCarbSource: false,
      hasFatSource: false,
      hasVegetableOrFruit: false,
      proteinAmount: 0,
      carbAmount: 0,
      fatAmount: 0,
      calories: 0,
      targetFitScore: 0,
      isComplete: false,
      isAdequate: false,
      targetRanges: {
        calories: mealTarget.calories,
        protein: mealTarget.protein,
        carbs: mealTarget.carbs,
        fat: mealTarget.fat,
      },
      macroAdequacy: {
        proteinStatus: 'low',
        carbsStatus: 'low',
        fatStatus: 'low',
        calorieStatus: 'low',
        carbStackCount: 0,
        mealTarget,
      },
      issues: ['餐品为空，无任何食材组件'],
    };
  }

  const calories = recipes.reduce((sum, r) => sum + (r.calories || 0), 0);
  const proteinAmount = Math.round(recipes.reduce((sum, r) => sum + (r.protein || 0), 0) * 10) / 10;
  const carbAmount = Math.round(recipes.reduce((sum, r) => sum + (r.carbs || 0), 0) * 10) / 10;
  const fatAmount = Math.round(recipes.reduce((sum, r) => sum + (r.fat || 0), 0) * 10) / 10;

  const isSingle = recipes.length === 1;
  const singleDish = recipes[0];

  // =========================================================================
  // Layer 1: Structural Completeness
  // =========================================================================

  // 1. Dedicated protein dish check (grains/plain congee/mantou trace protein does not count)
  const hasDedicatedProteinDish = recipes.some(r => {
    if (r.category === 'staple' && (!r.proteinSource || r.proteinSource === 'none')) {
      return false;
    }
    if (r.proteinSource && r.proteinSource !== 'none') return true;
    return Boolean(r.ingredients?.some(i => i.category === '肉禽蛋' || i.category === '豆制品水产' || i.category === '奶类坚果'));
  });
  const hasProteinSource = hasDedicatedProteinDish || proteinAmount >= mealTarget.protein.min;

  // 2. Carbohydrate source check
  const hasDedicatedCarbDish = recipes.some(r => {
    if (r.category === 'staple') return true;
    if (r.tags?.some(t => ['粗粮主食', '面食', '主食', '焖饭', '炒面', '汤面', '盖饭'].includes(t))) return true;
    return Boolean(r.ingredients?.some(i => i.category === '粮谷主食'));
  });
  const hasCarbSource = hasDedicatedCarbDish || carbAmount >= mealTarget.carbs.min;

  // 3. Fat source check
  const hasFatSource = fatAmount >= mealTarget.fat.min ||
    recipes.some(r => Boolean(r.ingredients?.some(i =>
      i.category === '肉禽蛋' ||
      i.category === '奶类坚果' ||
      (i.category === '调料辅料' && (i.name.includes('油') || i.name.includes('芝麻') || i.name.includes('花生')))
    )));

  // 4. Vegetable / Fruit check
  const hasVegetableOrFruit = recipes.some(r => {
    if (r.category === 'vegetable') return true;
    if (r.category === 'side' && r.name.includes('果')) return true;
    return Boolean(r.ingredients?.some(i => i.category === '蔬菜菌菇' || i.name.includes('果') || i.name.includes('黄瓜') || i.name.includes('西红柿') || i.name.includes('番茄')));
  });

  // 5. Detect forbidden single-item food components
  const isWhiteRiceAlone = isSingle && (
    singleDish.name.includes('白米饭') ||
    singleDish.name.includes('糙米饭') ||
    singleDish.name.includes('杂粮饭') ||
    (singleDish.category === 'staple' && !singleDish.name.includes('焖饭') && !singleDish.name.includes('面') && !singleDish.name.includes('炒饭') && !singleDish.name.includes('盖饭') && !singleDish.name.includes('三明治') && !singleDish.name.includes('馄饨'))
  );

  const isMantouAlone = isSingle && (
    singleDish.name.includes('馒头') ||
    singleDish.name.includes('花卷') ||
    singleDish.id === 'st_whole_wheat_mantou'
  );

  const isSingleEggAlone = isSingle && (
    singleDish.name.includes('水煮蛋') ||
    singleDish.name.includes('蒸蛋') ||
    singleDish.name.includes('煎荷包蛋') ||
    singleDish.id === 'cmp_boiled_egg' ||
    singleDish.id === 'rc_steamed_egg' ||
    singleDish.id === 'cmp_pan_fried_egg'
  );

  const isSingleMilkAlone = isSingle && (
    singleDish.name.includes('牛奶') ||
    singleDish.name.includes('豆浆') ||
    singleDish.name.includes('酸奶') ||
    singleDish.id === 'cmp_warm_milk' ||
    singleDish.id === 'cmp_warm_soymilk' ||
    singleDish.id === 'cmp_plain_greek_yogurt'
  );

  const isSingleMeatAlone = isSingle && (
    singleDish.category === 'main' &&
    carbAmount < 10 &&
    !hasVegetableOrFruit
  );

  const isPlainPorridgeAlone = isSingle && (
    singleDish.name.includes('粥') &&
    (!singleDish.proteinSource || singleDish.proteinSource === 'none') &&
    proteinAmount < 10
  );

  const isSingleVegAlone = isSingle && (
    singleDish.category === 'vegetable' ||
    singleDish.name.includes('拍黄瓜') ||
    singleDish.id === 'cmp_boiled_broccoli'
  );

  // 6. Anti-Carb-Stacking: Detect redundant multiple staples (e.g. 馒头 + 玉米 + 红薯 + 粥)
  const pureStapleRecipes = recipes.filter(r => isStapleComponent(r));
  const carbStackCount = pureStapleRecipes.length;
  const isCarbStacked = carbStackCount >= 2;

  // Compile Layer 1 issues
  if (!hasProteinSource) issues.push('缺少优质蛋白质来源');
  if (!hasCarbSource) issues.push('缺少复合碳水主食来源');
  if (!hasFatSource) issues.push('缺少健康脂肪来源');
  if (isMantouAlone) issues.push('馒头属于主食组件，不能独立构成合理一餐，需搭配蛋白质');
  if (isWhiteRiceAlone) issues.push('纯米饭属于主食组件，不能独立作为一餐');
  if (isSingleEggAlone) issues.push('鸡蛋属于优质蛋白组件，不能独立作为完整一餐');
  if (isSingleMilkAlone) issues.push('牛奶或饮品属于流质组件，不能独立作为完整一餐');
  if (isSingleMeatAlone) issues.push('纯肉类属于主菜组件，缺少碳水主食与蔬菜纤维');
  if (isPlainPorridgeAlone) issues.push('纯白粥缺少优质蛋白，不能独立作为早餐');
  if (isSingleVegAlone) issues.push('单一青菜缺少蛋白质与主食');
  if (isCarbStacked) issues.push(`碳水主食来源过度堆叠(同时包含 ${pureStapleRecipes.map(r => r.name).join('、')}，建议以单一主食为主)`);

  const isSingleComponentForbidden = isMantouAlone || isWhiteRiceAlone || isSingleEggAlone || isSingleMilkAlone || isSingleMeatAlone || isPlainPorridgeAlone || isSingleVegAlone;

  let isComplete = false;
  if (mealType === 'breakfast') {
    isComplete = hasProteinSource &&
      hasCarbSource &&
      hasFatSource &&
      !isSingleComponentForbidden &&
      !isCarbStacked;
  } else if (mealType === 'lunch' || mealType === 'dinner') {
    if (!hasVegetableOrFruit) issues.push('缺少新鲜蔬菜菌菇纤维');
    isComplete = hasProteinSource &&
      hasCarbSource &&
      hasVegetableOrFruit &&
      hasFatSource &&
      !isSingleComponentForbidden &&
      !isCarbStacked;
  } else {
    isComplete = calories >= 50 && calories <= 400;
  }

  // =========================================================================
  // Layer 2: Macro Adequacy (Target Range Evaluation)
  // =========================================================================

  // Protein adequacy (Bidirectional)
  let proteinStatus: 'low' | 'adequate' | 'high' = 'adequate';
  if (proteinAmount < mealTarget.protein.min * 0.88) {
    proteinStatus = 'low';
    issues.push(`蛋白质偏低(实测 ${proteinAmount}g，建议目标 ≥ ${mealTarget.protein.min}g)`);
  } else if (proteinAmount > mealTarget.protein.max * 1.22) {
    proteinStatus = 'high';
    issues.push(`蛋白质偏高(实测 ${proteinAmount}g，建议上限 ≤ ${mealTarget.protein.max}g)`);
  }

  // Carbs adequacy (Bidirectional)
  let carbsStatus: 'low' | 'adequate' | 'high' = 'adequate';
  if (carbAmount < mealTarget.carbs.min * 0.85) {
    carbsStatus = 'low';
    issues.push(`碳水主食不足(实测 ${carbAmount}g，建议目标 ≥ ${mealTarget.carbs.min}g)`);
  } else if (carbAmount > mealTarget.carbs.max * 1.25) {
    carbsStatus = 'high';
    issues.push(`碳水偏高(实测 ${carbAmount}g，建议上限 ≤ ${mealTarget.carbs.max}g)`);
  }

  // Fat adequacy (Bidirectional)
  let fatStatus: 'low' | 'adequate' | 'high' = 'adequate';
  if (fatAmount < mealTarget.fat.min * 0.8) {
    fatStatus = 'low';
    issues.push(`健康脂肪偏低(实测 ${fatAmount}g，建议目标 ≥ ${mealTarget.fat.min}g)`);
  } else if (fatAmount > mealTarget.fat.max * 1.28) {
    fatStatus = 'high';
    issues.push(`健康脂肪偏高(实测 ${fatAmount}g，建议上限 ≤ ${mealTarget.fat.max}g)`);
  }

  // Calorie adequacy (Bidirectional)
  let calorieStatus: 'low' | 'adequate' | 'high' = 'adequate';
  if (calories < mealTarget.calories.min * 0.85) {
    calorieStatus = 'low';
    issues.push(`总能量偏低(实测 ${calories} kcal，建议目标 ≥ ${mealTarget.calories.min} kcal)`);
  } else if (calories > mealTarget.calories.max * 1.25) {
    calorieStatus = 'high';
    issues.push(`总能量偏高(实测 ${calories} kcal，建议上限 ≤ ${mealTarget.calories.max} kcal)`);
  }

  const isAdequate = isComplete &&
    proteinStatus !== 'low' &&
    proteinStatus !== 'high' &&
    carbsStatus !== 'low' &&
    carbsStatus !== 'high' &&
    fatStatus !== 'low' &&
    fatStatus !== 'high' &&
    calorieStatus !== 'low' &&
    calorieStatus !== 'high' &&
    !isCarbStacked;

  // =========================================================================
  // Layer 3: Meal Target Fit Score (0-100)
  // =========================================================================
  let score = 96;

  // Protein evaluation (Bidirectional: adequate is optimal, over-target incurs proportional penalty)
  if (proteinAmount < mealTarget.protein.min) {
    const ratioDiff = (mealTarget.protein.min - proteinAmount) / Math.max(1, mealTarget.protein.min);
    score -= Math.min(35, ratioDiff * 45);
  } else if (proteinAmount > mealTarget.protein.max) {
    const ratioDiff = (proteinAmount - mealTarget.protein.max) / Math.max(1, mealTarget.protein.max);
    score -= Math.min(25, ratioDiff * 32);
  }

  // Calorie evaluation
  if (calories < mealTarget.calories.min) {
    const ratioDiff = (mealTarget.calories.min - calories) / Math.max(1, mealTarget.calories.min);
    score -= Math.min(25, ratioDiff * 35);
  } else if (calories > mealTarget.calories.max) {
    const ratioDiff = (calories - mealTarget.calories.max) / Math.max(1, mealTarget.calories.max);
    score -= Math.min(25, ratioDiff * 30);
  }

  // Carbs evaluation
  if (carbAmount < mealTarget.carbs.min) {
    const ratioDiff = (mealTarget.carbs.min - carbAmount) / Math.max(1, mealTarget.carbs.min);
    score -= Math.min(20, ratioDiff * 25);
  } else if (carbAmount > mealTarget.carbs.max) {
    const ratioDiff = (carbAmount - mealTarget.carbs.max) / Math.max(1, mealTarget.carbs.max);
    score -= Math.min(20, ratioDiff * 25);
  }

  // Fat evaluation
  if (fatAmount < mealTarget.fat.min) {
    const ratioDiff = (mealTarget.fat.min - fatAmount) / Math.max(1, mealTarget.fat.min);
    score -= Math.min(15, ratioDiff * 20);
  } else if (fatAmount > mealTarget.fat.max) {
    const ratioDiff = (fatAmount - mealTarget.fat.max) / Math.max(1, mealTarget.fat.max);
    score -= Math.min(15, ratioDiff * 20);
  }

  // Carb stacking penalty
  if (isCarbStacked) {
    score -= Math.min(25, (carbStackCount - 1) * 15);
  }

  // Structural defect cap
  if (!isComplete) {
    score = Math.min(48, score * 0.55);
  }

  const targetFitScore = Math.round(Math.max(20, Math.min(99, score)));

  return {
    hasProteinSource,
    hasCarbSource,
    hasFatSource,
    hasVegetableOrFruit,
    proteinAmount,
    carbAmount,
    fatAmount,
    calories,
    targetFitScore,
    isComplete,
    isAdequate,
    targetRanges: {
      calories: mealTarget.calories,
      protein: mealTarget.protein,
      carbs: mealTarget.carbs,
      fat: mealTarget.fat,
    },
    macroAdequacy: {
      proteinStatus,
      carbsStatus,
      fatStatus,
      calorieStatus,
      carbStackCount,
      mealTarget,
    },
    issues,
  };
}

