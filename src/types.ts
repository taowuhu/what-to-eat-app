export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';
export type Goal = 'fat_loss' | 'maintain' | 'muscle_gain';

export interface UserProfile {
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
  weeklyWorkouts: number; // times per week
  goal: Goal;
  dietaryPreferences: string[];
  dislikes: string[]; // 不喜欢的食材 (降低推荐权重)
  strictlyExclude?: string[]; // 不吃的食材 (完全排除推荐)
  customCalorieTarget?: number;
  defaultServings?: number; // 默认份量人数 (1, 2, 3, 4)
}

export type FeedbackSkipReason =
  | 'recently_eaten'      // 最近吃过
  | 'not_today'            // 今天不想吃这个
  | 'dislike_dish'         // 不喜欢这道菜
  | 'too_troublesome'      // 太麻烦
  | 'no_meat_today'        // 今天不想吃肉
  | 'prefer_light';        // 今天想吃清淡一点

export interface RecommendationFeedback {
  id?: string;
  comboId?: string;
  recipeIds: string[];
  reason: FeedbackSkipReason;
  timestamp: number;
}

export type CookingRating = 'like' | 'neutral' | 'dislike'; // 👍 好吃 / 😐 一般 / 👎 不喜欢

export type CookingFeedbackTag =
  | '下次还想吃'
  | '有点麻烦'
  | '太辣'
  | '太淡'
  | '太咸';

export interface CookingFeedback {
  recipeId: string;
  recipeName?: string;
  rating: CookingRating;
  tags: CookingFeedbackTag[];
  timestamp: number;
}

export interface MacroNutrients {
  calories: number; // kcal
  protein: number;  // g
  carbs: number;    // g
  fat: number;      // g
}

export type ProteinSource =
  | 'chicken'
  | 'beef'
  | 'pork'
  | 'fish'
  | 'shrimp'
  | 'egg'
  | 'tofu'
  | 'none';

export type CookingMethod = '炒' | '蒸' | '炖' | '煎' | '煮' | '凉拌' | '烤' | '冲调' | '烧';

export type IngredientCategory = '肉禽蛋' | '蔬菜菌菇' | '粮谷主食' | '调料辅料' | '豆制品水产' | '奶类坚果';

export interface IngredientMaster {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: string;
  gramsPerUnit: number;
  nutritionPer100g: MacroNutrients;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: IngredientCategory;
  grams?: number;
  notes?: string;
}

export interface CookingStep {
  stepNumber: number;
  title: string;
  ingredientsUsed: { name: string; amount: string }[];
  action: string;
  durationSeconds: number;
  visualCue: string;
  flameLevel?: string;
  tip?: string;
}

export type RecipeCategory = 'main' | 'vegetable' | 'staple' | 'soup' | 'breakfast' | 'side';

export type RecipeDifficulty = '小白友好' | '新手快手' | '进阶家常';

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  mealTypes: MealType[];
  proteinSource: ProteinSource;
  tags: string[];
  timeMinutes: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  difficultyLevel?: 1 | 2 | 3;
  servings: number;
  summary: string;
  description?: string;
  ingredients: Ingredient[];
  seasonings?: string[];
  steps: CookingStep[];
  cookingMethod?: CookingMethod;
  equipment?: string[];
  nutritionEstimate: MacroNutrients;
  imageUrl: string;
  image?: string;
  dislikeTags: string[]; // for exclusion (e.g. '牛肉', '香菜', '辛辣', '虾', '海鲜', '猪肉')

  // Backwards compatibility aliases
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Meal represents a composed whole meal (referencing recipe IDs)
export interface Meal {
  id: string;
  title: string;
  motto?: string;
  mealType: MealType;
  recipeIds: string[];
  tags: string[];
  estimatedTimeMinutes: number;
  servingSize?: string;
  difficulty?: '小白友好' | '新手快手' | '进阶家常';
  recommendationReason?: string;
}

export interface PantryCoverageInfo {
  totalCount: number;
  matchedCount: number;
  missingCount: number;
  coverageRate: number; // 0 to 1
  matchedIngredients: { name: string; amount: number; unit: string; category?: string }[];
  missingIngredients: { name: string; amount: number; unit: string; category?: string }[];
  matchedCanonicalNames: string[];
  missingCanonicalNames: string[];
}

export interface MealCombo {
  id: string;
  comboTitle: string;
  motto: string;
  recipeIds?: string[];
  recipes: Recipe[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  estimatedTimeMinutes: number;
  ingredientCount: number;
  difficulty?: '小白友好' | '新手快手' | '进阶家常';
  servingSize?: string; // e.g. "1人份"
  tags: string[];
  recommendationReason: string;
  pantryCoverage?: PantryCoverageInfo;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface DishItem {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface MealRecord {
  id: string;
  mealType: MealType;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timeString: string;
  dishes: DishItem[];
  comboId?: string;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  records: MealRecord[];
}

export type QuickFilterId = '15min' | 'single_person' | 'high_protein' | 'homestyle' | 'budget_friendly';

export interface QuickFilterOption {
  id: QuickFilterId;
  label: string;
  subtitle: string;
  iconName: string;
}

export interface DayMealSlot {
  type: MealType; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
  label: string; // '早餐' | '午餐' | '晚餐'
  title: string;
  timeMinutes: number;
  tags: string[];
  recipes: Recipe[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  difficulty?: '小白友好' | '新手快手' | '进阶家常';
}

export interface DayMealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  breakfast: DayMealSlot;
  lunch: DayMealSlot;
  dinner: DayMealSlot;
  snack?: DayMealSlot; // Future extension ready
  nutritionSummary: string; // e.g. "今日搭配：营养均衡 · 蛋白质充沛 · 丰富蔬菜"
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  pantryCoverage?: {
    coveragePercent: number;
    missingCount: number;
    matchedCount: number;
    totalCount: number;
  };
}

export type GroceryCategory = '肉蛋奶' | '蔬菜' | '主食' | '调味料';

export interface GroupedGroceryItem {
  name: string;
  amount: number;
  unit: string;
  sourceDishes: string[];
  isInPantry?: boolean;
  category?: GroceryCategory;
}
