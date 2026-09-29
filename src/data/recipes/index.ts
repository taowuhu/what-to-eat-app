import { Recipe, RecipeCategory, MealType, ProteinSource } from '../../types';
import { BREAKFAST_RECIPES } from './breakfast';
import { CHICKEN_RECIPES } from './chicken';
import { BEEF_RECIPES } from './beef';
import { PORK_RECIPES } from './pork';
import { SEAFOOD_RECIPES } from './seafood';
import { EGG_TOFU_RECIPES } from './egg_tofu';
import { VEGETABLE_RECIPES } from './vegetables';
import { SOUP_RECIPES } from './soups';
import { STAPLE_RECIPES } from './staples';
import { ADDITIONAL_RECIPES, createRecipeItem } from './expanded_catalog';
import { COMPREHENSIVE_RECIPES } from './comprehensive_registry';
import { RICE_COOKER_RECIPES } from './riceCooker';
import { COMPONENT_RECIPES } from './components';

// Systematic batch recipes to complete full home cooking coverage
const BULK_ADDITIONAL_RECIPES: Recipe[] = [
  createRecipeItem(
    'bk_oat_pumpkin_smoothie',
    '暖暖南瓜燕麦浓郁热糊',
    'breakfast',
    ['breakfast'],
    'none',
    ['15分钟', '一人食', '小白友好', '免开火'],
    8,
    '小白友好',
    '熟南瓜泥与即食燕麦片加热水或温牛奶冲开，微波叮1分钟，自然甘甜浓稠。',
    '冲调',
    ['微波炉或小奶锅'],
    [
      { name: '蒸南瓜泥', amount: 80, unit: '克', category: '蔬菜菌菇', grams: 80 },
      { name: '纯燕麦片', amount: 35, unit: '克', category: '粮谷主食', grams: 35 },
      { name: '热牛奶', amount: 150, unit: 'ml', category: '奶类坚果', grams: 150 },
    ],
    [
      { stepNumber: 1, title: '混合温热', action: '南瓜泥与燕麦片倒入碗中，冲入热牛奶搅拌均匀即可食用。', durationSeconds: 60, visualCue: '金黄浓稠麦香四溢', tip: '无需额外加糖。' },
    ],
    { calories: 230, protein: 8.5, carbs: 38.0, fat: 5.0 },
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ['牛奶']
  ),
  createRecipeItem(
    'bk_purple_sweet_potato_soup_egg',
    '紫薯银耳羹配溏心蛋',
    'breakfast',
    ['breakfast'],
    'egg',
    ['高蛋白', '小白友好', '低预算'],
    15,
    '小白友好',
    '紫薯切小丁与即食银耳煮出梦幻淡紫色温润稠汤，配一颗温热溏心蛋。',
    '煮',
    ['小汤锅'],
    [
      { name: '紫薯', amount: 100, unit: '克(切小丁)', category: '粮谷主食', grams: 100 },
      { name: '泡发鲜银耳', amount: 50, unit: '克', category: '蔬菜菌菇', grams: 50 },
      { name: '鸡蛋', amount: 1, unit: '个', category: '肉禽蛋', grams: 50 },
    ],
    [
      { stepNumber: 1, title: '紫薯银耳同煮', action: '水沸下紫薯丁与鲜银耳小火滚煮10分钟至汤水起胶变稠。', durationSeconds: 600, visualCue: '汤呈晶莹紫水晶色', tip: '鲜银耳出胶极快。' },
      { stepNumber: 2, title: '搭配煮蛋', action: '将另锅水沸煮 6 分钟过冰水的溏心蛋剥壳对半切开，盛入温热的紫薯银耳羹碗中，即可温润享用。', durationSeconds: 60, visualCue: '蛋黄流心紫薯粉甜', tip: '低卡润肤。' },
    ],
    { calories: 220, protein: 9.0, carbs: 36.0, fat: 5.5 },
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ['鸡蛋']
  ),
  createRecipeItem(
    'bk_pan_fried_veggie_buns',
    '金黄脆底青菜香菇水煎包',
    'breakfast',
    ['breakfast'],
    'tofu',
    ['15分钟', '小白友好', '家常菜'],
    12,
    '小白友好',
    '青菜香菇豆腐馅包子入平底锅底煎金黄，淋面粉水焖至水汽干透，底脆如薄冰。',
    '煎',
    ['平底锅'],
    [
      { name: '素馅小包子', amount: 3, unit: '个(约120g)', category: '粮谷主食', grams: 120 },
      { name: '面粉水', amount: 40, unit: 'ml', category: '调料辅料', grams: 40 },
      { name: '植物油', amount: 4, unit: '克', category: '调料辅料', grams: 4 },
    ],
    [
      { stepNumber: 1, title: '煎出冰花底', action: '锅底刷油排入包子，淋面粉水盖盖中小火焖5分钟至水分收干底焦黄。', durationSeconds: 300, visualCue: '包底金黄焦脆有蜂窝冰花', tip: '小火焖熟透。' },
    ],
    { calories: 270, protein: 9.5, carbs: 45.0, fat: 6.0 },
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    []
  ),
  createRecipeItem(
    'r_white_cut_chicken',
    '葱油豉汁手浸少油白切鸡',
    'main',
    ['lunch', 'dinner'],
    'chicken',
    ['高蛋白', '小白友好'],
    20,
    '进阶家常',
    '三黄鸡腿肉微沸慢浸至断生，冰水紧致表皮，肉质细嫩流汁，配姜葱生抽蓉。',
    '煮',
    ['小汤锅'],
    [
      { name: '鲜鸡腿', amount: 180, unit: '克(去骨)', category: '肉禽蛋', grams: 180 },
      { name: '香葱末/生姜末', amount: 20, unit: '克', category: '调料辅料', grams: 20 },
      { name: '生抽/白胡椒/热油', amount: 10, unit: '克', category: '调料辅料', grams: 10 },
    ],
    [
      { stepNumber: 1, title: '慢浸至熟', action: '鸡腿入葱姜水微沸小火浸煮12分钟，捞出入冰水拔凉切厚片。', durationSeconds: 720, visualCue: '鸡皮脆爽肉质透粉白', tip: '微沸慢浸鸡肉最嫩不柴。' },
      { stepNumber: 2, title: '淋姜葱生抽汁', action: '将切碎的细香葱与生姜蓉置于小碗，用 4ml 滚烫热油泼出浓烈葱香，调入生抽白胡椒拌匀，均匀淋在切好的白切鸡块上。', durationSeconds: 30, visualCue: '葱香浓烈肉滑嫩爽', tip: '粤式经典原汁原味。' },
    ],
    { calories: 250, protein: 32.0, carbs: 1.5, fat: 12.5 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['鸡肉']
  ),
  createRecipeItem(
    'r_tomato_potato_chicken',
    '浓汤番茄土豆焖鸡块',
    'main',
    ['lunch', 'dinner'],
    'chicken',
    ['一锅搞定', '家常菜', '小白友好'],
    25,
    '小白友好',
    '去皮鸡块与番茄土豆同焖，土豆沙糯，番茄熬化成浓稠酸甜浓汤。',
    '炖',
    ['炖锅'],
    [
      { name: '鸡大腿肉块', amount: 140, unit: '克', category: '肉禽蛋', grams: 140 },
      { name: '熟番茄', amount: 1.5, unit: '个', category: '蔬菜菌菇', grams: 180 },
      { name: '土豆', amount: 1, unit: '个(切小块)', category: '蔬菜菌菇', grams: 100 },
      { name: '生抽/盐/白糖少许', amount: 7, unit: '克', category: '调料辅料', grams: 7 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '同焖熟软', action: '鸡块煸炒微焦，下番茄炒出沙，加土豆与一碗水小火焖炖16分钟至土豆软烂。', durationSeconds: 960, visualCue: '土豆边缘起沙汤色红稠', tip: '酸甜开胃。' },
    ],
    { calories: 280, protein: 27.5, carbs: 22.0, fat: 9.5 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['鸡肉', '番茄', '土豆']
  ),
  createRecipeItem(
    'r_winter_melon_chicken',
    '清润家常冬瓜焖鸡腿',
    'main',
    ['lunch', 'dinner'],
    'chicken',
    ['家常菜', '小白友好', '一锅搞定'],
    20,
    '小白友好',
    '冬瓜块吸饱鸡肉红烧鲜汁变得半透明软糯，鸡肉嫩滑多汁，不油不燥。',
    '烧',
    ['炒锅'],
    [
      { name: '去皮鸡腿肉', amount: 140, unit: '克', category: '肉禽蛋', grams: 140 },
      { name: '冬瓜', amount: 180, unit: '克(切方块)', category: '蔬菜菌菇', grams: 180 },
      { name: '生抽/老抽/生姜/盐', amount: 8, unit: '克', category: '调料辅料', grams: 8 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '鸡肉上色焖冬瓜', action: '鸡肉煸香加生抽老抽，投入冬瓜块加半碗水加盖中小火焖煮10分钟收浓。', durationSeconds: 600, visualCue: '冬瓜晶莹透亮吸收红润酱汁', tip: '冬瓜自带水分水量不宜过多。' },
    ],
    { calories: 230, protein: 26.5, carbs: 8.0, fat: 10.0 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['鸡肉', '冬瓜']
  ),
  createRecipeItem(
    'r_enoki_sauce_beef',
    '酱香滑嫩金针菇牛肉片',
    'main',
    ['lunch', 'dinner'],
    'beef',
    ['15分钟', '一人食', '家常菜', '小白友好'],
    12,
    '小白友好',
    '金针菇吸收牛肉鲜汁爽脆多汁，牛里脊软嫩入味，酱香四溢。',
    '炒',
    ['炒锅'],
    [
      { name: '牛里脊薄片', amount: 130, unit: '克', category: '肉禽蛋', grams: 130 },
      { name: '金针菇', amount: 100, unit: '克(去根撕散)', category: '蔬菜菌菇', grams: 100 },
      { name: '蚝油/生抽/生姜/蒜末', amount: 10, unit: '克', category: '调料辅料', grams: 10 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '滑牛肉炒金针菇', action: '牛肉滑熟盛出，底油炒软金针菇，倒回牛肉淋入蚝油生抽水淀粉翻匀出锅。', durationSeconds: 120, visualCue: '金针菇软滑裹汁牛肉嫩润', tip: '金针菇炒透去酸生鲜。' },
    ],
    { calories: 235, protein: 28.0, carbs: 6.5, fat: 10.0 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['牛肉', '金针菇']
  ),
  createRecipeItem(
    'r_colorful_pepper_beef',
    '彩椒洋葱爽脆炒牛柳',
    'main',
    ['lunch', 'dinner'],
    'beef',
    ['15分钟', '一人食', '家常菜', '高蛋白', '小白友好'],
    13,
    '小白友好',
    '红黄彩椒与紫洋葱色泽缤纷，大火猛爆牛柳，清甜爽脆高维C。',
    '炒',
    ['炒锅'],
    [
      { name: '牛里脊', amount: 130, unit: '克(切条)', category: '肉禽蛋', grams: 130 },
      { name: '红黄甜椒/洋葱', amount: 100, unit: '克(切小块)', category: '蔬菜菌菇', grams: 100 },
      { name: '生抽/黑胡椒/生粉', amount: 7, unit: '克', category: '调料辅料', grams: 7 },
      { name: '植物油', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
    ],
    [
      { stepNumber: 1, title: '猛火快炒', action: '牛柳滑变色盛出，大火炒彩椒洋葱30秒，回锅牛柳撒黑胡椒生抽颠锅出盘。', durationSeconds: 60, visualCue: '彩椒明艳焦香四溢', tip: '彩椒保持半生脆最甜。' },
    ],
    { calories: 225, protein: 27.5, carbs: 7.0, fat: 9.5 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['牛肉', '彩椒']
  ),
  createRecipeItem(
    'r_tomato_potato_beef_pot',
    '家常番茄土豆炖牛腩煲',
    'main',
    ['lunch', 'dinner'],
    'beef',
    ['一锅搞定', '家常菜', '小白友好'],
    35,
    '小白友好',
    '牛腩慢火煨炖至肉酥软烂，番茄煮化成浓厚红汤，土豆沙糯酸甜解馋。',
    '炖',
    ['砂锅'],
    [
      { name: '牛腩肉', amount: 140, unit: '克', category: '肉禽蛋', grams: 140 },
      { name: '成熟番茄', amount: 2, unit: '个', category: '蔬菜菌菇', grams: 220 },
      { name: '土豆', amount: 1, unit: '个', category: '蔬菜菌菇', grams: 100 },
      { name: '姜片/生抽/盐', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
    ],
    [
      { stepNumber: 1, title: '焯水慢煨', action: '牛腩焯净浮沫，入砂锅加水及番茄炒蓉炖煮25分钟，下土豆再炖8分钟调盐起锅。', durationSeconds: 1980, visualCue: '汤稠红亮牛腩酥软脱筋', tip: '番茄酸性助牛肉快速软烂。' },
    ],
    { calories: 330, protein: 28.5, carbs: 18.0, fat: 15.5 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['牛肉', '番茄', '土豆']
  ),
  createRecipeItem(
    'r_snow_peas_pork',
    '清脆荷兰豆炒里脊肉片',
    'main',
    ['lunch', 'dinner'],
    'pork',
    ['15分钟', '一人食', '家常菜', '小白友好'],
    11,
    '小白友好',
    '荷兰豆清甜脆嫩咔嚓作响，配滑润里脊肉片，少油清淡色泽明快。',
    '炒',
    ['炒锅'],
    [
      { name: '猪里脊', amount: 120, unit: '克', category: '肉禽蛋', grams: 120 },
      { name: '荷兰豆', amount: 130, unit: '克(去筋切斜段)', category: '蔬菜菌菇', grams: 130 },
      { name: '大蒜/生抽/食盐', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '合炒出锅', action: '肉片滑熟，荷兰豆沸水烫25秒，与蒜片一起大火合翻撒盐生抽起锅。', durationSeconds: 50, visualCue: '荷兰豆碧绿油亮肉片白滑', tip: '荷兰豆焯水去生涩。' },
    ],
    { calories: 215, protein: 25.0, carbs: 5.5, fat: 10.0 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['猪肉', '荷兰豆']
  ),
  createRecipeItem(
    'r_minced_pork_cowpea',
    '肉末煸炒长豇豆',
    'main',
    ['lunch', 'dinner'],
    'pork',
    ['家常菜', '小白友好', '15分钟'],
    13,
    '小白友好',
    '瘦肉末煸出喷香肉气，豇豆切碎粒煸至微皱软熟，咸香下饭神器。',
    '炒',
    ['炒锅'],
    [
      { name: '猪瘦肉末', amount: 90, unit: '克', category: '肉禽蛋', grams: 90 },
      { name: '长豇豆', amount: 150, unit: '克(切小粒)', category: '蔬菜菌菇', grams: 150 },
      { name: '蒜末/生抽/老抽/少许辣椒', amount: 8, unit: '克', category: '调料辅料', grams: 8 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '肉末与豇豆慢煸', action: '肉末炒至发白吐油，下入豇豆粒大火翻炒2分钟至表皮微皱微软，淋生抽收汁出锅。', durationSeconds: 150, visualCue: '豇豆碧绿油润肉末粒粒紧实', tip: '豇豆一定要彻底炒熟。' },
    ],
    { calories: 210, protein: 21.5, carbs: 8.5, fat: 9.8 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['猪肉', '豇豆']
  ),
  createRecipeItem(
    'r_cucumber_pork_slices',
    '清爽爽脆黄瓜炒肉片',
    'main',
    ['lunch', 'dinner'],
    'pork',
    ['15分钟', '一人食', '家常菜', '小白友好', '低预算'],
    10,
    '小白友好',
    '黄瓜切菱形薄片，与滑嫩瘦肉片大火急翻，清甜多汁不油腻。',
    '炒',
    ['炒锅'],
    [
      { name: '猪里脊', amount: 120, unit: '克', category: '肉禽蛋', grams: 120 },
      { name: '黄瓜', amount: 1, unit: '根(切菱形薄片)', category: '蔬菜菌菇', grams: 150 },
      { name: '蒜片/生抽/食盐', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '急火合炒', action: '滑熟肉片，蒜片爆香，投入黄瓜片大火狂炒30秒，倒回肉片加盐生抽翻匀起锅。', durationSeconds: 45, visualCue: '黄瓜晶亮脆挺肉片滑嫩', tip: '黄瓜不可久炒以免出水脱水。' },
    ],
    { calories: 205, protein: 24.5, carbs: 4.0, fat: 10.0 },
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ['猪肉', '黄瓜']
  ),
  createRecipeItem(
    'r_shrimp_egg_tofu_steam',
    '鲜虾仁滑蒸日本豆腐',
    'main',
    ['lunch', 'dinner'],
    'shrimp',
    ['15分钟', '一人食', '高蛋白', '小白友好'],
    12,
    '小白友好',
    '蛋玉豆腐切厚圆片，顶上一只弹牙大虾仁，隔水大火蒸5分钟，淋热豉油葱花。',
    '蒸',
    ['蒸锅'],
    [
      { name: '鲜虾仁', amount: 6, unit: '只', category: '豆制品水产', grams: 80 },
      { name: '玉子豆腐/日本豆腐', amount: 1, unit: '条(切圆厚片)', category: '豆制品水产', grams: 130 },
      { name: '蒸鱼豉油/葱花/香油', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
    ],
    [
      { stepNumber: 1, title: '码放清蒸', action: '豆腐圆片摆盘，放上虾仁大火蒸5分钟，倒掉盘边水，撒葱花淋豉油香油。', durationSeconds: 320, visualCue: '虾仁通红弹立玉子豆腐滑润', tip: '造型精致口感滑嫩如布丁。' },
    ],
    { calories: 165, protein: 22.0, carbs: 4.5, fat: 6.0 },
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ['虾', '豆腐']
  ),
  createRecipeItem(
    'r_pickled_fish_fillet',
    '家常清爽酸菜免炸鱼片',
    'main',
    ['lunch', 'dinner'],
    'fish',
    ['高蛋白', '家常菜', '小白友好'],
    16,
    '进阶家常',
    '老坛酸菜炒香加水煮出醇酸金汤，滑入雪白黑鱼薄片烫30秒，酸爽嫩滑无小刺。',
    '煮',
    ['炒锅或汤锅'],
    [
      { name: '黑鱼片/巴沙鱼片', amount: 150, unit: '克', category: '豆制品水产', grams: 150 },
      { name: '老坛酸菜', amount: 80, unit: '克(洗净切碎)', category: '蔬菜菌菇', grams: 80 },
      { name: '生姜蒜片/白胡椒/水淀粉', amount: 8, unit: '克', category: '调料辅料', grams: 8 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '炒酸菜煮汤', action: '蒜姜爆香酸菜炒干水汽，冲入开水大火滚煮3分钟捞出酸菜垫底。', durationSeconds: 200, visualCue: '金黄酸汤酸香浓郁', tip: '开水煮出金汤。' },
      { stepNumber: 2, title: '滑鱼片起锅', action: '鱼片上浆一片片滑入微沸酸汤中烫25秒，连汤带鱼倒入盆中。', durationSeconds: 40, visualCue: '鱼片如雪卷曲滑嫩', tip: '鱼片久煮会碎。' },
    ],
    { calories: 195, protein: 28.5, carbs: 3.5, fat: 7.0 },
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    ['鱼', '酸菜']
  ),
  createRecipeItem(
    'r_shrimp_steamed_egg_custard',
    '鲜虾仁如镜蒸水蛋',
    'main',
    ['lunch', 'dinner'],
    'egg',
    ['15分钟', '一人食', '高蛋白', '小白友好'],
    12,
    '小白友好',
    '蛋水比例1:1.5过筛蒸制，平滑如镜面无气孔，点缀弹嫩虾仁，滑溜顺口。',
    '蒸',
    ['蒸锅'],
    [
      { name: '鸡蛋', amount: 2, unit: '个', category: '肉禽蛋', grams: 100 },
      { name: '温水', amount: 150, unit: 'ml', category: '调料辅料', grams: 150 },
      { name: '鲜虾仁', amount: 4, unit: '只', category: '豆制品水产', grams: 50 },
      { name: '生抽/香油/葱花', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '过筛温水蒸蛋', action: '蛋液加温水搅匀过筛入盘，盖盘上汽中火蒸7分钟，铺上虾仁续蒸3分钟。', durationSeconds: 600, visualCue: '如布丁般晃动平滑无孔', tip: '盖盘子防蒸汽水滴落起泡。' },
      { stepNumber: 2, title: '出锅调味', action: '出锅划十字刀淋少许生抽香油葱花。', durationSeconds: 20, visualCue: '入口即化极为细嫩', tip: '老幼皆宜。' },
    ],
    { calories: 185, protein: 21.0, carbs: 2.0, fat: 10.0 },
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ['鸡蛋', '虾']
  ),
  createRecipeItem(
    'r_shrimp_silken_tofu',
    '鲜虾仁滑嫩烩白玉豆腐',
    'main',
    ['lunch', 'dinner'],
    'shrimp',
    ['15分钟', '一人食', '高蛋白', '小白友好'],
    11,
    '小白友好',
    '豆腐切白方丁与鲜嫩虾仁同烩，清鲜水润，入口化水。',
    '烧',
    ['炒锅'],
    [
      { name: '鲜虾仁', amount: 100, unit: '克', category: '豆制品水产', grams: 100 },
      { name: '嫩豆腐', amount: 180, unit: '克(切丁)', category: '豆制品水产', grams: 180 },
      { name: '葱姜水/盐/水淀粉', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
      { name: '植物油', amount: 4, unit: '克', category: '调料辅料', grams: 4 },
    ],
    [
      { stepNumber: 1, title: '同烩出锅', action: '滑熟虾仁，下入豆腐丁加半小碗开水煨煮2分钟，水淀粉勾薄芡撒葱末关火。', durationSeconds: 150, visualCue: '清亮透明粉红白润', tip: '勺背轻推防碎。' },
    ],
    { calories: 175, protein: 25.5, carbs: 4.0, fat: 6.5 },
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ['虾', '豆腐']
  ),
  createRecipeItem(
    'v_stir_fried_snow_peas',
    '清炒翠绿脆嫩荷兰豆',
    'vegetable',
    ['lunch', 'dinner'],
    'none',
    ['15分钟', '小白友好', '低预算', '快手'],
    8,
    '小白友好',
    '蒜粒爆香，荷兰豆大火急炒，脆爽清甜多汁。',
    '炒',
    ['炒锅'],
    [
      { name: '荷兰豆', amount: 180, unit: '克', category: '蔬菜菌菇', grams: 180 },
      { name: '大蒜瓣', amount: 15, unit: '克', category: '调料辅料', grams: 15 },
      { name: '食盐', amount: 2, unit: '克', category: '调料辅料', grams: 2 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '大火急炒', action: '蒜末爆香，倒入撕去老筋的荷兰豆大火狂炒1.5分钟至断生变翠，加盐起锅。', durationSeconds: 90, visualCue: '碧绿透亮清脆爽口', tip: '撕净老筋口感脆爽无渣。' },
    ],
    { calories: 85, protein: 3.5, carbs: 8.5, fat: 4.5 },
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ['荷兰豆']
  ),
  createRecipeItem(
    'v_garlic_asparagus_lettuce',
    '清爽蒜香爆炒莴笋丝',
    'vegetable',
    ['lunch', 'dinner'],
    'none',
    ['15分钟', '小白友好', '低预算'],
    9,
    '小白友好',
    '莴笋去皮切细丝，如碧玉般剔透，大火蒜香急炒，爽脆回甘。',
    '炒',
    ['炒锅'],
    [
      { name: '莴笋', amount: 1, unit: '根(去厚皮切丝约200g)', category: '蔬菜菌菇', grams: 200 },
      { name: '蒜末/食盐', amount: 6, unit: '克', category: '调料辅料', grams: 6 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '大火急炒', action: '蒜蓉煸香下莴笋丝大火快炒1分钟加少许盐起锅。', durationSeconds: 60, visualCue: '莴笋丝碧绿半透明', tip: '快炒保持爽脆。' },
    ],
    { calories: 75, protein: 2.0, carbs: 5.5, fat: 5.0 },
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ['莴笋']
  ),
  createRecipeItem(
    'v_quick_fried_cabbage_shreds',
    '干香微酸炝炒圆白菜丝',
    'vegetable',
    ['lunch', 'dinner'],
    'none',
    ['15分钟', '家常菜', '小白友好', '低预算'],
    9,
    '小白友好',
    '手撕圆白菜大火炝出锅气，烹少许陈醋与蒜片，咸酸爽脆百吃不腻。',
    '炒',
    ['炒锅'],
    [
      { name: '圆白菜/包菜', amount: 200, unit: '克(手撕或切丝)', category: '蔬菜菌菇', grams: 200 },
      { name: '干辣椒/蒜片/陈醋/生抽/盐', amount: 8, unit: '克', category: '调料辅料', grams: 8 },
      { name: '植物油', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '猛火炝炒', action: '干辣椒蒜片炝锅，下包菜丝大火狂翻1分钟，锅边烹醋加盐出锅。', durationSeconds: 60, visualCue: '菜叶边缘微焦油亮脆香', tip: '沿锅边烹醋激发酸香味。' },
    ],
    { calories: 85, protein: 2.4, carbs: 7.5, fat: 5.0 },
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ['包菜']
  ),
  createRecipeItem(
    'v_cucumber_tofu_skin_salad',
    '爽脆拍黄瓜拌五香腐竹',
    'vegetable',
    ['lunch', 'dinner'],
    'tofu',
    ['免开火', '15分钟', '小白友好', '低预算'],
    8,
    '小白友好',
    '手拍黄瓜裂纹吸汁，软韧腐竹充满豆香，香醋蒜泥红油一拌，爽口下酒下饭。',
    '凉拌',
    ['大碗'],
    [
      { name: '黄瓜', amount: 1, unit: '根(刀拍裂切小段)', category: '蔬菜菌菇', grams: 150 },
      { name: '水发腐竹', amount: 60, unit: '克(切斜段)', category: '豆制品水产', grams: 60 },
      { name: '蒜泥/生抽/香醋/香油', amount: 10, unit: '克', category: '调料辅料', grams: 10 },
    ],
    [
      { stepNumber: 1, title: '料汁调拌', action: '腐竹焯熟过凉与黄瓜同入大碗，倒入蒜醋香油汁颠拌均匀即可。', durationSeconds: 60, visualCue: '黄瓜脆绿腐竹泛着豆黄汁水充盈', tip: '黄瓜用刀拍比切更入味。' },
    ],
    { calories: 135, protein: 9.0, carbs: 6.5, fat: 8.5 },
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ['黄瓜', '腐竹']
  ),
  createRecipeItem(
    's_shrimp_seaweed_tofu_soup',
    '鲜虾紫菜嫩豆腐羹',
    'soup',
    ['lunch', 'dinner'],
    'shrimp',
    ['15分钟', '小白友好', '高蛋白'],
    10,
    '小白友好',
    '免洗紫菜、白玉豆腐丁与鲜虾仁汇聚一锅清甜海鲜热羹，清淡暖心。',
    '煮',
    ['小汤锅'],
    [
      { name: '鲜虾仁', amount: 4, unit: '只', category: '豆制品水产', grams: 50 },
      { name: '嫩豆腐', amount: 100, unit: '克(切小丁)', category: '豆制品水产', grams: 100 },
      { name: '免洗紫菜', amount: 2, unit: '克', category: '蔬菜菌菇', grams: 2 },
      { name: '生抽/白胡椒/香油/食盐', amount: 3, unit: '克', category: '调料辅料', grams: 3 },
    ],
    [
      { stepNumber: 1, title: '同煮出锅', action: '水开下紫菜豆腐丁与虾仁滚煮2分钟，撒白胡椒盐香油出锅。', durationSeconds: 120, visualCue: '红虾绿菜白豆腐汤清味鲜', tip: '全家老少都爱喝。' },
    ],
    { calories: 120, protein: 14.5, carbs: 3.5, fat: 4.8 },
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    ['虾', '豆腐']
  ),
  createRecipeItem(
    'st_yangchun_noodle_soup',
    '鲜虾菜心阳春清汤面',
    'staple',
    ['breakfast', 'lunch', 'dinner'],
    'shrimp',
    ['15分钟', '小白友好', '一人食'],
    10,
    '小白友好',
    '碗底调制生抽香油白胡椒清底，冲入滚沸面汤，盛入筋道细面与嫩虾菜心。',
    '煮',
    ['小汤锅'],
    [
      { name: '细挂面', amount: 60, unit: '克', category: '粮谷主食', grams: 60 },
      { name: '鲜虾仁', amount: 3, unit: '只', category: '豆制品水产', grams: 40 },
      { name: '菜心/油菜', amount: 30, unit: '克', category: '蔬菜菌菇', grams: 30 },
      { name: '生抽/香油/白胡椒/葱花', amount: 5, unit: '克', category: '调料辅料', grams: 5 },
    ],
    [
      { stepNumber: 1, title: '煮面出汤', action: '碗中放生抽香油葱花冲热汤，面条与虾仁菜心煮熟挑入碗中。', durationSeconds: 240, visualCue: '汤清见底面条齐整清爽无比', tip: '江南经典清雅风味。' },
    ],
    { calories: 280, protein: 14.5, carbs: 48.0, fat: 3.5 },
    'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
    ['面食', '虾']
  ),
  createRecipeItem(
    'st_multigrain_oat_congee',
    '温润杂粮糙米燕麦浓粥',
    'staple',
    ['breakfast', 'dinner'],
    'none',
    ['低预算', '小白友好', '一锅搞定'],
    20,
    '小白友好',
    '糙米、燕麦与糯米煮至开花黏稠，谷香馥郁，养胃温脾。',
    '煮',
    ['电饭煲或砂锅'],
    [
      { name: '杂粮米燕麦混合', amount: 60, unit: '克', category: '粮谷主食', grams: 60 },
      { name: '清水', amount: 450, unit: 'ml', category: '调料辅料', grams: 450 },
    ],
    [
      { stepNumber: 1, title: '熬煮出油', action: '砂锅小火慢熬至米花绽放米汤粘稠起粥油。', durationSeconds: 1200, visualCue: '粥面浮起一层柔滑米油', tip: '温润易消化。' },
    ],
    { calories: 180, protein: 4.5, carbs: 38.0, fat: 1.0 },
    'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    ['杂粮']
  ),
  createRecipeItem(
    'st_chicken_cucumber_cold_noodles',
    '爽口鸡丝黄瓜清凉拌面',
    'staple',
    ['lunch', 'dinner'],
    'chicken',
    ['15分钟', '一人食', '家常菜', '高蛋白'],
    13,
    '小白友好',
    '手撕鸡丝与脆黄瓜丝铺于过凉水面条上，浇上特调蒜醋芝麻生抽汁。',
    '凉拌',
    ['小汤锅', '大碗'],
    [
      { name: '手擀面/拉面', amount: 70, unit: '克', category: '粮谷主食', grams: 70 },
      { name: '鸡胸肉丝', amount: 60, unit: '克', category: '肉禽蛋', grams: 60 },
      { name: '黄瓜丝', amount: 50, unit: '克', category: '蔬菜菌菇', grams: 50 },
      { name: '生抽/香醋/蒜末/香油', amount: 8, unit: '克', category: '调料辅料', grams: 8 },
    ],
    [
      { stepNumber: 1, title: '过凉拌汁', action: '面条煮熟过冰水控干，铺鸡丝黄瓜丝，浇蒜醋汁拌匀即可。', durationSeconds: 240, visualCue: '根根分明酸爽筋道', tip: '面条过凉水才爽滑不粘。' },
    ],
    { calories: 330, protein: 21.0, carbs: 50.0, fat: 5.5 },
    'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
    ['面食', '鸡肉', '黄瓜']
  ),
];

// Combine all recipe groups
const RAW_ALL_RECIPES: Recipe[] = [
  ...BREAKFAST_RECIPES,
  ...CHICKEN_RECIPES,
  ...BEEF_RECIPES,
  ...PORK_RECIPES,
  ...SEAFOOD_RECIPES,
  ...EGG_TOFU_RECIPES,
  ...VEGETABLE_RECIPES,
  ...SOUP_RECIPES,
  ...STAPLE_RECIPES,
  ...ADDITIONAL_RECIPES,
  ...COMPREHENSIVE_RECIPES,
  ...BULK_ADDITIONAL_RECIPES,
  ...RICE_COOKER_RECIPES,
  ...COMPONENT_RECIPES,
];

// Deduplicate by ID and ensure seasonings & lazy cooking fields completeness
const idSet = new Set<string>();
export const ALL_RECIPES: Recipe[] = RAW_ALL_RECIPES
  .filter(r => {
    if (idSet.has(r.id)) {
      return false;
    }
    idSet.add(r.id);
    return true;
  })
  .map(r => {
    const seasonings = r.seasonings && r.seasonings.length > 0
      ? r.seasonings
      : r.ingredients
          .filter(i => i.category === '调料辅料')
          .map(i => `${i.name} ${i.amount}${i.unit}`);

    const isRiceCooker = r.equipment?.some(eq => eq.includes('rice-cooker') || eq.includes('电饭煲')) || r.tags.includes('电饭煲');
    const isOnePot = r.onePot ?? (isRiceCooker || r.tags.includes('一锅出') || r.tags.includes('一锅搞定') || r.tags.includes('免开火'));
    const isHandsOff = r.handsOff ?? (isRiceCooker || r.tags.includes('免看火') || r.cookingMethod === '炖' || r.cookingMethod === '蒸');

    // Strict complete meal calculation: Must contain Protein + Vegetable + Staple in one dish
    const hasProt = (r.proteinSource && r.proteinSource !== 'none') ||
      r.protein >= 15 ||
      Boolean(r.ingredients?.some(i => i.category === '肉禽蛋' || i.category === '豆制品水产'));
    const hasVeg = r.category === 'vegetable' ||
      Boolean(r.ingredients?.some(i => i.category === '蔬菜菌菇'));
    const hasStaple = r.category === 'staple' ||
      Boolean(r.tags?.some(t => ['焖饭', '炒饭', '盖饭', '炒面', '汤面', '拌面'].includes(t))) ||
      Boolean(['焖饭', '炒饭', '盖饭', '炒面', '汤面', '拌面', '乌冬'].some(kw => r.name.includes(kw))) ||
      Boolean(r.ingredients?.some(i => i.category === '粮谷主食' && !i.name.includes('淀粉') && !i.name.includes('生粉')));
    const isPureStaple = r.category === 'staple' && (!r.proteinSource || r.proteinSource === 'none');

    const isComplete = !isPureStaple && r.category !== 'soup' && hasProt && hasVeg && hasStaple;

    const activeTime = r.activeTimeMinutes ?? (
      isRiceCooker ? Math.min(8, r.prepTimeMinutes || 6) : (r.prepTimeMinutes || Math.max(3, Math.round(r.timeMinutes * 0.4)))
    );
    const passiveTime = r.passiveTimeMinutes ?? (
      isRiceCooker ? (r.timeMinutes - activeTime) : (r.cookTimeMinutes || Math.max(2, r.timeMinutes - activeTime))
    );
    const totalTime = r.totalTimeMinutes ?? r.timeMinutes ?? (activeTime + passiveTime);

    return {
      ...r,
      seasonings: seasonings.length > 0 ? seasonings : ['食用油 5克', '食盐 2克'],
      equipment: isRiceCooker ? Array.from(new Set([...(r.equipment || []), 'rice-cooker', '电饭煲'])) : (r.equipment || ['炒锅']),
      onePot: isOnePot,
      handsOff: isHandsOff,
      prepComplexity: r.prepComplexity || (activeTime <= 8 ? 'low' : activeTime <= 15 ? 'medium' : 'high'),
      cookwareCount: r.cookwareCount ?? (isOnePot ? 1 : 2),
      activeTimeMinutes: activeTime,
      passiveTimeMinutes: passiveTime,
      totalTimeMinutes: totalTime,
      isCompleteMeal: isComplete,
    };
  });

// Map for quick lookup
export const RECIPE_MAP: Map<string, Recipe> = new Map(
  ALL_RECIPES.map(r => [r.id, r])
);

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPE_MAP.get(id);
}

export function getRecipesByCategory(category: RecipeCategory): Recipe[] {
  return ALL_RECIPES.filter(r => r.category === category);
}

export function getRecipesByMealType(mealType: MealType): Recipe[] {
  return ALL_RECIPES.filter(r => r.mealTypes.includes(mealType));
}

export function getRecipesByProtein(protein: ProteinSource): Recipe[] {
  return ALL_RECIPES.filter(r => r.proteinSource === protein);
}

/**
 * Domain Helpers: Distinguish between atomic Food Components (11 items) and Complete Recipes (170 dishes)
 */
export function isFoodComponent(recipe: Recipe | { id: string }): boolean {
  return recipe.id.startsWith('cmp_');
}

export function isCompleteRecipe(recipe: Recipe | { id: string }): boolean {
  return !recipe.id.startsWith('cmp_');
}

/**
 * Returns strictly the 170 Complete Recipes for public catalog / library browsing
 */
export function getPublicRecipes(): Recipe[] {
  return ALL_RECIPES.filter(isCompleteRecipe);
}
