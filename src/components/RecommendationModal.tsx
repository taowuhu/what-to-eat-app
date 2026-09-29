import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Clock,
  ChefHat,
  User,
  ShoppingCart,
  ChevronRight,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Refrigerator,
  Copy,
  PlusCircle,
  Sparkles,
  Star,
  HelpCircle,
} from 'lucide-react';
import { MealCombo, Recipe, UserProfile, MacroNutrients, QuickFilterId, FeedbackSkipReason, PantryCoverageInfo } from '../types';
import { generateAlternativeMeals } from '../utils/recommender';
import { scaleRecipe, scaleRecipeForServings } from '../utils/servingsScaler';
import { auditMealPantryCoverage } from '../utils/ingredientMatcher';
import { aggregateIngredients } from '../utils/dayPlanGenerator';
import { ServingsSegment } from './ServingsSegment';
import { RecommendationFeedbackModal } from './RecommendationFeedbackModal';

interface RecommendationModalProps {
  combo: MealCombo | null;
  isOpen: boolean;
  onClose: () => void;
  onReroll: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCookingCombo: (combo: MealCombo) => void;
  onSelectCombo?: (combo: MealCombo) => void;
  isShuffling?: boolean;
  userProfile?: UserProfile;
  remainingMacros?: MacroNutrients;
  activeFilters?: QuickFilterId[];
  historyRecipeIds?: string[];
  pantryIngredientIds?: string[];
  clearFridgeMode?: boolean;
  onOpenPantry?: () => void;
  onAddMissingToGrocery?: (items: { name: string; amount: number; unit: string; category?: string }[]) => void;
  favoriteRecipeIds?: string[];
  onToggleFavorite?: (recipeId: string) => void;
  onFeedbackSkip?: (reason: FeedbackSkipReason, targetRecipeId?: string) => void;
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  combo,
  isOpen,
  onClose,
  onReroll,
  onSelectRecipe,
  onStartCookingCombo,
  onSelectCombo,
  isShuffling,
  userProfile,
  remainingMacros,
  activeFilters,
  historyRecipeIds,
  pantryIngredientIds = [],
  clearFridgeMode = false,
  onOpenPantry,
  onAddMissingToGrocery,
  favoriteRecipeIds = [],
  onToggleFavorite,
  onFeedbackSkip,
}) => {
  const [servings, setServings] = useState<number>(userProfile?.defaultServings || 1);
  const [showGroceries, setShowGroceries] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [alternatives, setAlternatives] = useState<MealCombo[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false);
  const [copiedMissing, setCopiedMissing] = useState(false);
  const [addedToGrocery, setAddedToGrocery] = useState(false);

  // Sync default servings whenever userProfile changes
  useEffect(() => {
    if (userProfile?.defaultServings) {
      setServings(userProfile.defaultServings);
    }
  }, [userProfile?.defaultServings]);

  // Scaled combo for display and cooking (single source of truth for servings)
  const scaledCombo = useMemo(() => {
    if (!combo) return null;
    const scaledRecipes = combo.recipes.map(r => scaleRecipeForServings(r, servings));
    const totalCalories = scaledRecipes.reduce((sum, r) => sum + r.calories, 0);
    const totalProtein = Math.round(scaledRecipes.reduce((sum, r) => sum + r.protein, 0) * 10) / 10;
    const totalCarbs = Math.round(scaledRecipes.reduce((sum, r) => sum + r.carbs, 0) * 10) / 10;
    const totalFat = Math.round(scaledRecipes.reduce((sum, r) => sum + r.fat, 0) * 10) / 10;

    let updatedPantryCoverage: PantryCoverageInfo | undefined = undefined;
    if (pantryIngredientIds && pantryIngredientIds.length > 0) {
      const pantryAudit = auditMealPantryCoverage(scaledRecipes, pantryIngredientIds, clearFridgeMode);
      if (pantryAudit && pantryAudit.totalCount > 0) {
        updatedPantryCoverage = {
          totalCount: pantryAudit.totalCount,
          matchedCount: pantryAudit.matchedCount,
          missingCount: pantryAudit.missingCount,
          coverageRate: pantryAudit.coverageRate,
          matchedIngredients: pantryAudit.matchedIngredients.map(m => ({
            name: m.ingredient.name,
            amount: m.ingredient.amount,
            unit: m.ingredient.unit,
            category: m.ingredient.category,
          })),
          missingIngredients: pantryAudit.missingIngredients.map(m => ({
            name: m.ingredient.name,
            amount: m.ingredient.amount,
            unit: m.ingredient.unit,
            category: m.ingredient.category,
          })),
          matchedCanonicalNames: pantryAudit.matchedCanonicalNames,
          missingCanonicalNames: pantryAudit.missingCanonicalNames,
          selectedPantryCount: pantryAudit.selectedPantryCount,
          matchedPantryCount: pantryAudit.matchedPantryCount,
          coverageRatio: pantryAudit.coverageRatio,
          pantryFallback: pantryAudit.pantryFallback,
          unusedPantryIngredients: pantryAudit.unusedPantryIngredients,
        };
      }
    }

    return {
      ...combo,
      recipes: scaledRecipes,
      servingSize: `${servings}人份`,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      pantryCoverage: updatedPantryCoverage,
      selectedPantryCount: updatedPantryCoverage?.selectedPantryCount ?? combo.selectedPantryCount,
      matchedPantryCount: updatedPantryCoverage?.matchedPantryCount ?? combo.matchedPantryCount,
      coverageRatio: updatedPantryCoverage?.coverageRatio ?? combo.coverageRatio,
      pantryFallback: updatedPantryCoverage?.pantryFallback ?? combo.pantryFallback,
      unusedPantryIngredients: updatedPantryCoverage?.unusedPantryIngredients ?? combo.unusedPantryIngredients,
    };
  }, [combo, servings, pantryIngredientIds, clearFridgeMode]);

  // Scaled and merged grocery items for the current meal combo
  const mergedMealGroceries = useMemo(() => {
    if (!scaledCombo) return [];
    return aggregateIngredients(scaledCombo.recipes, pantryIngredientIds);
  }, [scaledCombo, pantryIngredientIds]);

  // Generate 3 diverse alternative meal options
  const fetchAlternatives = () => {
    if (!userProfile) return;
    setIsLoadingAlternatives(true);
    setTimeout(() => {
      const generated = generateAlternativeMeals(3, {
        remainingMacros: remainingMacros || { calories: 600, protein: 30, carbs: 65, fat: 20 },
        userProfile,
        activeFilters,
        historyRecipeIds,
        pantryIngredientIds,
        clearFridgeMode,
      });
      setAlternatives(generated);
      setIsLoadingAlternatives(false);
    }, 120);
  };

  const handleToggleAlternatives = () => {
    if (!showAlternatives && alternatives.length === 0) {
      fetchAlternatives();
    }
    setShowAlternatives(!showAlternatives);
  };

  const handleChooseAlternative = (altCombo: MealCombo) => {
    if (onSelectCombo) {
      onSelectCombo(altCombo);
    }
    setShowAlternatives(false);
  };

  // Copy missing ingredients to clipboard (reflecting scaled servings)
  const handleCopyMissing = () => {
    let missing = scaledCombo?.pantryCoverage?.missingIngredients;
    if (!missing || missing.length === 0) {
      // If no pantry specified or coverage missing, use all non-seasoning groceries
      missing = mergedMealGroceries
        .filter(i => i.category !== '调味料' && !i.isInPantry)
        .map(i => ({ name: i.name, amount: i.amount, unit: i.unit, category: i.category }));
    }
    if (!missing?.length) return;
    const missingText = missing
      .map(i => `${i.name} ${i.amount}${i.unit}`)
      .join('、');
    
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`【需要补充食材（${servings}人份）】${missingText}`);
    }
    setCopiedMissing(true);
    setTimeout(() => setCopiedMissing(false), 2000);
  };

  // Add missing ingredients to grocery list (reflecting scaled servings)
  const handleAddToGrocery = () => {
    let missing = scaledCombo?.pantryCoverage?.missingIngredients;
    if (!missing || missing.length === 0) {
      missing = mergedMealGroceries
        .filter(i => i.category !== '调味料' && !i.isInPantry)
        .map(i => ({ name: i.name, amount: i.amount, unit: i.unit, category: i.category }));
    }
    if (!missing?.length) return;
    if (onAddMissingToGrocery) {
      onAddMissingToGrocery(missing);
    }
    setAddedToGrocery(true);
    setTimeout(() => setAddedToGrocery(false), 2000);
  };

  // Reset states when combo changes
  useEffect(() => {
    setShowAlternatives(false);
    setAlternatives([]);
    setCopiedMissing(false);
    setAddedToGrocery(false);
  }, [combo?.id]);

  if (!isOpen || !combo || !scaledCombo) return null;

  const pantryCoverage = scaledCombo.pantryCoverage || combo.pantryCoverage;
  const hasPantryData = pantryCoverage && pantryCoverage.totalCount > 0;

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF7F2] w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-stone-200">
        {/* Top Header */}
        <div className="p-4 bg-white border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-stone-900 leading-tight flex items-center gap-1.5">
              {scaledCombo.isLazy && <Sparkles className="w-4 h-4 text-orange-500 fill-orange-400" />}
              <span>{scaledCombo.isLazy ? '今天就懒一下' : '今天就吃这个'}</span>
            </h2>
            <p className="text-[11px] text-stone-500">
              {scaledCombo.isLazy
                ? `动手约 ${scaledCombo.activeTimeMinutes || 6} 分钟 · 剩下交给锅具 · 少洗锅`
                : scaledCombo.complexity === 'simple'
                ? '专为一人食精简 · 一碗满足少洗碗'
                : '有荤有素有主食 · 家常好上手'}
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
          {/* Main Meal Set Summary Card */}
          <div
            className={`bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs transition-all ${
              isShuffling ? 'scale-95 opacity-50 blur-xs' : 'scale-100 opacity-100'
            }`}
          >
            {/* Lazy mode banner if hit */}
            {scaledCombo.isLazy && (
              <div className="mb-2.5 px-3 py-1.5 rounded-xl bg-orange-50/90 border border-orange-200/80 flex items-center justify-between text-xs text-orange-950 font-bold">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>懒人免看火 · 少洗一个锅</span>
                </div>
                <span className="text-[11px] text-orange-700 bg-orange-100/70 px-1.5 py-0.5 rounded">
                  {scaledCombo.cookwareCount ? `${scaledCombo.cookwareCount}个锅` : '一锅出'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {combo.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-orange-50 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-orange-200/60"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h3 className="text-xl font-black text-stone-900 tracking-tight leading-snug">
              {combo.comboTitle}
            </h3>

            {/* Clearly list dishes */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2 py-1 px-2.5 rounded-xl bg-[#FAF7F2] border border-stone-200/60 text-xs font-bold text-stone-800">
              {combo.recipes.map((r, i) => (
                <React.Fragment key={r.id}>
                  <span>{r.name}</span>
                  {i < combo.recipes.length - 1 && (
                    <span className="text-stone-400 font-normal">·</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* 诚实耗时与关键信息展示 (V0.4.6: 区分动手时间与等待时间) */}
            <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-4 gap-1.5 text-center">
              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/50">
                <span className="text-[10px] text-stone-400 block flex items-center justify-center gap-0.5 mb-0.5">
                  <ChefHat className="w-3 h-3 text-orange-600" /> 动手切配
                </span>
                <span className="text-xs font-black text-orange-700">
                  {scaledCombo.activeTimeMinutes || 6} 分钟
                </span>
              </div>

              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/50">
                <span className="text-[10px] text-stone-400 block flex items-center justify-center gap-0.5 mb-0.5">
                  <Clock className="w-3 h-3 text-stone-500" /> 等待烹煮
                </span>
                <span className="text-xs font-bold text-stone-700">
                  {scaledCombo.passiveTimeMinutes || 20} 分钟
                </span>
              </div>

              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/50">
                <span className="text-[10px] text-stone-400 block flex items-center justify-center gap-0.5 mb-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" /> 锅具清洗
                </span>
                <span className="text-xs font-bold text-stone-800">
                  {scaledCombo.cookwareCount || 1} 个锅
                </span>
              </div>

              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/50">
                <span className="text-[10px] text-stone-400 block flex items-center justify-center gap-0.5 mb-0.5">
                  <User className="w-3 h-3 text-stone-500" /> 适合份量
                </span>
                <span className="text-xs font-bold text-stone-800">
                  {scaledCombo.servingSize || `${servings}人份`}
                </span>
              </div>
            </div>

            {/* 人数份量选择 (V0.4.5: 1人/2人/3人/4人切换) */}
            <div className="mt-3 pt-3 border-t border-stone-100">
              <ServingsSegment
                value={servings}
                onChange={setServings}
              />
            </div>

            <p className="text-xs text-stone-600 mt-2.5 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              💡 {scaledCombo.recommendationReason}
            </p>
          </div>

          {/* Section 1 & 2: 今天吃什么 (菜品明细) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-stone-800">
                整餐菜品搭配 ({scaledCombo.recipes.length} 道 · {servings}人份)
              </span>
              <span className="text-[11px] text-stone-400">点击查看做法</span>
            </div>

            <div className="space-y-2">
              {scaledCombo.recipes.map((recipe) => {
                const isFav = favoriteRecipeIds.includes(recipe.id);
                return (
                  <div
                    key={recipe.id}
                    onClick={() => onSelectRecipe(recipe)}
                    className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs hover:border-orange-200 transition cursor-pointer flex items-center gap-3 group active:scale-[0.99]"
                  >
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-stone-100"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-stone-900 truncate group-hover:text-orange-600 transition">
                          {recipe.name}
                        </h4>
                        {onToggleFavorite && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(recipe.id);
                            }}
                            className={`p-1 rounded-full hover:bg-stone-100 transition shrink-0 ${
                              isFav ? 'text-amber-500' : 'text-stone-300 hover:text-stone-500'
                            }`}
                            title={isFav ? '已收藏' : '加入收藏'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                        {recipe.summary}
                      </p>
                      <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1.5 flex-wrap">
                        {recipe.equipment?.some(eq => eq.includes('rice-cooker') || eq.includes('电饭煲')) ? (
                          <span className="bg-amber-100/90 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                            电饭煲
                          </span>
                        ) : recipe.onePot ? (
                          <span className="bg-orange-100/90 text-orange-900 font-bold px-1.5 py-0.2 rounded">
                            一锅出
                          </span>
                        ) : null}
                        <span>动手 {recipe.activeTimeMinutes || 6}分</span>
                        <span>·</span>
                        <span>等待 {recipe.passiveTimeMinutes || Math.max(10, recipe.cookTimeMinutes)}分</span>
                        {servings > 1 && (
                          <>
                            <span>·</span>
                            <span className="text-orange-600 font-bold">{servings}人量</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-stone-50 group-hover:bg-orange-50 flex items-center justify-center shrink-0 text-stone-400 group-hover:text-orange-600 transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Visual Weight Entry: 看看另外 3 套方案 */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs">
            <button
              type="button"
              onClick={handleToggleAlternatives}
              className="w-full flex items-center justify-between text-xs font-semibold text-stone-700 hover:text-stone-900 transition py-0.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center">
                  <LayoutGrid className="w-3 h-3" />
                </div>
                <span>看看另外 3 套备选方案</span>
              </div>
              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                {showAlternatives ? '收起备选' : '展开选择'}
                {showAlternatives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {/* Alternatives Drawer / Expansion */}
            {showAlternatives && (
              <div className="mt-3 pt-3 border-t border-stone-100 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
                  <span>不同蛋白与风味搭配，点击直接选用：</span>
                  <button
                    onClick={fetchAlternatives}
                    disabled={isLoadingAlternatives}
                    className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingAlternatives ? 'animate-spin' : ''}`} />
                    <span>换一组</span>
                  </button>
                </div>

                {isLoadingAlternatives ? (
                  <div className="py-6 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    <span>正在生成 3 套荤素搭配方案...</span>
                  </div>
                ) : (
                  alternatives.map((alt, idx) => (
                    <div
                      key={alt.id}
                      onClick={() => handleChooseAlternative(alt)}
                      className="bg-[#FAF7F2] hover:bg-orange-50/60 p-2.5 rounded-xl border border-stone-200/70 hover:border-orange-200 transition cursor-pointer flex flex-col gap-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-stone-800 group-hover:text-orange-700 transition">
                            {alt.comboTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-orange-600 font-bold group-hover:underline">
                          选用这套 →
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-600 truncate">
                        {alt.recipes.map((r) => r.name).join(' + ')}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-stone-400">
                        <span>约 {alt.estimatedTimeMinutes} 分钟</span>
                        <span>·</span>
                        <span>{alt.totalCalories} kcal</span>
                        <span>·</span>
                        <span>蛋白 {alt.totalProtein}g</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Section 2: 本餐食材盘点 (家里有什么 / 还缺什么) */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            {hasPantryData ? (
              <div className="space-y-3">
                {/* Header & Coverage Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                      <Refrigerator className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 leading-tight">
                        本餐食材盘点
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        已有{' '}
                        <span className="font-bold text-emerald-600">
                          {pantryCoverage.matchedCount}
                        </span>
                        {' '}/{' '}
                        <span className="font-bold text-stone-700">
                          {pantryCoverage.totalCount}
                        </span>{' '}
                        种食材 · 覆盖率约{' '}
                        <span className="font-bold text-emerald-600">
                          {Math.round(pantryCoverage.coverageRate * 100)}%
                        </span>
                      </p>
                    </div>
                  </div>

                  {onOpenPantry && (
                    <button
                      type="button"
                      onClick={onOpenPantry}
                      className="text-[11px] text-stone-400 hover:text-orange-600 transition underline underline-offset-2 shrink-0"
                    >
                      调整食材
                    </button>
                  )}
                </div>

                {/* Visual Ratio Bar */}
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round(pantryCoverage.coverageRate * 100)}%` }}
                  />
                </div>

                {/* Honest Fallback Notice when some pantry items were left unused */}
                {pantryCoverage.pantryFallback && pantryCoverage.unusedPantryIngredients && pantryCoverage.unusedPantryIngredients.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span>
                      这顿先用上【{pantryCoverage.matchedCanonicalNames.slice(0, 3).join('、')}】，【{pantryCoverage.unusedPantryIngredients.join('、')}】还没用上
                    </span>
                  </div>
                )}

                {/* 1. 家里已有 */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-emerald-800 flex items-center justify-between mb-1.5 px-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      家里已有 ({pantryCoverage.matchedCount} 样)
                    </span>
                    <span className="text-[10px] text-emerald-600 font-normal">已在厨房存货中</span>
                  </div>

                  {pantryCoverage.matchedIngredients.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      {pantryCoverage.matchedIngredients.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/60 px-2.5 py-1.5 rounded-xl text-xs text-emerald-950"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3] shrink-0" />
                            <span className="font-semibold truncate">{item.name}</span>
                          </div>
                          <span className="text-[10px] text-emerald-700/80 shrink-0 font-mono pl-1">
                            {item.amount} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-stone-400 py-1 px-1">
                      本餐尚未匹配到已选存货食材
                    </div>
                  )}
                </div>

                {/* 2. 还需要 */}
                <div className="pt-1">
                  <div className="text-[11px] font-bold text-stone-800 flex items-center justify-between mb-1.5 px-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      还需要 ({pantryCoverage.missingCount} 样)
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">做前需补充或购买</span>
                  </div>

                  {pantryCoverage.missingIngredients.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {pantryCoverage.missingIngredients.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 rounded-xl text-xs text-stone-800"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-3.5 h-3.5 rounded border border-stone-300 bg-white flex items-center justify-center shrink-0 text-[9px] text-stone-400 font-mono">
                                □
                              </span>
                              <span className="font-medium truncate">{item.name}</span>
                            </div>
                            <span className="text-[10px] text-stone-500 shrink-0 font-mono pl-1">
                              {item.amount} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 还缺食材一键处理操作栏 */}
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyMissing}
                          className="flex-1 py-1.5 px-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                        >
                          {copiedMissing ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">已复制到剪贴板</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-400" />
                              <span>复制还缺食材</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleAddToGrocery}
                          className="flex-1 py-1.5 px-2.5 rounded-xl border border-orange-200/80 bg-orange-50/80 hover:bg-orange-100 text-orange-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                        >
                          {addedToGrocery ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">已加至清单</span>
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
                              <span>加入采购清单</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : !pantryCoverage.pantryFallback ? (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>太棒了！所有主食材家中均有，无需额外买菜！</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 text-center text-xs text-amber-800 font-bold flex items-center justify-center gap-1.5">
                      <span>本餐用到的主食材家中均有，剩余食材后续可再做一顿</span>
                    </div>
                  )}
                </div>

                {/* 调料辅料说明 */}
                <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100 flex items-center justify-between">
                  <span>注：葱姜蒜、油盐酱醋等常用调味料默认家中常备</span>
                  <button
                    type="button"
                    onClick={() => setShowGroceries(!showGroceries)}
                    className="text-stone-500 hover:text-stone-700 underline flex items-center gap-0.5"
                  >
                    <span>{showGroceries ? '收起完整清单' : '看完整辅料清单'}</span>
                    {showGroceries ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showGroceries && (
                  <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-1.5 text-xs animate-in fade-in duration-150">
                    {mergedMealGroceries.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#FAF7F2] px-2.5 py-1.5 rounded-lg text-stone-700 border border-stone-200/50"
                      >
                        <span className="font-medium truncate pr-1">{ing.name}</span>
                        <span className="text-[11px] text-stone-500 shrink-0 font-mono">
                          {ing.amount} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowGroceries(!showGroceries)}
                  className="w-full flex items-center justify-between text-xs font-bold text-stone-700"
                >
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span>要准备什么 · 食材备料清单</span>
                  </div>
                  <span className="text-stone-400 text-[11px] flex items-center gap-0.5">
                    {showGroceries ? '收起' : `展开查看 (${mergedMealGroceries.length} 样食材)`}
                    {showGroceries ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>

                {/* Soft invitation to use pantry */}
                {onOpenPantry && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between bg-[#FAF7F2] p-2 rounded-xl border border-stone-200/60">
                    <div className="flex items-center gap-1.5 text-stone-600 text-xs">
                      <Refrigerator className="w-3.5 h-3.5 text-orange-500" />
                      <span>告诉厨房有什么，优先用家里食材</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenPantry}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                    >
                      去勾选 →
                    </button>
                  </div>
                )}

                {showGroceries && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs animate-in fade-in duration-150">
                    {mergedMealGroceries.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#FAF7F2] px-2.5 py-1.5 rounded-lg text-stone-700 border border-stone-200/50"
                      >
                        <span className="font-medium truncate pr-1">{ing.name}</span>
                        <span className="text-[11px] text-stone-500 shrink-0 font-mono">
                          {ing.amount} {ing.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: 营养参考 (默认弱化折叠，点击展开才显示数值，无大面积仪表盘) */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-stone-500">
                搭配均衡 · 优质蛋白 · 少油少盐
              </span>
              <button
                type="button"
                onClick={() => setShowNutrition(!showNutrition)}
                className="text-[11px] text-stone-400 hover:text-stone-600 underline underline-offset-2 flex items-center gap-0.5"
              >
                <span>{showNutrition ? '收起营养参考' : '查看营养参考'}</span>
                {showNutrition ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {showNutrition && (
              <div className="mt-2.5 pt-2.5 border-t border-stone-100 space-y-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  <div className="bg-stone-50 py-1.5 rounded-lg">
                    <span className="text-[10px] text-stone-400 block">热量</span>
                    <span className="font-bold text-stone-700">{scaledCombo.totalCalories} kcal</span>
                  </div>
                  <div className="bg-stone-50 py-1.5 rounded-lg">
                    <span className="text-[10px] text-stone-400 block">蛋白质</span>
                    <span className="font-bold text-stone-700">{scaledCombo.totalProtein}g</span>
                  </div>
                  <div className="bg-stone-50 py-1.5 rounded-lg">
                    <span className="text-[10px] text-stone-400 block">碳水</span>
                    <span className="font-bold text-stone-700">{scaledCombo.totalCarbs}g</span>
                  </div>
                  <div className="bg-stone-50 py-1.5 rounded-lg">
                    <span className="text-[10px] text-stone-400 block">脂肪</span>
                    <span className="font-bold text-stone-700">{scaledCombo.totalFat}g</span>
                  </div>
                </div>

                {scaledCombo.nutritionValidation && (
                  <div className="text-[11px] text-stone-500 bg-stone-50/80 p-2.5 rounded-xl text-left border border-stone-200/50 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-stone-400">单餐宏量营养摄入估算</span>
                      <span className="text-emerald-600 font-medium">结构与数量充足</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-stone-600 pt-0.5">
                      <div>蛋白: {scaledCombo.totalProtein}g <span className="text-stone-400">({scaledCombo.nutritionValidation.targetRanges.protein.min}~{scaledCombo.nutritionValidation.targetRanges.protein.max}g)</span></div>
                      <div>碳水: {scaledCombo.totalCarbs}g <span className="text-stone-400">({scaledCombo.nutritionValidation.targetRanges.carbs.min}~{scaledCombo.nutritionValidation.targetRanges.carbs.max}g)</span></div>
                      <div>脂肪: {scaledCombo.totalFat}g <span className="text-stone-400">({scaledCombo.nutritionValidation.targetRanges.fat.min}~{scaledCombo.nutritionValidation.targetRanges.fat.max}g)</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="p-4 bg-white border-t border-stone-200/80 shrink-0 space-y-2">
          <div className="grid grid-cols-3 gap-2.5">
            {/* 次按钮: 换一顿 */}
            <button
              id="btn-combo-reroll"
              type="button"
              onClick={onReroll}
              disabled={isShuffling}
              className="col-span-1 py-3.5 px-3 rounded-2xl border border-stone-200 font-bold text-xs text-stone-700 bg-stone-50 hover:bg-stone-100 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isShuffling ? 'animate-spin text-orange-600' : 'text-stone-500'
                }`}
              />
              <span>换一顿</span>
            </button>

            {/* 主要按钮: 就吃这个 -> 进入准备食材 -> 开始做饭流程 */}
            <button
              id="btn-combo-cook-now"
              type="button"
              onClick={() => onStartCookingCombo(scaledCombo)}
              className="col-span-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>就吃这个 ({servings}人份)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* V0.4 智能偏好反馈入口: 不想吃这个？ */}
          <div className="flex items-center justify-between px-1 pt-1">
            <button
              type="button"
              id="btn-open-feedback-reasons"
              onClick={() => setShowFeedbackModal(true)}
              className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1 transition underline-offset-2 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              <span>不想吃这顿？点此调整偏好</span>
            </button>
            {servings > 1 && (
              <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200/50">
                已自动换算 {servings}人份用量
              </span>
            )}
          </div>
        </div>

        {/* 负向反馈模态弹窗 */}
        {showFeedbackModal && (
          <RecommendationFeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            recipes={scaledCombo.recipes}
            onSubmit={(reason, targetRecipeId) => {
              if (onFeedbackSkip) {
                onFeedbackSkip(reason, targetRecipeId);
              }
              // Automatically reroll to give a refreshed recommendation
              onReroll();
            }}
          />
        )}
      </div>
    </div>
  );
};
