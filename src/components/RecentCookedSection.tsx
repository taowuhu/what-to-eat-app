import React from 'react';
import { ChefHat, Clock, RotateCcw, Trash2, CheckCircle2, Utensils } from 'lucide-react';
import { MealRecord, Recipe } from '../types';
import { RECIPES } from '../data/recipes';

interface RecentCookedSectionProps {
  records: MealRecord[];
  onCookAgain: (recipeName: string) => void;
  onDeleteRecord: (id: string) => void;
  onExploreLibrary: () => void;
}

export const RecentCookedSection: React.FC<RecentCookedSectionProps> = ({
  records,
  onCookAgain,
  onDeleteRecord,
  onExploreLibrary,
}) => {
  // Sort by latest first
  const displayRecords = [...records].reverse().slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Utensils className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-stone-900">最近做过 · 美味足迹</h3>
        </div>
        {displayRecords.length > 0 && (
          <span className="text-[11px] text-stone-400">已做过 {records.length} 次</span>
        )}
      </div>

      {displayRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 text-center border border-stone-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 mx-auto flex items-center justify-center mb-2">
            <ChefHat className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-stone-700">暂无做饭记录</p>
          <p className="text-[11px] text-stone-400 mt-0.5">
            点击上方【帮我选一顿】或浏览菜谱库，开始下厨吧
          </p>
          <button
            onClick={onExploreLibrary}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 px-3 py-1.5 rounded-full transition"
          >
            <span>逛逛新手菜谱库</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayRecords.map((record) => {
            const firstDishName = record.dishes?.[0]?.name || record.title;
            const matchedRecipe = RECIPES.find((r) =>
              r.name.includes(firstDishName.replace('自制 · ', '')) ||
              firstDishName.includes(r.name)
            );

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs flex items-center justify-between group hover:border-orange-200 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {matchedRecipe ? (
                    <img
                      src={matchedRecipe.imageUrl}
                      alt={record.title}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-stone-100"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 font-bold flex items-center justify-center shrink-0 text-sm">
                      🍳
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {record.title}
                      </h4>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                        做好了
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-1">
                      <span>{record.timeString} 烹饪完成</span>
                      {record.dishes && record.dishes.length > 1 && (
                        <span>· {record.dishes.length} 道菜</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => onCookAgain(firstDishName)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 px-2.5 py-1.5 rounded-xl transition active:scale-95 flex items-center gap-1"
                    title="再做一次"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>再做</span>
                  </button>

                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg transition opacity-60 hover:opacity-100"
                    title="删除记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
