import React, { useState, useMemo } from 'react';
import { X, ChefHat, Sparkles, ArrowRight, ShoppingCart, Star } from 'lucide-react';
import { Recipe } from '../types';
import { scaleRecipeForServings } from '../utils/servingsScaler';
import { ServingsSegment } from './ServingsSegment';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onStartCooking: (recipe: Recipe) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
  defaultServings?: number;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
  onStartCooking,
  isFavorited = false,
  onToggleFavorite,
  defaultServings = 1,
}) => {
  const [servings, setServings] = useState<number>(defaultServings);

  // Sync default servings whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setServings(defaultServings);
    }
  }, [isOpen, defaultServings]);

  const scaledRecipe = useMemo(() => {
    if (!recipe) return null;
    return scaleRecipeForServings(recipe, servings);
  }, [recipe, servings]);

  if (!isOpen || !recipe || !scaledRecipe) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF7F2] w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border border-stone-200">
        {/* ============================================================ */}
        {/* 第一优先：吃什么 (大图、菜名、特色与难度/用时标签) */}
        {/* ============================================================ */}
        <div className="relative h-48 sm:h-52 w-full bg-stone-900 shrink-0">
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Action buttons top-right: Favorite + Close */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {onToggleFavorite && (
              <button
                id="btn-toggle-favorite-recipe"
                type="button"
                onClick={() => onToggleFavorite(recipe.id)}
                className={`h-8 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-md transition text-xs font-bold ${
                  isFavorited
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'bg-black/40 hover:bg-black/60 text-white'
                }`}
                title={isFavorited ? '已收藏此菜谱' : '收藏菜谱'}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavorited ? 'fill-stone-950 text-stone-950' : 'text-white'
                  }`}
                />
                <span>{isFavorited ? '已收藏' : '收藏'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {recipe.difficulty}
              </span>
              {recipe.equipment?.some(eq => eq.includes('rice-cooker') || eq.includes('电饭煲')) && (
                <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  电饭煲一锅出
                </span>
              )}
              {recipe.handsOff && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  免看火
                </span>
              )}
              {recipe.onePot && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  少洗锅
                </span>
              )}
              {servings > 1 && (
                <span className="bg-amber-500/90 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  已按 {servings}人份 换算
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight drop-shadow-sm">
              {recipe.name}
            </h2>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1">
          {/* 耗时与锅具透明卡片 (V0.4.6: 诚实区分动手 vs 等待) */}
          <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/60">
                <span className="text-[10px] text-stone-400 block mb-0.5">动手切配</span>
                <span className="text-xs font-black text-orange-700">
                  {recipe.activeTimeMinutes || 6} 分钟
                </span>
              </div>
              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/60">
                <span className="text-[10px] text-stone-400 block mb-0.5">等待焖煮</span>
                <span className="text-xs font-bold text-stone-700">
                  {recipe.passiveTimeMinutes || Math.max(10, recipe.cookTimeMinutes)} 分钟
                </span>
              </div>
              <div className="bg-[#FAF7F2] py-2 px-1 rounded-xl border border-stone-200/60">
                <span className="text-[10px] text-stone-400 block mb-0.5">需要锅具</span>
                <span className="text-xs font-bold text-stone-800">
                  {recipe.equipment?.some(eq => eq.includes('rice-cooker') || eq.includes('电饭煲')) ? '电饭煲 (1个)' : `${recipe.cookwareCount || 1}个锅`}
                </span>
              </div>
            </div>
          </div>

          {/* 第一优先续：菜品风味特色与介绍 */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>菜品特色与风味</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              {recipe.summary}
            </p>
          </div>

          {/* 人数份量选择器 (V0.4 新增) */}
          <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs">
            <ServingsSegment
              value={servings}
              onChange={setServings}
            />
          </div>

          {/* ============================================================ */}
          {/* 第二优先：需要买什么 (食材与参考克数清单，已按份量缩放) */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-stone-900">
                  需要买什么 / 食材清单 ({servings}人份)
                </h3>
              </div>
              <span className="text-[11px] text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                {servings > 1 ? `${servings}人量用量估算` : '新手用量参考'}
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {scaledRecipe.ingredients.map((ing, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <span className="font-semibold text-stone-800">{ing.name}</span>
                    {ing.category === '调料辅料' && (
                      <span className="text-[10px] text-stone-400 font-normal">调料</span>
                    )}
                    {ing.notes && (
                      <span className="text-[10px] text-stone-400">({ing.notes})</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-stone-900 bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-stone-200/70">
                    {ing.amount} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 第三优先：怎么做 (分步做饭预览与关键避坑要点) */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-3">
              <ChefHat className="w-4 h-4 text-orange-600" />
              <h3 className="text-xs font-bold text-stone-900">怎么做 · 步骤指引 ({scaledRecipe.steps.length} 步)</h3>
            </div>

            <div className="space-y-3">
              {scaledRecipe.steps.map((step) => (
                <div key={step.stepNumber} className="flex gap-2.5 text-xs bg-[#FAF7F2] p-3 rounded-xl border border-stone-200/60">
                  <div className="w-6 h-6 rounded-lg bg-orange-600 text-white font-black flex items-center justify-center shrink-0 text-xs shadow-2xs">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-900 text-xs">{step.title}</h4>
                    <p className="text-stone-700 text-xs mt-1 leading-relaxed font-medium">
                      {step.action}
                    </p>
                    <div className="mt-2 bg-emerald-50 border border-emerald-200/70 px-2 py-1 rounded-md text-[11px] text-emerald-800 font-medium">
                      👀 应该看到：{step.visualCue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 第四优先：大概营养情况 (次要位置、轻量简明的参考卡片) */}
          {/* ============================================================ */}
          <div className="bg-white/80 rounded-2xl p-3 border border-stone-200/70 text-xs">
            <span className="text-[11px] font-semibold text-stone-500 block mb-1.5">
              总计营养参考（{servings}人份）：
            </span>
            <div className="flex items-center justify-between text-stone-700 bg-[#FAF7F2] px-3 py-2 rounded-xl border border-stone-200/50">
              <span className="font-mono font-bold text-stone-900">约 {scaledRecipe.calories} kcal</span>
              <span className="text-stone-400">·</span>
              <span>蛋白质 {scaledRecipe.protein}g</span>
              <span className="text-stone-400">·</span>
              <span>碳水 {scaledRecipe.carbs}g</span>
              <span className="text-stone-400">·</span>
              <span>少油低盐</span>
            </div>
          </div>
        </div>

        {/* Start Cooking Button */}
        <div className="p-4 bg-white border-t border-stone-200/80 shrink-0">
          <button
            id="btn-start-cooking-modal"
            onClick={() => {
              onStartCooking(scaledRecipe);
              onClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-600/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <ChefHat className="w-5 h-5" />
            <span>进入做饭模式（一步一步教我做）</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
