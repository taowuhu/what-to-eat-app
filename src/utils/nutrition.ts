import { UserProfile, MacroNutrients, DailyLog } from '../types';

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
