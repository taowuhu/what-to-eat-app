import { Recipe, RecipeCategory, MealType, ProteinSource } from '../../types';
import { createRecipeItem } from './expanded_catalog';

/**
 * Basic Nutritional Food Components (基础食物组件)
 * 
 * In accordance with V0.4.7 Meal Nutrition Guardrails:
 * Food components (e.g. 馒头、白煮蛋、纯牛奶、吐司片、香蕉) are valid standalone Recipes,
 * but CANNOT be recommended alone as a complete Meal.
 * They are combined by the Meal Composer into complete, balanced breakfasts and meals.
 */

export const COMPONENT_RECIPES: Recipe[] = [
  createRecipeItem(
    'cmp_boiled_egg',
    '经典溏心白煮蛋',
    'breakfast',
    ['breakfast', 'snack'],
    'egg',
    ['15分钟', '小白友好', '一人食', '高蛋白', '基础组件'],
    10,
    '小白友好',
    '鲜鸡蛋冷水下锅煮8分钟过冷水剥壳，蛋黄凝固微润，高蛋白吸收率极佳。',
    '煮',
    ['小汤锅'],
    [
      { name: '鸡蛋', amount: 2, unit: '个(约100g)', category: '肉禽蛋', grams: 100 },
    ],
    [
      {
        stepNumber: 1,
        title: '冷水慢煮',
        action: '小锅内加入足量冷水没过鸡蛋，大火水烧开后转中火煮8分钟。',
        durationSeconds: 480,
        visualCue: '水面持续温和冒泡翻滚',
        tip: '水中加半茶匙食盐更易剥壳。'
      },
      {
        stepNumber: 2,
        title: '冰水降温剥壳',
        action: '捞出立即投入冷水中浸泡1分钟，在水中轻磕剥除外壳对半切开。',
        durationSeconds: 60,
        visualCue: '蛋白白嫩光滑，蛋黄溏心柔润',
        tip: '冷水浸泡使蛋白骤冷收缩，壳膜轻松脱落。'
      }
    ],
    { calories: 140, protein: 12.5, carbs: 1.2, fat: 9.8 },
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80',
    ['鸡蛋']
  ),

  createRecipeItem(
    'cmp_warm_milk',
    '营养温鲜牛奶',
    'breakfast',
    ['breakfast', 'snack'],
    'dairy',
    ['小白友好', '即食饮品', '高钙优质蛋白', '基础组件'],
    3,
    '小白友好',
    '纯牛奶微波中火温热30秒或隔水温热，浓郁乳香暖胃，提供优质蛋白与活性钙。',
    '冲调',
    ['微波炉或马克杯'],
    [
      { name: '纯牛奶', amount: 250, unit: '毫升', category: '奶类坚果', grams: 250 },
    ],
    [
      {
        stepNumber: 1,
        title: '温热出香',
        action: '纯牛奶倒入玻璃马克杯中，入微波炉中火微波加热30-40秒至微温(约50℃)。',
        durationSeconds: 40,
        visualCue: '杯口散发自然奶甜暖气',
        tip: '无需煮沸，保持50℃左右口感与营养最佳。'
      }
    ],
    { calories: 135, protein: 8.0, carbs: 12.0, fat: 7.5 },
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
    ['牛奶']
  ),

  createRecipeItem(
    'cmp_warm_soymilk',
    '现磨温热纯豆浆',
    'breakfast',
    ['breakfast', 'snack'],
    'tofu',
    ['小白友好', '植物蛋白', '高纤低脂', '基础组件'],
    5,
    '小白友好',
    '无糖天然温热纯豆浆，香浓细腻微甘，植物大豆蛋白丰富，乳糖不耐受友好。',
    '冲调',
    ['马克杯'],
    [
      { name: '现磨纯豆浆', amount: 300, unit: '毫升', category: '豆制品水产', grams: 300 },
    ],
    [
      {
        stepNumber: 1,
        title: '趁热饮用',
        action: '将温热的无糖纯豆浆注入大杯中直接佐餐享用。',
        durationSeconds: 60,
        visualCue: '豆香浓醇微甘，表面结一层薄薄腐竹皮',
        tip: '无糖纯豆浆升糖指数极低，佐餐更平稳。'
      }
    ],
    { calories: 95, protein: 8.5, carbs: 6.0, fat: 3.5 },
    'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=800&q=80',
    ['黄豆']
  ),

  createRecipeItem(
    'cmp_whole_wheat_toast',
    '香脆烘烤全麦切片吐司',
    'staple',
    ['breakfast', 'snack'],
    'none',
    ['15分钟', '粗粮主食', '小白友好', '基础组件'],
    4,
    '小白友好',
    '选用原味全麦面包切片，多士炉或平底锅无油轻烘2分钟，外脆内韧麦香浓郁。',
    '煎',
    ['多士炉或平底不粘锅'],
    [
      { name: '全麦切片吐司', amount: 2, unit: '片(约70g)', category: '粮谷主食', grams: 70 },
    ],
    [
      {
        stepNumber: 1,
        title: '双面微烘',
        action: '放入多士炉中火烘烤2分钟，或平底锅不放油微火每面干烘1分钟至微黄微脆。',
        durationSeconds: 120,
        visualCue: '面包边缘微焦焦香，轻按干爽松脆',
        tip: '热烘能彻底激发全麦谷物的焦糖香气。'
      }
    ],
    { calories: 170, protein: 6.5, carbs: 32.0, fat: 2.0 },
    'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
    ['面包']
  ),

  createRecipeItem(
    'cmp_fresh_banana',
    '新鲜软糯香蕉',
    'side',
    ['breakfast', 'snack'],
    'none',
    ['即食', '果蔬纤维', '低预算', '基础组件'],
    1,
    '小白友好',
    '金黄新鲜香蕉，香甜软糯富含钾与果胶，晨起快速补充大脑活性碳水与果蔬纤维。',
    '冲调',
    ['果盘'],
    [
      { name: '新鲜香蕉', amount: 1, unit: '根(约120g)', category: '调料辅料', grams: 120 },
    ],
    [
      {
        stepNumber: 1,
        title: '剥皮即食',
        action: '洗净表皮剥开，切片摆盘或整根直接佐餐食用。',
        durationSeconds: 30,
        visualCue: '果肉淡黄微糯自然清甜',
        tip: '富含钾与膳食纤维，搭配燕麦或面包口感丰富。'
      }
    ],
    { calories: 90, protein: 1.2, carbs: 22.0, fat: 0.3 },
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
    ['香蕉']
  ),

  createRecipeItem(
    'cmp_cherry_tomatoes',
    '即食清甜小圣女果',
    'vegetable',
    ['breakfast', 'lunch', 'dinner', 'snack'],
    'none',
    ['即食', '果蔬纤维', '小白友好', '清爽解腻', '基础组件'],
    2,
    '小白友好',
    '红玛瑙般饱满小圣女果，果汁充沛酸甜爽口，富含维生素C与番茄红素。',
    '凉拌',
    ['果蔬清洗盆'],
    [
      { name: '圣女果', amount: 10, unit: '颗(约150g)', category: '蔬菜菌菇', grams: 150 },
    ],
    [
      {
        stepNumber: 1,
        title: '清水冲洗',
        action: '摘去果蒂，淡盐水浸洗2分钟，沥干水分盛入小碗即可爽脆享用。',
        durationSeconds: 90,
        visualCue: '果皮紧绷饱满，咬下爆汁酸甜',
        tip: '无需开火，是早餐或午晚餐最快速的清爽蔬果补充。'
      }
    ],
    { calories: 35, protein: 1.5, carbs: 7.0, fat: 0.3 },
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    ['番茄']
  ),

  createRecipeItem(
    'cmp_steamed_corn',
    '甜脆清蒸新鲜玉米',
    'staple',
    ['breakfast', 'lunch', 'dinner'],
    'none',
    ['一锅搞定', '粗粮主食', '小白友好', '高纤维', '基础组件'],
    15,
    '小白友好',
    '金黄甜玉米隔水清蒸，颗颗饱满爆汁，清甜微弹，优质低脂高纤复合碳水。',
    '蒸',
    ['蒸锅或微波蒸盒'],
    [
      { name: '新鲜甜玉米', amount: 1, unit: '根(约180g)', category: '粮谷主食', grams: 180 },
    ],
    [
      {
        stepNumber: 1,
        title: '隔水清蒸',
        action: '剥去外层老叶留一层内薄衣，蒸锅水开后入锅中大火蒸12-15分钟。',
        durationSeconds: 720,
        visualCue: '玉米粒转为金黄透明透亮',
        tip: '保留一层内衣清蒸更能锁住清甜汁水。'
      }
    ],
    { calories: 160, protein: 5.2, carbs: 32.0, fat: 2.2 },
    'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
    ['玉米']
  ),

  createRecipeItem(
    'cmp_boiled_broccoli',
    '白灼爽脆西兰花',
    'vegetable',
    ['lunch', 'dinner', 'breakfast'],
    'none',
    ['15分钟', '快手', '减脂推荐', '果蔬纤维', '基础组件'],
    8,
    '小白友好',
    '西兰花掰小朵沸水快速焯烫90秒捞出，滴数滴初榨橄榄油与薄盐，青翠爽脆。',
    '煮',
    ['小奶锅'],
    [
      { name: '西兰花', amount: 150, unit: '克', category: '蔬菜菌菇', grams: 150 },
      { name: '初榨橄榄油', amount: 3, unit: '克', category: '调料辅料', grams: 3 },
    ],
    [
      {
        stepNumber: 1,
        title: '沸水焯烫',
        action: '水沸加半勺盐和少许油，下西兰花焯烫70-90秒至翠绿断生立即捞出沥水。',
        durationSeconds: 90,
        visualCue: '花蕾青翠欲滴脆嫩爽口',
        tip: '焯水放少许油盐能锁住叶绿素保持青翠。'
      }
    ],
    { calories: 50, protein: 3.8, carbs: 6.5, fat: 1.2 },
    'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=800&q=80',
    ['西兰花']
  ),

  createRecipeItem(
    'cmp_seared_chicken_breast',
    '少油香煎黑椒鸡胸肉条',
    'main',
    ['lunch', 'dinner'],
    'chicken',
    ['15分钟', '高蛋白', '快手', '一人食', '基础组件'],
    12,
    '小白友好',
    '新鲜鸡胸肉顺纹切厚条，生抽黑胡椒略腌，平底锅微油各煎2分钟至金黄紧致多汁。',
    '煎',
    ['平底不粘锅'],
    [
      { name: '鸡胸肉', amount: 130, unit: '克', category: '肉禽蛋', grams: 130 },
      { name: '食用油', amount: 3, unit: '克', category: '调料辅料', grams: 3 },
    ],
    [
      {
        stepNumber: 1,
        title: '双面香煎',
        action: '平底锅抹微量油烧热，下鸡胸肉条中火煎2分钟翻面再煎1.5分钟至两面微金黄。',
        durationSeconds: 210,
        visualCue: '肉质饱满紧实微泛焦香',
        tip: '不过度煎制，肉汁充沛不干柴。'
      }
    ],
    { calories: 165, protein: 29.0, carbs: 1.5, fat: 4.2 },
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    ['鸡肉']
  ),

  createRecipeItem(
    'cmp_plain_greek_yogurt',
    '无糖原味浓稠希腊酸奶',
    'breakfast',
    ['breakfast', 'snack'],
    'dairy',
    ['小白友好', '即食饮品', '高钙优质蛋白', '高蛋白', '基础组件'],
    2,
    '小白友好',
    '纯正浓稠无糖原味希腊酸奶，口感如冰淇淋绵密丝滑，富含优质酪蛋白与活性益生菌。',
    '冲调',
    ['玻璃碗'],
    [
      { name: '无糖原味希腊酸奶', amount: 150, unit: '克', category: '奶类坚果', grams: 150 },
    ],
    [
      {
        stepNumber: 1,
        title: '开盖即享',
        action: '舀入小碗中直接食用，或撒入少许坚果碎佐餐。',
        durationSeconds: 30,
        visualCue: '膏体醇厚倒勺不洒',
        tip: '纯无糖配方，饱腹感持久，升糖极平稳。'
      }
    ],
    { calories: 110, protein: 14.5, carbs: 4.5, fat: 3.5 },
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
    ['酸奶']
  ),

  createRecipeItem(
    'cmp_pan_fried_egg',
    '少油香嫩金黄煎荷包蛋',
    'breakfast',
    ['breakfast', 'lunch', 'dinner', 'snack'],
    'egg',
    ['15分钟', '小白友好', '一人食', '高蛋白', '基础组件'],
    5,
    '小白友好',
    '平底锅刷极微量植物油，打入鲜鸡蛋微火慢煎至底焦黄、蛋黄微溏心，提供优质卵磷脂与天然健康脂类。',
    '煎',
    ['平底不粘锅'],
    [
      { name: '鸡蛋', amount: 1, unit: '个(约50g)', category: '肉禽蛋', grams: 50 },
      { name: '植物油', amount: 3, unit: '克', category: '调料辅料', grams: 3 },
    ],
    [
      {
        stepNumber: 1,
        title: '底壳香煎',
        action: '小火锅温热打入鸡蛋，煎至蛋白边缘焦黄起小花边，加1汤匙水盖盖焖30秒即可。',
        durationSeconds: 150,
        visualCue: '蛋白凝固嫩滑微焦金边，蛋黄呈诱人溏心',
        tip: '淋少许水盖盖焖可以让蛋黄更快熟透且口感极嫩。'
      }
    ],
    { calories: 95, protein: 6.8, carbs: 0.6, fat: 7.2 },
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    ['鸡蛋']
  )
];
