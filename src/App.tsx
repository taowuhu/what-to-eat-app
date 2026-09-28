import React, { useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  DailyLog,
  MealCombo,
  Recipe,
  QuickFilterId,
  MealType,
  MealRecord,
  DayMealPlan,
  DayMealSlot,
} from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadDailyLog,
  saveDailyLog,
  loadPantryIngredients,
  savePantryIngredients,
  loadRecentIngredients,
  saveRecentIngredients,
  loadClearFridgeMode,
  saveClearFridgeMode,
  loadCustomGroceryItems,
  saveCustomGroceryItems,
  SavedGroceryItem,
  loadFavoriteRecipeIds,
  toggleFavoriteRecipeId,
  loadRecommendationFeedbacks,
  saveRecommendationFeedback,
  loadCookingFeedbacks,
} from './utils/storage';
import { calculateMacroTargets, calculateCurrentIntake, calculateRemainingMacros } from './utils/nutrition';
import { generateMealRecommendation } from './utils/recommender';
import { generateDayMealPlan, generateMealSlot } from './utils/dayPlanGenerator';
import { RECIPES } from './data/recipes';
import { FeedbackSkipReason } from './types';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeHeroDecision } from './components/HomeHeroDecision';
import { TodayInspiration } from './components/TodayInspiration';
import { RecentCookedSection } from './components/RecentCookedSection';
import { RecommendationModal } from './components/RecommendationModal';
import { DayPlanModal } from './components/DayPlanModal';
import { PantrySelectorModal } from './components/PantrySelectorModal';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { CookingModeView } from './components/CookingModeView';
import { ProfileView } from './components/ProfileView';
import { RecipeLibraryView } from './components/RecipeLibraryView';
import { RecipeDebugPage } from './components/RecipeDebugPage';
import { QAReportView } from './components/QAReportView';
import { Check, Sparkles, ChefHat } from 'lucide-react';

const isDebugRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;
  return (
    path === '/debug/recipes' ||
    path.endsWith('/debug/recipes') ||
    hash.includes('/debug/recipes') ||
    hash.includes('#recipes') ||
    search.includes('debug=recipes')
  );
};

const isQARoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;
  return (
    path === '/debug/qa' ||
    path.endsWith('/debug/qa') ||
    hash.includes('/debug/qa') ||
    hash.includes('#qa') ||
    search.includes('debug=qa')
  );
};

export default function App() {
  // Debug & QA page route checks
  const [isDebugView, setIsDebugView] = useState(() => isDebugRoute());
  const [isQAView, setIsQAView] = useState(() => isQARoute());

  useEffect(() => {
    const handlePopState = () => {
      setIsDebugView(isDebugRoute());
      setIsQAView(isQARoute());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // 1. Persistent state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [dailyLog, setDailyLog] = useState<DailyLog>(() => loadDailyLog());

  // V0.3: Pantry state (家里有什么 / 用现有食材决定吃什么)
  const [pantryIngredients, setPantryIngredients] = useState<string[]>(() => loadPantryIngredients());
  const [recentIngredients, setRecentIngredients] = useState<string[]>(() => loadRecentIngredients());
  const [clearFridgeMode, setClearFridgeMode] = useState<boolean>(() => loadClearFridgeMode());
  const [isPantrySelectorOpen, setIsPantrySelectorOpen] = useState(false);

  // V0.4: Favorites state (我的收藏)
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<string[]>(() => loadFavoriteRecipeIds());

  const handleToggleFavorite = (recipeId: string) => {
    const isNowFav = toggleFavoriteRecipeId(recipeId);
    setFavoriteRecipeIds(loadFavoriteRecipeIds());
    const r = RECIPES.find((item) => item.id === recipeId);
    showToast(
      isNowFav
        ? `已收藏「${r?.name || '食谱'}」，后续将优先推荐`
        : `已取消收藏「${r?.name || '食谱'}」`
    );
  };

  // V0.4: Temporary session preferences from ("不想吃这个" 的动态记忆)
  const [temporaryPreferences, setTemporaryPreferences] = useState<{
    noMeatToday?: boolean;
    preferLight?: boolean;
    tooTroublesome?: boolean;
  }>({});

  const handleFeedbackSkip = (reason: FeedbackSkipReason, targetRecipeId?: string) => {
    const recipeIds = targetRecipeId
      ? [targetRecipeId]
      : recommendedCombo?.recipes.map((r) => r.id) || [];

    saveRecommendationFeedback({
      id: `fb_${Date.now()}`,
      recipeIds,
      reason,
      timestamp: Date.now(),
    });

    const updatedTemp = { ...temporaryPreferences };
    if (reason === 'no_meat_today') {
      updatedTemp.noMeatToday = true;
      showToast('已记录：为你推荐时蔬、高钙豆腐与蛋类搭配');
    } else if (reason === 'prefer_light') {
      updatedTemp.preferLight = true;
      showToast('已记录：偏向清淡、白灼、少油少盐搭配');
    } else if (reason === 'too_troublesome') {
      updatedTemp.tooTroublesome = true;
      showToast('已记录：优先15分钟极速快手菜');
    } else if (reason === 'recently_eaten') {
      showToast('已记录：这几天不重复推荐这几道菜');
    } else if (reason === 'dislike_dish') {
      showToast('已记录：后续将减少这道菜的推荐');
    } else {
      showToast('已为你重新挑选其他美味搭配');
    }
    setTemporaryPreferences(updatedTemp);
  };

  // 2. Navigation & UI states
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedFilters, setSelectedFilters] = useState<QuickFilterId[]>([]);

  // Toggle filter chip (multi-select support)
  const handleToggleFilter = (filterId: QuickFilterId) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  // 3. Modals & workflows for [入口 A: 帮我选一顿]
  const [recommendedCombo, setRecommendedCombo] = useState<MealCombo | null>(null);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isShufflingMeal, setIsShufflingMeal] = useState(false);

  // 4. Modals & workflows for [入口 B: 帮我安排一天]
  const [dayPlan, setDayPlan] = useState<DayMealPlan | null>(null);
  const [isDayPlanOpen, setIsDayPlanOpen] = useState(false);
  const [rerollingMealType, setRerollingMealType] = useState<MealType | null>(null);

  // Recipe detail modal
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);

  // Cooking wizard active session (can be a combo, day slot, or single recipe)
  const [activeCookingCombo, setActiveCookingCombo] = useState<MealCombo | null>(null);
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Sync dailyLog to localStorage
  const updateDailyLog = (newLog: DailyLog) => {
    setDailyLog(newLog);
    saveDailyLog(newLog);
  };

  // Sync profile to localStorage
  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
    showToast('做饭推荐偏好已保存');
  };

  // Pantry handlers
  const handleSavePantryIngredients = (newIds: string[]) => {
    setPantryIngredients(newIds);
    savePantryIngredients(newIds);
    if (newIds.length > 0) {
      const updatedRecent = Array.from(new Set([...newIds, ...recentIngredients])).slice(0, 16);
      setRecentIngredients(updatedRecent);
      saveRecentIngredients(updatedRecent);
    }
  };

  const handleToggleClearFridgeMode = (enabled: boolean) => {
    setClearFridgeMode(enabled);
    saveClearFridgeMode(enabled);
    showToast(enabled ? '已开启清冰箱模式：尽量多用现有食材' : '已关闭清冰箱模式');
  };

  const handlePantrySubmitAndRecommend = () => {
    setIsPantrySelectorOpen(false);
    handleDecideMeal();
    showToast(
      pantryIngredients.length > 0
        ? `已结合家里的 ${pantryIngredients.length} 样食材推荐`
        : '已为你智能推荐美味一餐'
    );
  };

  const handleAddMissingToGrocery = (items: { name: string; amount: number; unit: string; category?: string }[]) => {
    const existing = loadCustomGroceryItems();
    const newItems: SavedGroceryItem[] = items.map(i => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      category: i.category || '其他',
      addedAt: Date.now(),
    }));
    saveCustomGroceryItems([...existing, ...newItems]);
    showToast(`已将 ${items.length} 样还缺食材加入采购清单`);
  };

  // Computed Nutrition (Retained for backend recommendation algorithm, not visual focus)
  const macroTargets = useMemo(() => calculateMacroTargets(userProfile), [userProfile]);
  const currentIntake = useMemo(() => calculateCurrentIntake(dailyLog), [dailyLog]);
  const remainingMacros = useMemo(
    () => calculateRemainingMacros(macroTargets, currentIntake),
    [macroTargets, currentIntake]
  );

  // Derive recently cooked recipe IDs to prevent repetitive recommendations
  const historyRecipeNames = useMemo(() => {
    return dailyLog.records.flatMap((rec) => rec.dishes.map((d) => d.name));
  }, [dailyLog.records]);

  const historyRecipeIds = useMemo(() => {
    return RECIPES.filter((r) => historyRecipeNames.includes(r.name)).map((r) => r.id);
  }, [historyRecipeNames]);

  // ==========================================
  // [入口 A: 帮我选一顿] Core Handlers
  // ==========================================
  const handleDecideMeal = () => {
    setIsShufflingMeal(true);
    const combo = generateMealRecommendation({
      remainingMacros,
      userProfile,
      activeFilters: selectedFilters,
      historyRecipeIds,
      pantryIngredientIds: pantryIngredients,
      clearFridgeMode,
      favoriteRecipeIds,
      cookingFeedbacks: loadCookingFeedbacks(),
      recommendationFeedbacks: loadRecommendationFeedbacks(),
      temporaryPreferences,
      servings: userProfile.defaultServings || 1,
    });

    setRecommendedCombo(combo);
    setIsRecommendationOpen(true);

    setTimeout(() => {
      setIsShufflingMeal(false);
    }, 180);
  };

  const handleRerollMeal = () => {
    setIsShufflingMeal(true);
    setTimeout(() => {
      const nextCombo = generateMealRecommendation({
        remainingMacros,
        userProfile,
        activeFilters: selectedFilters,
        historyRecipeIds,
        pantryIngredientIds: pantryIngredients,
        clearFridgeMode,
        favoriteRecipeIds,
        cookingFeedbacks: loadCookingFeedbacks(),
        recommendationFeedbacks: loadRecommendationFeedbacks(),
        temporaryPreferences,
        servings: userProfile.defaultServings || 1,
      });
      setRecommendedCombo(nextCombo);
      setIsShufflingMeal(false);
    }, 200);
  };

  // Select a curated combo directly from Today Inspiration
  const handleSelectCuratedCombo = (combo: MealCombo) => {
    setRecommendedCombo(combo);
    setIsRecommendationOpen(true);
  };

  // Enter cooking mode for a meal combo
  const handleStartCookingCombo = (combo: MealCombo) => {
    setIsRecommendationOpen(false);
    setActiveCookingRecipe(null);
    setActiveCookingCombo(combo);
  };

  // ==========================================
  // [入口 B: 帮我安排一天] Core Handlers
  // ==========================================
  const handleDecideDay = () => {
    const newPlan = generateDayMealPlan(userProfile, pantryIngredients, clearFridgeMode, selectedFilters);
    setDayPlan(newPlan);
    setIsDayPlanOpen(true);
  };

  // Reroll ONLY a single meal without regenerating the whole day (Rule III)
  const handleRerollSingleMeal = (mealType: MealType) => {
    if (!dayPlan) return;
    setRerollingMealType(mealType);

    setTimeout(() => {
      // Gather existing recipe IDs to avoid duplicate dishes across meals
      const otherRecipeIds: string[] = [];
      if (mealType !== 'breakfast') {
        otherRecipeIds.push(...dayPlan.breakfast.recipes.map(r => r.id));
      }
      if (mealType !== 'lunch') {
        otherRecipeIds.push(...dayPlan.lunch.recipes.map(r => r.id));
      }
      if (mealType !== 'dinner') {
        otherRecipeIds.push(...dayPlan.dinner.recipes.map(r => r.id));
      }

      const newSlot = generateMealSlot(
        mealType,
        userProfile,
        otherRecipeIds,
        undefined,
        pantryIngredients,
        clearFridgeMode,
        selectedFilters
      );

      const updatedPlan: DayMealPlan = {
        ...dayPlan,
        [mealType]: newSlot,
      };

      // Recalculate totals
      updatedPlan.totalCalories = updatedPlan.breakfast.calories + updatedPlan.lunch.calories + updatedPlan.dinner.calories;
      updatedPlan.totalProtein = Math.round((updatedPlan.breakfast.protein + updatedPlan.lunch.protein + updatedPlan.dinner.protein) * 10) / 10;
      updatedPlan.totalCarbs = Math.round((updatedPlan.breakfast.carbs + updatedPlan.lunch.carbs + updatedPlan.dinner.carbs) * 10) / 10;
      updatedPlan.totalFat = Math.round((updatedPlan.breakfast.fat + updatedPlan.lunch.fat + updatedPlan.dinner.fat) * 10) / 10;

      setDayPlan(updatedPlan);
      setRerollingMealType(null);
      showToast(`已更换${newSlot.label}搭配`);
    }, 220);
  };

  // Confirm day plan ("就按这个吃")
  const handleAcceptDayPlan = () => {
    showToast('已锁定今日三餐方案！采购清单已就绪');
  };

  // Cooking a single meal slot from the Day Plan
  const handleStartCookingDaySlot = (slot: DayMealSlot) => {
    setIsDayPlanOpen(false);
    setActiveCookingRecipe(null);

    // Convert slot to standard MealCombo for CookingModeView
    const comboFromSlot: MealCombo = {
      id: `slot_${slot.type}_${Date.now()}`,
      comboTitle: `${slot.label} · ${slot.title}`,
      motto: slot.title,
      recipes: slot.recipes,
      totalCalories: slot.calories,
      totalProtein: slot.protein,
      totalCarbs: slot.carbs,
      totalFat: slot.fat,
      estimatedTimeMinutes: slot.timeMinutes,
      ingredientCount: slot.recipes.flatMap(r => r.ingredients).length,
      difficulty: slot.difficulty || '小白友好',
      servingSize: '1人食刚刚好',
      tags: slot.tags,
      recommendationReason: `今日精选${slot.label}，食材快熟易烹饪。`,
    };

    setActiveCookingCombo(comboFromSlot);
  };

  // ==========================================
  // Cooking Engine & History Logging
  // ==========================================
  const handleStartCookingSingleRecipe = (recipe: Recipe) => {
    setDetailRecipe(null);
    setActiveCookingCombo(null);
    setActiveCookingRecipe(recipe);
  };

  const handleFinishCooking = (title: string, recipes: Recipe[], mealType: MealType) => {
    const timeNow = new Date();
    const timeString = `${String(timeNow.getHours()).padStart(2, '0')}:${String(timeNow.getMinutes()).padStart(2, '0')}`;

    const totalCal = recipes.reduce((sum, r) => sum + r.calories, 0);
    const totalProt = recipes.reduce((sum, r) => sum + r.protein, 0);
    const totalCarb = recipes.reduce((sum, r) => sum + r.carbs, 0);
    const totalF = recipes.reduce((sum, r) => sum + r.fat, 0);

    const newRecord: MealRecord = {
      id: `rec_${Date.now()}`,
      mealType,
      title: title.startsWith('自制') ? title : `自制 · ${title}`,
      calories: totalCal,
      protein: totalProt,
      carbs: totalCarb,
      fat: totalF,
      timeString,
      dishes: recipes.map((r) => ({
        name: r.name,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
      })),
    };

    updateDailyLog({
      ...dailyLog,
      records: [...dailyLog.records, newRecord],
    });

    setActiveCookingCombo(null);
    setActiveCookingRecipe(null);
    setCurrentTab('home');
    showToast(`🎉 恭喜做出一顿美味！已记录到美味足迹`);
  };

  const handleCookAgain = (dishName: string) => {
    const cleanName = dishName.replace('自制 · ', '');
    const matched = RECIPES.find((r) => r.name.includes(cleanName) || cleanName.includes(r.name));
    if (matched) {
      setActiveCookingRecipe(matched);
      setActiveCookingCombo(null);
    } else {
      handleDecideMeal();
    }
  };

  const handleDeleteRecord = (id: string) => {
    updateDailyLog({
      ...dailyLog,
      records: dailyLog.records.filter((r) => r.id !== id),
    });
    showToast('已移除该条做饭记录');
  };

  if (isQAView) {
    return (
      <QAReportView
        onBackToHome={() => {
          try {
            window.history.pushState(null, '', '/');
          } catch {
            // ignore
          }
          setIsQAView(false);
        }}
      />
    );
  }

  if (isDebugView) {
    return (
      <RecipeDebugPage
        onBackToHome={() => {
          try {
            window.history.pushState(null, '', '/');
          } catch {
            // ignore
          }
          setIsDebugView(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EDE6] text-stone-900 flex justify-center font-sans antialiased">
      {/* Mobile Shell Container */}
      <main className="w-full max-w-md min-h-screen bg-[#FAF7F2] relative flex flex-col shadow-xl shadow-stone-300/40">
        {/* Sticky Header */}
        <Header
          userProfile={userProfile}
          onOpenProfile={() => setCurrentTab('profile')}
        />

        {/* Tab Pages */}
        <div className="flex-1 px-4 py-3.5 overflow-y-auto">
          {currentTab === 'home' && (
            <div className="space-y-4 pb-20">
              {/* ============================================================ */}
              {/* 1. First Visual Focus: "今天吃什么？" + 两个并列大入口卡片 + “我家有食材”次级入口 */}
              {/* ============================================================ */}
              <HomeHeroDecision
                selectedFilters={selectedFilters}
                onToggleFilter={handleToggleFilter}
                onDecideMeal={handleDecideMeal}
                onDecideDay={handleDecideDay}
                isLoadingMeal={isShufflingMeal}
                onOpenPantry={() => setIsPantrySelectorOpen(true)}
                pantryIngredientIds={pantryIngredients}
                clearFridgeMode={clearFridgeMode}
              />

              {/* ============================================================ */}
              {/* 2. Today's Inspiration: "今天推荐 · 精选整餐灵感" */}
              {/* ============================================================ */}
              <TodayInspiration
                onSelectRecipe={(recipe) => setDetailRecipe(recipe)}
                onSelectPredefinedCombo={handleSelectCuratedCombo}
              />

              {/* ============================================================ */}
              {/* 3. Recent Cooked: "最近做过 · 美味足迹" */}
              {/* ============================================================ */}
              <RecentCookedSection
                records={dailyLog.records}
                onCookAgain={handleCookAgain}
                onDeleteRecord={handleDeleteRecord}
                onExploreLibrary={() => setCurrentTab('library')}
              />

              {/* Discreet subtle note: low-key background nutrition reassurance */}
              <div className="py-2.5 px-3 rounded-xl bg-stone-100/60 border border-stone-200/50 text-center">
                <p className="text-[11px] text-stone-400">
                  后台已结合科学营养目标自动控油少盐，专注享受下厨乐趣
                </p>
              </div>
            </div>
          )}

          {currentTab === 'library' && (
            <RecipeLibraryView
              onSelectRecipe={(recipe) => setDetailRecipe(recipe)}
              favoriteRecipeIds={favoriteRecipeIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              initialProfile={userProfile}
              onSaveProfile={handleSaveProfile}
              onBackToHome={() => setCurrentTab('home')}
            />
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onQuickDecide={handleDecideMeal}
        />

        {/* Modal: [我家有食材] Pantry Ingredient Selector Modal */}
        <PantrySelectorModal
          isOpen={isPantrySelectorOpen}
          onClose={() => setIsPantrySelectorOpen(false)}
          selectedIds={pantryIngredients}
          onChangeSelectedIds={handleSavePantryIngredients}
          recentIds={recentIngredients}
          clearFridgeMode={clearFridgeMode}
          onToggleClearFridgeMode={handleToggleClearFridgeMode}
          onSubmitAndRecommend={handlePantrySubmitAndRecommend}
        />

        {/* Modal: [入口 A: 帮我选一顿] Recommendation Result (Full meal set prioritized) */}
        <RecommendationModal
          combo={recommendedCombo}
          isOpen={isRecommendationOpen}
          onClose={() => setIsRecommendationOpen(false)}
          onReroll={handleRerollMeal}
          onSelectRecipe={(recipe) => setDetailRecipe(recipe)}
          onStartCookingCombo={handleStartCookingCombo}
          onSelectCombo={setRecommendedCombo}
          isShuffling={isShufflingMeal}
          userProfile={userProfile}
          remainingMacros={remainingMacros}
          activeFilters={selectedFilters}
          historyRecipeIds={historyRecipeIds}
          pantryIngredientIds={pantryIngredients}
          clearFridgeMode={clearFridgeMode}
          onOpenPantry={() => {
            setIsRecommendationOpen(false);
            setIsPantrySelectorOpen(true);
          }}
          onAddMissingToGrocery={handleAddMissingToGrocery}
          favoriteRecipeIds={favoriteRecipeIds}
          onToggleFavorite={handleToggleFavorite}
          onFeedbackSkip={handleFeedbackSkip}
        />

        {/* Modal: [入口 B: 帮我安排一天] Day Meal Plan Modal with Single Meal Reroll & Merged Grocery List */}
        <DayPlanModal
          plan={dayPlan}
          isOpen={isDayPlanOpen}
          onClose={() => setIsDayPlanOpen(false)}
          onRerollSingleMeal={handleRerollSingleMeal}
          onSelectRecipe={(recipe) => setDetailRecipe(recipe)}
          onStartCookingMeal={handleStartCookingDaySlot}
          onAcceptPlan={handleAcceptDayPlan}
          isRerollingMealType={rerollingMealType}
          defaultServings={userProfile.defaultServings || 1}
          favoriteRecipeIds={favoriteRecipeIds}
          onToggleFavorite={handleToggleFavorite}
          pantryIngredientIds={pantryIngredients}
          clearFridgeMode={clearFridgeMode}
        />

        {/* Modal: Recipe Details (Priority: What to eat -> What to buy -> How to cook -> Nutrition) */}
        <RecipeDetailModal
          recipe={detailRecipe}
          isOpen={!!detailRecipe}
          onClose={() => setDetailRecipe(null)}
          onStartCooking={(recipe) => handleStartCookingSingleRecipe(recipe)}
          isFavorited={detailRecipe ? favoriteRecipeIds.includes(detailRecipe.id) : false}
          onToggleFavorite={handleToggleFavorite}
          defaultServings={userProfile.defaultServings || 1}
        />

        {/* Fullscreen View: Interactive 4-Phase Step-by-Step Novice Cooking Mode */}
        {(activeCookingCombo || activeCookingRecipe) && (
          <CookingModeView
            combo={activeCookingCombo || undefined}
            recipe={activeCookingRecipe || undefined}
            onClose={() => {
              setActiveCookingCombo(null);
              setActiveCookingRecipe(null);
            }}
            onFinishCooking={handleFinishCooking}
          />
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
}
