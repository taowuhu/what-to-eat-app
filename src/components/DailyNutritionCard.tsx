import React from 'react';
import { MacroNutrients } from '../types';

interface DailyNutritionCardProps {
  current: MacroNutrients;
  target: MacroNutrients;
  remaining: MacroNutrients;
}

export const DailyNutritionCard: React.FC<DailyNutritionCardProps> = ({
  current,
  target,
  remaining,
}) => {
  const caloriePercent = Math.min(100, Math.round((current.calories / Math.max(1, target.calories)) * 100));
  const proteinPercent = Math.min(100, Math.round((current.protein / Math.max(1, target.protein)) * 100));
  const carbsPercent = Math.min(100, Math.round((current.carbs / Math.max(1, target.carbs)) * 100));
  const fatPercent = Math.min(100, Math.round((current.fat / Math.max(1, target.fat)) * 100));

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs relative overflow-hidden">
      {/* Top Banner with Calories */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-stone-500">今日能量摄入</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl font-extrabold tracking-tight text-stone-900 font-mono">
              {current.calories}
            </span>
            <span className="text-xs text-stone-400 font-medium">/ {target.calories} kcal</span>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-orange-700 text-xs font-semibold">
            <span>余 {remaining.calories} kcal</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">剩余额度供搭配</p>
        </div>
      </div>

      {/* Main Calories Bar */}
      <div className="mt-3 w-full bg-stone-100 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-orange-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${caloriePercent}%` }}
        />
      </div>

      {/* Macro Breakdown 3-Columns (Protein, Carbs, Fat) */}
      <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2">
        {/* Protein */}
        <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-600">蛋白质</span>
            <span className="text-[10px] font-semibold text-orange-600">
              余{remaining.protein}g
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-stone-800 font-mono">{current.protein}</span>
            <span className="text-[10px] text-stone-400">/{target.protein}g</span>
          </div>
          <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-600">碳水化合物</span>
            <span className="text-[10px] font-semibold text-amber-600">
              余{remaining.carbs}g
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-stone-800 font-mono">{current.carbs}</span>
            <span className="text-[10px] text-stone-400">/{target.carbs}g</span>
          </div>
          <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${carbsPercent}%` }}
            />
          </div>
        </div>

        {/* Fat */}
        <div className="bg-[#FAF7F2] rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-600">脂肪</span>
            <span className="text-[10px] font-semibold text-stone-500">
              余{remaining.fat}g
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-base font-bold text-stone-800 font-mono">{current.fat}</span>
            <span className="text-[10px] text-stone-400">/{target.fat}g</span>
          </div>
          <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-stone-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
