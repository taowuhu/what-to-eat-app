import { IngredientMaster, Ingredient, MacroNutrients } from '../types';

export const INGREDIENT_DATABASE: Record<string, IngredientMaster> = {
  // === 蛋与乳品 ===
  '鸡蛋': { id: 'ing_egg', name: '鸡蛋', category: '肉禽蛋', unit: '个', gramsPerUnit: 50, nutritionPer100g: { calories: 144, protein: 12.8, carbs: 1.5, fat: 9.8 } },
  '鹌鹑蛋': { id: 'ing_quail_egg', name: '鹌鹑蛋', category: '肉禽蛋', unit: '个', gramsPerUnit: 10, nutritionPer100g: { calories: 160, protein: 13.1, carbs: 2.1, fat: 11.1 } },
  '鲜牛奶': { id: 'ing_milk', name: '鲜牛奶', category: '奶类坚果', unit: 'ml', gramsPerUnit: 1, nutritionPer100g: { calories: 54, protein: 3.2, carbs: 4.8, fat: 3.1 } },
  '纯牛奶': { id: 'ing_pure_milk', name: '纯牛奶', category: '奶类坚果', unit: 'ml', gramsPerUnit: 1, nutritionPer100g: { calories: 54, protein: 3.2, carbs: 4.8, fat: 3.1 } },
  '无糖豆浆': { id: 'ing_soymilk', name: '无糖豆浆', category: '奶类坚果', unit: 'ml', gramsPerUnit: 1, nutritionPer100g: { calories: 31, protein: 3.0, carbs: 1.5, fat: 1.6 } },

  // === 禽肉 (鸡肉) ===
  '鸡胸肉': { id: 'ing_chicken_breast', name: '鸡胸肉', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 118, protein: 24.6, carbs: 0, fat: 2.5 } },
  '去皮鸡腿肉': { id: 'ing_chicken_thigh', name: '去皮鸡腿肉', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 132, protein: 20.2, carbs: 0, fat: 5.6 } },
  '琵琶腿': { id: 'ing_drumstick', name: '琵琶腿', category: '肉禽蛋', unit: '只', gramsPerUnit: 110, nutritionPer100g: { calories: 140, protein: 19.5, carbs: 0, fat: 6.8 } },
  '鸡翅中': { id: 'ing_chicken_wing', name: '鸡翅中', category: '肉禽蛋', unit: '个', gramsPerUnit: 35, nutritionPer100g: { calories: 194, protein: 17.4, carbs: 0, fat: 13.8 } },

  // === 畜肉 (牛肉、猪肉) ===
  '牛里脊': { id: 'ing_beef_tenderloin', name: '牛里脊', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 112, protein: 22.8, carbs: 0, fat: 2.3 } },
  '牛瘦肉': { id: 'ing_beef_lean', name: '牛瘦肉', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 115, protein: 22.2, carbs: 0, fat: 2.8 } },
  '牛腩': { id: 'ing_beef_brisket', name: '牛腩', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 235, protein: 18.2, carbs: 0, fat: 18.0 } },
  '肥牛卷': { id: 'ing_beef_slice', name: '肥牛卷', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 220, protein: 17.5, carbs: 0, fat: 16.5 } },
  '猪瘦肉': { id: 'ing_pork_lean', name: '猪瘦肉', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 143, protein: 20.3, carbs: 1.0, fat: 6.2 } },
  '猪里脊': { id: 'ing_pork_tenderloin', name: '猪里脊', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 138, protein: 21.0, carbs: 0.5, fat: 5.5 } },
  '五花肉': { id: 'ing_pork_belly', name: '五花肉', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 349, protein: 13.2, carbs: 0, fat: 33.0 } },
  '猪肋排': { id: 'ing_pork_rib', name: '猪肋排', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 210, protein: 17.8, carbs: 0, fat: 15.2 } },
  '肉末': { id: 'ing_minced_pork', name: '肉末', category: '肉禽蛋', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 180, protein: 18.5, carbs: 0.8, fat: 11.5 } },

  // === 水产鱼虾 ===
  '鲜虾仁': { id: 'ing_shrimp_meat', name: '鲜虾仁', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 85, protein: 18.6, carbs: 1.2, fat: 0.8 } },
  '基围虾': { id: 'ing_shrimp_whole', name: '基围虾', category: '豆制品水产', unit: '只', gramsPerUnit: 20, nutritionPer100g: { calories: 88, protein: 18.2, carbs: 1.5, fat: 1.0 } },
  '鲈鱼': { id: 'ing_bass_fish', name: '鲈鱼', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 105, protein: 18.6, carbs: 0, fat: 3.4 } },
  '龙利鱼/巴沙鱼': { id: 'ing_basa_fish', name: '龙利鱼/巴沙鱼', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 88, protein: 16.5, carbs: 0.5, fat: 2.2 } },
  '草鱼/黑鱼片': { id: 'ing_carp_slices', name: '草鱼/黑鱼片', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 92, protein: 18.0, carbs: 0, fat: 2.1 } },
  '三文鱼': { id: 'ing_salmon', name: '三文鱼', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 139, protein: 19.8, carbs: 0, fat: 6.3 } },
  '黄花鱼': { id: 'ing_yellow_croaker', name: '黄花鱼', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 99, protein: 17.7, carbs: 0, fat: 2.5 } },

  // === 豆制品 ===
  '北豆腐(老豆腐)': { id: 'ing_firm_tofu', name: '北豆腐(老豆腐)', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 98, protein: 12.2, carbs: 1.8, fat: 4.8 } },
  '嫩豆腐/内酯豆腐': { id: 'ing_soft_tofu', name: '嫩豆腐/内酯豆腐', category: '豆制品水产', unit: '盒', gramsPerUnit: 350, nutritionPer100g: { calories: 50, protein: 5.5, carbs: 1.2, fat: 2.5 } },
  '腐竹(干)': { id: 'ing_dried_yuba', name: '腐竹(干)', category: '豆制品水产', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 459, protein: 44.6, carbs: 22.3, fat: 21.7 } },
  '豆腐干/香干': { id: 'ing_spiced_tofu', name: '豆腐干/香干', category: '豆制品水产', unit: '块', gramsPerUnit: 50, nutritionPer100g: { calories: 140, protein: 16.2, carbs: 4.9, fat: 6.0 } },
  '干豆腐/千张': { id: 'ing_tofu_sheet', name: '干豆腐/千张', category: '豆制品水产', unit: '张', gramsPerUnit: 80, nutritionPer100g: { calories: 262, protein: 24.5, carbs: 8.5, fat: 14.2 } },

  // === 蔬菜菌菇 ===
  '番茄': { id: 'ing_tomato', name: '番茄', category: '蔬菜菌菇', unit: '个', gramsPerUnit: 150, nutritionPer100g: { calories: 18, protein: 0.9, carbs: 3.5, fat: 0.2 } },
  '西兰花': { id: 'ing_broccoli', name: '西兰花', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 34, protein: 2.8, carbs: 4.3, fat: 0.4 } },
  '生菜': { id: 'ing_lettuce', name: '生菜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 15, protein: 1.3, carbs: 2.2, fat: 0.3 } },
  '油麦菜': { id: 'ing_youmaicai', name: '油麦菜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 16, protein: 1.4, carbs: 2.5, fat: 0.3 } },
  '菠菜': { id: 'ing_spinach', name: '菠菜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 23, protein: 2.6, carbs: 2.8, fat: 0.3 } },
  '青椒/青柿子椒': { id: 'ing_green_pepper', name: '青椒/青柿子椒', category: '蔬菜菌菇', unit: '个', gramsPerUnit: 80, nutritionPer100g: { calories: 22, protein: 1.0, carbs: 4.2, fat: 0.2 } },
  '圆白菜/包菜': { id: 'ing_cabbage', name: '圆白菜/包菜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 24, protein: 1.3, carbs: 4.8, fat: 0.2 } },
  '娃娃菜': { id: 'ing_baby_cabbage', name: '娃娃菜', category: '蔬菜菌菇', unit: '棵', gramsPerUnit: 150, nutritionPer100g: { calories: 14, protein: 1.2, carbs: 2.5, fat: 0.2 } },
  '黄瓜': { id: 'ing_cucumber', name: '黄瓜', category: '蔬菜菌菇', unit: '根', gramsPerUnit: 160, nutritionPer100g: { calories: 15, protein: 0.8, carbs: 2.9, fat: 0.2 } },
  '芹菜': { id: 'ing_celery', name: '芹菜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 14, protein: 0.8, carbs: 2.5, fat: 0.1 } },
  '土豆': { id: 'ing_potato', name: '土豆', category: '蔬菜菌菇', unit: '个', gramsPerUnit: 150, nutritionPer100g: { calories: 77, protein: 2.0, carbs: 17.2, fat: 0.2 } },
  '胡萝卜': { id: 'ing_carrot', name: '胡萝卜', category: '蔬菜菌菇', unit: '根', gramsPerUnit: 120, nutritionPer100g: { calories: 37, protein: 1.0, carbs: 8.1, fat: 0.2 } },
  '鲜香菇': { id: 'ing_mushroom', name: '鲜香菇', category: '蔬菜菌菇', unit: '朵', gramsPerUnit: 20, nutritionPer100g: { calories: 26, protein: 2.2, carbs: 4.5, fat: 0.3 } },
  '金针菇': { id: 'ing_enoki', name: '金针菇', category: '蔬菜菌菇', unit: '把', gramsPerUnit: 150, nutritionPer100g: { calories: 32, protein: 2.4, carbs: 5.8, fat: 0.4 } },
  '白玉菇/海鲜菇': { id: 'ing_shimeji', name: '白玉菇/海鲜菇', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 28, protein: 2.1, carbs: 5.2, fat: 0.3 } },
  '黑木耳(水发)': { id: 'ing_wood_ear', name: '黑木耳(水发)', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 27, protein: 1.5, carbs: 6.0, fat: 0.2 } },
  '冬瓜': { id: 'ing_winter_melon', name: '冬瓜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 12, protein: 0.4, carbs: 2.6, fat: 0.2 } },
  '丝瓜': { id: 'ing_luffa', name: '丝瓜', category: '蔬菜菌菇', unit: '根', gramsPerUnit: 200, nutritionPer100g: { calories: 20, protein: 1.0, carbs: 4.2, fat: 0.2 } },
  '白萝卜': { id: 'ing_white_radish', name: '白萝卜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 16, protein: 0.9, carbs: 3.4, fat: 0.1 } },
  '上海青/油菜': { id: 'ing_bokchoy', name: '上海青/油菜', category: '蔬菜菌菇', unit: '棵', gramsPerUnit: 50, nutritionPer100g: { calories: 15, protein: 1.5, carbs: 2.7, fat: 0.3 } },
  '四季豆/豆角': { id: 'ing_green_beans', name: '四季豆/豆角', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 31, protein: 1.9, carbs: 6.2, fat: 0.2 } },
  '洋葱': { id: 'ing_onion', name: '洋葱', category: '蔬菜菌菇', unit: '个', gramsPerUnit: 120, nutritionPer100g: { calories: 40, protein: 1.1, carbs: 9.0, fat: 0.1 } },
  '紫菜': { id: 'ing_nori', name: '紫菜', category: '蔬菜菌菇', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 207, protein: 28.2, carbs: 44.5, fat: 1.3 } },

  // === 主食/谷物 ===
  '大米(熟)': { id: 'ing_cooked_rice', name: '米饭', category: '粮谷主食', unit: '碗(约150g)', gramsPerUnit: 150, nutritionPer100g: { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 } },
  '杂粮饭(熟)': { id: 'ing_cooked_grain_rice', name: '杂粮饭', category: '粮谷主食', unit: '碗(约150g)', gramsPerUnit: 150, nutritionPer100g: { calories: 112, protein: 3.2, carbs: 24.2, fat: 0.6 } },
  '糙米饭(熟)': { id: 'ing_brown_rice', name: '糙米饭', category: '粮谷主食', unit: '碗(约150g)', gramsPerUnit: 150, nutritionPer100g: { calories: 111, protein: 2.8, carbs: 24.0, fat: 0.7 } },
  '挂面/鲜面条(生)': { id: 'ing_noodles_raw', name: '挂面/鲜面条', category: '粮谷主食', unit: '把(约70g)', gramsPerUnit: 70, nutritionPer100g: { calories: 345, protein: 11.2, carbs: 73.5, fat: 1.5 } },
  '荞麦面(干)': { id: 'ing_soba_noodles', name: '荞麦面', category: '粮谷主食', unit: '把(约60g)', gramsPerUnit: 60, nutritionPer100g: { calories: 330, protein: 12.0, carbs: 67.5, fat: 2.0 } },
  '纯燕麦片': { id: 'ing_oats', name: '纯燕麦片', category: '粮谷主食', unit: '勺(约35g)', gramsPerUnit: 35, nutritionPer100g: { calories: 367, protein: 12.5, carbs: 66.8, fat: 6.7 } },
  '全麦面包': { id: 'ing_whole_bread', name: '全麦面包', category: '粮谷主食', unit: '片(约40g)', gramsPerUnit: 40, nutritionPer100g: { calories: 246, protein: 9.2, carbs: 46.0, fat: 3.5 } },
  '玉米': { id: 'ing_corn', name: '甜玉米', category: '粮谷主食', unit: '根', gramsPerUnit: 200, nutritionPer100g: { calories: 112, protein: 4.0, carbs: 22.8, fat: 1.2 } },
  '紫薯/红薯': { id: 'ing_sweet_potato', name: '紫薯/红薯', category: '粮谷主食', unit: '个', gramsPerUnit: 150, nutritionPer100g: { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.2 } },
  '全麦馒头': { id: 'ing_whole_mantou', name: '全麦馒头', category: '粮谷主食', unit: '个', gramsPerUnit: 80, nutritionPer100g: { calories: 215, protein: 7.2, carbs: 45.0, fat: 1.1 } },

  // === 家常烹饪常用辅料与调料 (以低油少盐估算) ===
  '植物油/花生油': { id: 'ing_oil', name: '植物油/花生油', category: '调料辅料', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 899, protein: 0, carbs: 0, fat: 99.9 } },
  '生抽/酱油': { id: 'ing_soysauce', name: '生抽/酱油', category: '调料辅料', unit: '勺', gramsPerUnit: 10, nutritionPer100g: { calories: 60, protein: 6.0, carbs: 8.5, fat: 0 } },
  '老抽': { id: 'ing_dark_soysauce', name: '老抽', category: '调料辅料', unit: '勺', gramsPerUnit: 5, nutritionPer100g: { calories: 90, protein: 8.0, carbs: 14.5, fat: 0 } },
  '蚝油': { id: 'ing_oyster_sauce', name: '蚝油', category: '调料辅料', unit: '勺', gramsPerUnit: 10, nutritionPer100g: { calories: 114, protein: 3.5, carbs: 24.0, fat: 0.2 } },
  '食盐': { id: 'ing_salt', name: '食盐', category: '调料辅料', unit: '克', gramsPerUnit: 1, nutritionPer100g: { calories: 0, protein: 0, carbs: 0, fat: 0 } },
  '大蒜': { id: 'ing_garlic', name: '大蒜', category: '调料辅料', unit: '瓣', gramsPerUnit: 5, nutritionPer100g: { calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5 } },
  '生姜': { id: 'ing_ginger', name: '生姜', category: '调料辅料', unit: '片', gramsPerUnit: 3, nutritionPer100g: { calories: 42, protein: 1.3, carbs: 7.6, fat: 0.8 } },
  '小葱/大葱': { id: 'ing_scallion', name: '小葱/大葱', category: '调料辅料', unit: '根', gramsPerUnit: 10, nutritionPer100g: { calories: 30, protein: 1.7, carbs: 5.2, fat: 0.4 } },
};

/**
 * Calculates estimated nutrition from concrete ingredients and gram weights.
 * If gram weight is not explicitly provided, attempts to estimate from unit & quantity.
 */
export function calculateNutritionFromIngredients(ingredients: Ingredient[]): MacroNutrients {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const item of ingredients) {
    // Try to find matching ingredient in database by fuzzy name
    let matched: IngredientMaster | undefined;
    for (const key of Object.keys(INGREDIENT_DATABASE)) {
      if (item.name.includes(key) || key.includes(item.name)) {
        matched = INGREDIENT_DATABASE[key];
        break;
      }
    }

    // Determine total gram weight for this ingredient
    let grams = item.grams;
    if (!grams) {
      if (matched) {
        grams = (item.amount || 1) * matched.gramsPerUnit;
      } else {
        // Fallback default
        if (item.unit.includes('克') || item.unit === 'g') {
          grams = item.amount;
        } else if (item.unit.includes('勺')) {
          grams = item.amount * 10;
        } else {
          grams = item.amount * 80;
        }
      }
    }

    if (matched && grams > 0) {
      const factor = grams / 100;
      totalCalories += matched.nutritionPer100g.calories * factor;
      totalProtein += matched.nutritionPer100g.protein * factor;
      totalCarbs += matched.nutritionPer100g.carbs * factor;
      totalFat += matched.nutritionPer100g.fat * factor;
    }
  }

  // Rounded values for clean readability
  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
  };
}
