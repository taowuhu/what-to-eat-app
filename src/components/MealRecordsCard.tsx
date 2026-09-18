import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, ChevronRight, Utensils } from 'lucide-react';
import { MealRecord, MealType } from '../types';

interface MealRecordsCardProps {
  records: MealRecord[];
  onDeleteRecord: (id: string) => void;
  onQuickAddMeal: (mealType: MealType, title: string, calories: number, protein: number, carbs: number, fat: number) => void;
  onDecideForMeal: (mealType: MealType) => void;
}

export const MealRecordsCard: React.FC<MealRecordsCardProps> = ({
  records,
  onDeleteRecord,
  onQuickAddMeal,
  onDecideForMeal,
}) => {
  const [activeModalMealType, setActiveModalMealType] = useState<MealType | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCalories, setQuickCalories] = useState('450');
  const [quickProtein, setQuickProtein] = useState('25');
  const [quickCarbs, setQuickCarbs] = useState('50');
  const [quickFat, setQuickFat] = useState('15');

  const mealSections: { type: MealType; name: string; timeRange: string; defaultCal: number }[] = [
    { type: 'breakfast', name: '早餐', timeRange: '07:00 - 09:30', defaultCal: 320 },
    { type: 'lunch', name: '午餐', timeRange: '11:30 - 13:30', defaultCal: 600 },
    { type: 'dinner', name: '晚餐', timeRange: '18:00 - 20:30', defaultCal: 550 },
  ];

  const handleOpenAdd = (type: MealType, defaultCal: number) => {
    setActiveModalMealType(type);
    setQuickTitle(type === 'lunch' ? '健康午餐套餐' : type === 'dinner' ? '轻卡晚餐套餐' : '营养快手早餐');
    setQuickCalories(defaultCal.toString());
    setQuickProtein(Math.round(defaultCal * 0.25 / 4).toString());
    setQuickCarbs(Math.round(defaultCal * 0.5 / 4).toString());
    setQuickFat(Math.round(defaultCal * 0.25 / 9).toString());
  };

  const handleSubmitQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalMealType || !quickTitle) return;
    onQuickAddMeal(
      activeModalMealType,
      quickTitle,
      Number(quickCalories) || 400,
      Number(quickProtein) || 20,
      Number(quickCarbs) || 45,
      Number(quickFat) || 12
    );
    setActiveModalMealType(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-stone-600">今日三餐摄入记录</span>
        <span className="text-[11px] text-stone-400">已打卡 {records.length} 餐</span>
      </div>

      <div className="space-y-2">
        {mealSections.map((section) => {
          const matchedRecords = records.filter((r) => r.mealType === section.type);
          const hasRecord = matchedRecords.length > 0;
          const totalSectionCal = matchedRecords.reduce((s, r) => s + r.calories, 0);

          return (
            <div
              key={section.type}
              className="bg-white rounded-xl p-3 border border-stone-200/80 transition-all hover:border-stone-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      hasRecord
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-stone-100 text-stone-400'
                    }`}
                  >
                    {section.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-800">{section.name}</span>
                      {hasRecord ? (
                        <span className="text-xs font-semibold text-orange-600 font-mono">
                          {totalSectionCal} kcal
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400">未记录</span>
                      )}
                    </div>
                  </div>
                </div>

                {!hasRecord ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDecideForMeal(section.type)}
                      className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium px-2.5 py-1 rounded-lg border border-orange-200/70 transition active:scale-95 flex items-center gap-1"
                    >
                      <Utensils className="w-3 h-3" />
                      <span>搭配吃什么</span>
                    </button>
                    <button
                      onClick={() => handleOpenAdd(section.type, section.defaultCal)}
                      className="text-xs text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition"
                      title="手动快速补录"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenAdd(section.type, section.defaultCal)}
                    className="text-xs text-stone-400 hover:text-orange-600 p-1 transition"
                    title="添加更多食物"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Logged item list */}
              {hasRecord && (
                <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-1.5">
                  {matchedRecords.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs bg-stone-50/70 px-2.5 py-1.5 rounded-lg group"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-medium text-stone-800 flex items-center gap-1.5">
                          <span>{r.title}</span>
                          <span className="text-[10px] text-stone-400">{r.timeString}</span>
                        </div>
                        {r.dishes && r.dishes.length > 0 && (
                          <div className="text-[11px] text-stone-500 mt-0.5 flex flex-wrap gap-1">
                            {r.dishes.map((d, i) => (
                              <span key={i} className="bg-white px-1.5 py-0.5 rounded border border-stone-200/60">
                                {d.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          蛋白 {r.protein}g · 碳水 {r.carbs}g · 脂肪 {r.fat}g
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="text-stone-300 hover:text-red-500 p-1 transition opacity-70 group-hover:opacity-100"
                        title="删除记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Quick Add Modal */}
      {activeModalMealType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-5 shadow-xl border border-stone-200 animate-in slide-in-from-bottom duration-200">
            <h3 className="text-base font-bold text-stone-900 mb-3">
              快速补录 · {activeModalMealType === 'breakfast' ? '早餐' : activeModalMealType === 'lunch' ? '午餐' : '晚餐'}
            </h3>

            <form onSubmit={handleSubmitQuickAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  食物 / 餐品名称
                </label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="例如：番茄炒蛋盖饭 / 鸡胸肉沙拉"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    热量 (kcal)
                  </label>
                  <input
                    type="number"
                    required
                    value={quickCalories}
                    onChange={(e) => setQuickCalories(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    蛋白质 (g)
                  </label>
                  <input
                    type="number"
                    value={quickProtein}
                    onChange={(e) => setQuickProtein(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    碳水 (g)
                  </label>
                  <input
                    type="number"
                    value={quickCarbs}
                    onChange={(e) => setQuickCarbs(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    脂肪 (g)
                  </label>
                  <input
                    type="number"
                    value={quickFat}
                    onChange={(e) => setQuickFat(e.target.value)}
                    className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalMealType(null)}
                  className="flex-1 py-2 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-xs"
                >
                  确认记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
