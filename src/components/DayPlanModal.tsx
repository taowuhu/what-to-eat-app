import React, { useState, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Clock,
  ChefHat,
  Check,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sun,
  Utensils,
  Sunset,
  Refrigerator,
  Copy,
  Star,
} from 'lucide-react';
import { DayMealPlan, DayMealSlot, MealType, Recipe, GroceryCategory } from '../types';
import { buildDayGroceryList } from '../utils/dayPlanGenerator';
import { scaleRecipeForServings } from '../utils/servingsScaler';
import { auditMealPantryCoverage } from '../utils/ingredientMatcher';
import { ServingsSegment } from './ServingsSegment';

interface DayPlanModalProps {
  plan: DayMealPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onRerollSingleMeal: (mealType: MealType) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCookingMeal: (slot: DayMealSlot) => void;
  onAcceptPlan: () => void;
  isRerollingMealType?: MealType | null;
  defaultServings?: number;
  favoriteRecipeIds?: string[];
  onToggleFavorite?: (recipeId: string) => void;
  pantryIngredientIds?: string[];
  clearFridgeMode?: boolean;
}

export const DayPlanModal: React.FC<DayPlanModalProps> = ({
  plan,
  isOpen,
  onClose,
  onRerollSingleMeal,
  onSelectRecipe,
  onStartCookingMeal,
  onAcceptPlan,
  isRerollingMealType,
  defaultServings = 1,
  favoriteRecipeIds = [],
  onToggleFavorite,
  pantryIngredientIds = [],
  clearFridgeMode = false,
}) => {
  const [servings, setServings] = useState<number>(defaultServings);
  const [showGroceries, setShowGroceries] = useState(false);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [checkedGroceries, setCheckedGroceries] = useState<Record<string, boolean>>({});
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);
  const [copiedMissing, setCopiedMissing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setServings(defaultServings);
    }
  }, [isOpen, defaultServings]);

  // Scaled meal plan based on current servings (single source of truth)
  const scaledPlan = useMemo(() => {
    if (!plan) return null;

    const scaleSlot = (slot: DayMealSlot): DayMealSlot => {
      const scaledRecipes = slot.recipes.map(r => scaleRecipeForServings(r, servings));
      const calories = scaledRecipes.reduce((sum, r) => sum + r.calories, 0);
      const protein = Math.round(scaledRecipes.reduce((sum, r) => sum + r.protein, 0) * 10) / 10;
      const carbs = Math.round(scaledRecipes.reduce((sum, r) => sum + r.carbs, 0) * 10) / 10;
      const fat = Math.round(scaledRecipes.reduce((sum, r) => sum + r.fat, 0) * 10) / 10;
      return {
        ...slot,
        recipes: scaledRecipes,
        calories,
        protein,
        carbs,
        fat,
      };
    };

    const scaledBreakfast = scaleSlot(plan.breakfast);
    const scaledLunch = scaleSlot(plan.lunch);
    const scaledDinner = scaleSlot(plan.dinner);

    const totalCalories = scaledBreakfast.calories + scaledLunch.calories + scaledDinner.calories;
    const totalProtein = Math.round((scaledBreakfast.protein + scaledLunch.protein + scaledDinner.protein) * 10) / 10;
    const totalCarbs = Math.round((scaledBreakfast.carbs + scaledLunch.carbs + scaledDinner.carbs) * 10) / 10;
    const totalFat = Math.round((scaledBreakfast.fat + scaledLunch.fat + scaledDinner.fat) * 10) / 10;

    let scaledPantryCoverage = plan.pantryCoverage;
    if (pantryIngredientIds && pantryIngredientIds.length > 0) {
      const allScaledRecipes = [
        ...scaledBreakfast.recipes,
        ...scaledLunch.recipes,
        ...scaledDinner.recipes,
      ];
      const audit = auditMealPantryCoverage(allScaledRecipes, pantryIngredientIds, clearFridgeMode);
      scaledPantryCoverage = {
        coveragePercent: Math.round(audit.coverageRate * 100),
        missingCount: audit.missingCount,
        matchedCount: audit.matchedCount,
        totalCount: audit.totalCount,
      };
    }

    return {
      ...plan,
      breakfast: scaledBreakfast,
      lunch: scaledLunch,
      dinner: scaledDinner,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      pantryCoverage: scaledPantryCoverage,
    };
  }, [plan, servings, pantryIngredientIds, clearFridgeMode]);

  const groupedGroceries = useMemo(() => {
    if (!scaledPlan) {
      return { '肉蛋奶': [], '蔬菜': [], '主食': [], '调味料': [] } as Record<GroceryCategory, any[]>;
    }
    return buildDayGroceryList(scaledPlan, pantryIngredientIds);
  }, [scaledPlan, pantryIngredientIds]);

  if (!isOpen || !plan || !scaledPlan) return null;

  const groceryCategories: GroceryCategory[] = ['肉蛋奶', '蔬菜', '主食', '调味料'];
  const pantryCoverage = scaledPlan.pantryCoverage;

  const toggleGroceryCheck = (name: string) => {
    setCheckedGroceries(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleCopyMissing = () => {
    const categories: GroceryCategory[] = ['肉蛋奶', '蔬菜', '主食'];
    const missingItems = categories
      .flatMap(cat => groupedGroceries[cat] || [])
      .filter(i => !i.isInPantry);
    const text = missingItems.map(i => `${i.name} ${i.amount}${i.unit}`).join('、');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`【今日需购买食材(${servings}人份)】${text}`);
    }
    setCopiedMissing(true);
    setTimeout(() => setCopiedMissing(false), 2000);
  };

  const mealSlots: { slot: DayMealSlot; icon: React.ReactNode; periodBadge: string; buttonLabel: string }[] = [
    {
      slot: scaledPlan.breakfast,
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      periodBadge: '早餐',
      buttonLabel: '换早餐',
    },
    {
      slot: scaledPlan.lunch,
      icon: <Utensils className="w-4 h-4 text-orange-500" />,
      periodBadge: '午餐',
      buttonLabel: '换午餐',
    },
    {
      slot: scaledPlan.dinner,
      icon: <Sunset className="w-4 h-4 text-rose-500" />,
      periodBadge: '晚餐',
      buttonLabel: '换晚餐',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF7F2] w-full max-w-lg max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-stone-200">
        
        {/* Top Header: 今天这样吃 */}
        <div className="p-4 bg-white border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-stone-900 leading-tight">
              今天这样吃
            </h2>
            <p className="text-[11px] text-stone-500">
              早餐 · 午餐 · 晚餐 · 一次安排好
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-3.5 flex-1">
          {/* 人数与份量选择 (V0.4 新增：1人/2人/3人/4人切换) */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs">
            <ServingsSegment
              value={servings}
              onChange={setServings}
            />
          </div>

          {/* Expandable Nutrition Details (默认不展示，点击展开才显示数值) */}
          <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>搭配：均衡 · 优质高蛋白 · {servings}人份用量</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNutritionDetails(prev => !prev)}
                className="text-[11px] text-stone-400 hover:text-stone-700 underline underline-offset-2 flex items-center gap-0.5 shrink-0 ml-2"
              >
                <span>{showNutritionDetails ? '收起详情' : '查看营养详情'}</span>
                {showNutritionDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {showNutritionDetails && (
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-150">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/50">
                    <div className="text-[10px] text-stone-400 font-medium">全天热量估算</div>
                    <div className="text-sm font-bold text-stone-800 mt-0.5 font-mono">{scaledPlan.totalCalories}</div>
                    <div className="text-[9px] text-stone-400">kcal</div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/50">
                    <div className="text-[10px] text-stone-400 font-medium">蛋白质估算</div>
                    <div className="text-sm font-bold text-stone-800 mt-0.5 font-mono">{scaledPlan.totalProtein}g</div>
                    <div className="text-[9px] text-emerald-600">充足</div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/50">
                    <div className="text-[10px] text-stone-400 font-medium">碳水化合物</div>
                    <div className="text-sm font-bold text-stone-800 mt-0.5 font-mono">{scaledPlan.totalCarbs}g</div>
                    <div className="text-[9px] text-stone-400">适中</div>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/50">
                    <div className="text-[10px] text-stone-400 font-medium">脂肪</div>
                    <div className="text-sm font-bold text-stone-800 mt-0.5 font-mono">{scaledPlan.totalFat}g</div>
                    <div className="text-[9px] text-stone-400">清淡少油</div>
                  </div>
                </div>

                {scaledPlan.dayAudit && (
                  <div className="bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/50 text-[10px] text-stone-500 space-y-1">
                    <div className="flex items-center justify-between text-stone-600 font-medium">
                      <span>个性化目标适配度</span>
                      <span className="text-emerald-600 font-bold">{scaledPlan.dayAudit.targetFitRate}%</span>
                    </div>
                    <div className="text-stone-400 text-[9px] leading-relaxed">
                      * 营养数据基于中国食物成分表换算之摄入参考估算值，实际摄入随烹饪吸油与食材产地自然波动。
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pantry Coverage Card (八、与一天计划联动: 已有食材覆盖约 XX% 以及 今天还需购买 X 种食材) */}
          {pantryCoverage && (
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                    <Refrigerator className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>已有食材覆盖约</span>
                      <span className="text-emerald-600 font-black text-sm">{pantryCoverage.coveragePercent}%</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {pantryCoverage.missingCount > 0 ? (
                        <>
                          今天还需购买 <span className="font-bold text-orange-600">{pantryCoverage.missingCount}</span> 种食材
                        </>
                      ) : (
                        <span className="text-emerald-600 font-bold">太棒了！今天三餐所需主料家中全齐</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-stone-400 font-mono">
                  已匹配 {pantryCoverage.matchedCount} / {pantryCoverage.totalCount} 样
                </div>
              </div>

              {/* Coverage Progress Bar */}
              <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${pantryCoverage.coveragePercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Three Separate Meal Cards: 早餐, 午餐, 晚餐 */}
          <div className="space-y-3">
            {mealSlots.map(({ slot, icon, periodBadge, buttonLabel }) => {
              const isRerollingThis = isRerollingMealType === slot.type;

              return (
                <div
                  key={slot.type}
                  className={`bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs transition-all ${
                    isRerollingThis ? 'opacity-50 scale-[0.99] blur-[0.5px]' : 'opacity-100 scale-100'
                  }`}
                >
                  {/* Card Header: Meal Label + [换早餐/换午餐/换晚餐] */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-stone-100">{icon}</span>
                      <span className="text-xs font-black text-stone-800 tracking-wide">
                        {periodBadge}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium ml-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>{slot.timeMinutes}分钟</span>
                      </span>
                    </div>

                    {/* Single Meal Reroll Button (换早餐 / 换午餐 / 换晚餐) */}
                    <button
                      type="button"
                      onClick={() => onRerollSingleMeal(slot.type)}
                      disabled={isRerollingThis}
                      className="px-2.5 py-1 rounded-full bg-stone-50 hover:bg-orange-50 border border-stone-200/80 text-stone-600 hover:text-orange-600 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRerollingThis ? 'animate-spin text-orange-600' : ''}`} />
                      <span>{buttonLabel}</span>
                    </button>
                  </div>

                  {/* Meal Title & Dishes Display */}
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-snug">
                      {slot.title}
                    </h3>
                    <div className="flex items-center gap-2.5 text-[11px] text-stone-500 mt-1">
                      <span>约 {slot.calories} kcal</span>
                      <span>·</span>
                      <span>
                        蛋白 <strong className="font-semibold text-stone-700">{slot.protein}g</strong>
                        {slot.nutritionValidation?.targetRanges?.protein && (
                          <span className="text-stone-400 text-[10px] ml-1">
                            (目标 {slot.nutritionValidation.targetRanges.protein.min}~{slot.nutritionValidation.targetRanges.protein.max}g)
                          </span>
                        )}
                      </span>
                      <span>·</span>
                      <span>碳水 {slot.carbs}g</span>
                    </div>
                  </div>

                  {/* Dishes breakdown + Cook mode button */}
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                    {/* Visual badges of dishes */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                      {slot.recipes.map((recipe) => {
                        const isFav = favoriteRecipeIds.includes(recipe.id);
                        return (
                          <button
                            key={recipe.id}
                            type="button"
                            onClick={() => onSelectRecipe(recipe)}
                            className={`text-[11px] font-medium px-2 py-1 rounded-lg border truncate max-w-[140px] transition text-left flex items-center gap-1 ${
                              isFav
                                ? 'bg-amber-50/70 border-amber-200 text-stone-900 font-semibold'
                                : 'text-stone-700 bg-[#FAF7F2] hover:bg-stone-100 border-stone-200/60'
                            }`}
                            title="点击查看单道食谱详情与做法"
                          >
                            {isFav && <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />}
                            <span className="truncate">{recipe.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Step-by-Step Cooking Mode for this specific meal */}
                    <button
                      type="button"
                      onClick={() => onStartCookingMeal(slot)}
                      className="shrink-0 ml-2 px-2.5 py-1 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 font-bold text-xs flex items-center gap-1 transition active:scale-95"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>查看怎么做</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grocery List: “今天的采购清单” (肉蛋奶、蔬菜、主食、调味料分类) */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">今天的采购清单</h4>
                  <p className="text-[10px] text-stone-400">已自动合并三餐重复食材与准确数量</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGroceries(prev => !prev)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/70 transition flex items-center gap-1"
              >
                <span>{showGroceries ? '收起清单' : '展开清单'}</span>
                {showGroceries ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Categorized Grocery List: 肉蛋奶、蔬菜、主食、调味料 */}
            {showGroceries && (
              <div className="mt-3.5 pt-3 border-t border-stone-100 space-y-3 animate-in fade-in duration-150">
                {/* Filter and Quick Action Toolbar */}
                <div className="flex items-center justify-between pb-1 gap-2 flex-wrap">
                  {pantryCoverage && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterMissingOnly(false)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                          !filterMissingOnly
                            ? 'bg-stone-800 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        全部食材
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMissingOnly(true)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                          filterMissingOnly
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/60'
                        }`}
                      >
                        <span>只看还需买</span>
                        <span className="font-mono text-[10px]">({pantryCoverage.missingCount})</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyMissing}
                    className="ml-auto px-2 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
                  >
                    {copiedMissing ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">已复制需买清单</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-stone-400" />
                        <span>复制需买食材</span>
                      </>
                    )}
                  </button>
                </div>

                {groceryCategories.map((cat) => {
                  let items = groupedGroceries[cat] || [];
                  if (filterMissingOnly) {
                    items = items.filter(i => !i.isInPantry && cat !== '调味料');
                  }
                  if (items.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="text-[11px] font-bold text-stone-600 px-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span>{cat}</span>
                        <span className="text-[10px] text-stone-400 font-normal">({items.length}样)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {items.map((item, idx) => {
                          const isChecked = !!checkedGroceries[item.name];
                          const inPantry = item.isInPantry;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => toggleGroceryCheck(item.name)}
                              className={`p-2 rounded-xl text-left border transition flex items-start justify-between gap-1 text-xs ${
                                isChecked
                                  ? 'bg-stone-50 border-stone-200/60 text-stone-400 line-through'
                                  : inPantry
                                  ? 'bg-emerald-50/40 border-emerald-200/50 text-stone-800'
                                  : 'bg-[#FAF7F2] border-stone-200/70 text-stone-800 hover:border-orange-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold truncate">{item.name}</span>
                                  {inPantry && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 shrink-0 font-medium">
                                      已有
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-stone-400 truncate mt-0.5">
                                  {item.sourceDishes.join(' · ')}
                                </div>
                              </div>
                              <span className={`text-[11px] shrink-0 font-mono ${isChecked ? 'text-stone-400' : inPantry ? 'text-emerald-700 font-semibold' : 'text-stone-600 font-bold'}`}>
                                {item.amount} {item.unit}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-1 text-center">
                  <p className="text-[10px] text-stone-400">
                    💡 点击食材可划线标记已买或家里已有
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA: “就按这个吃” */}
        <div className="p-4 bg-white border-t border-stone-200/80 shrink-0">
          <button
            id="btn-dayplan-accept"
            type="button"
            onClick={() => {
              setShowGroceries(true);
              onAcceptPlan();
            }}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>就按这个吃</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
