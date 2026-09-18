import React from 'react';
import { Sparkles, ArrowRight, Clock, ChefHat, User } from 'lucide-react';
import { Recipe, MealCombo } from '../types';
import { RECIPES } from '../data/recipes';

interface TodayInspirationProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onSelectPredefinedCombo: (combo: MealCombo) => void;
}

export const TodayInspiration: React.FC<TodayInspirationProps> = ({
  onSelectPredefinedCombo,
}) => {
  // Classic homestyle beef meal combo
  const beefRecipe = RECIPES.find((r) => r.id === 'r_black_pepper_beef') || RECIPES[0];
  const broccoliRecipe = RECIPES.find((r) => r.id === 'r_garlic_broccoli') || RECIPES[1];
  const riceRecipe = RECIPES.find((r) => r.id === 'r_steamed_rice') || RECIPES.find((r) => r.id === 'r_grain_rice') || RECIPES[2];

  const classicCombo: MealCombo = {
    id: 'curated_beef_meal',
    comboTitle: '经典家常牛肉餐',
    motto: '黑椒牛肉 · 蒜蓉西兰花 · 米饭',
    recipes: [beefRecipe, broccoliRecipe, riceRecipe],
    totalCalories: beefRecipe.calories + broccoliRecipe.calories + riceRecipe.calories,
    totalProtein: beefRecipe.protein + broccoliRecipe.protein + riceRecipe.protein,
    totalCarbs: beefRecipe.carbs + broccoliRecipe.carbs + riceRecipe.carbs,
    totalFat: beefRecipe.fat + broccoliRecipe.fat + riceRecipe.fat,
    estimatedTimeMinutes: 25,
    ingredientCount: 7,
    difficulty: '小白友好',
    servingSize: '1人份',
    tags: ['经典家常', '少油快手', '有荤有素'],
    recommendationReason: '鲜嫩牛肉与爽脆西兰花现炒出锅，搭配热腾腾的米饭，25分钟轻松做出一顿营养有滋味的热乎饭。',
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>今日推荐</span>
        </h3>
        <span className="text-[11px] text-stone-400">家常完整一餐</span>
      </div>

      {/* Appetizing lifestyle card with tasteful, non-intrusive complete meal photo */}
      <div
        onClick={() => onSelectPredefinedCombo(classicCombo)}
        className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-xs hover:border-orange-200 hover:shadow-sm transition cursor-pointer group"
      >
        {/* Appealing food photo banner */}
        <div className="relative h-44 w-full overflow-hidden bg-stone-100">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80"
            alt="经典家常牛肉餐"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-900/20 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <span className="bg-white/95 text-stone-800 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs border border-white/50 backdrop-blur-xs">
              今日精选餐食
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h4 className="text-lg font-black tracking-tight drop-shadow-xs">
              经典家常牛肉餐
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-stone-200 mt-0.5 font-medium drop-shadow-xs">
              <span>黑椒牛肉</span>
              <span>·</span>
              <span>蒜蓉西兰花</span>
              <span>·</span>
              <span>米饭</span>
            </div>
          </div>
        </div>

        {/* Card info & action bar */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="flex items-center gap-1 font-medium text-stone-700">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              25分钟
            </span>
            <span className="text-stone-300">·</span>
            <span className="flex items-center gap-1 font-medium text-stone-700">
              <User className="w-3.5 h-3.5 text-stone-400" />
              1人份
            </span>
            <span className="text-stone-300">·</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
              小白友好
            </span>
          </div>

          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200/70 transition flex items-center gap-1 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 active:scale-95"
          >
            <span>看看怎么做</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
