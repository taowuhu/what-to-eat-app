import React, { useMemo } from 'react';
import { Utensils, CalendarDays, ArrowRight, Refrigerator, ChevronRight } from 'lucide-react';
import { QuickFilterId } from '../types';
import { QuickFilterBar } from './QuickFilterBar';
import { CANONICAL_ID_MAP } from '../data/canonicalIngredients';

interface HomeHeroDecisionProps {
  selectedFilters: QuickFilterId[];
  onToggleFilter: (filter: QuickFilterId) => void;
  onDecideMeal: () => void;
  onDecideDay: () => void;
  isLoadingMeal?: boolean;
  onOpenPantry?: () => void;
  pantryIngredientIds?: string[];
  clearFridgeMode?: boolean;
}

export const HomeHeroDecision: React.FC<HomeHeroDecisionProps> = ({
  selectedFilters,
  onToggleFilter,
  onDecideMeal,
  onDecideDay,
  isLoadingMeal = false,
  onOpenPantry,
  pantryIngredientIds = [],
  clearFridgeMode = false,
}) => {
  const pantrySummaryText = useMemo(() => {
    if (pantryIngredientIds.length === 0) {
      return '选厨房现有食材 · 优先用掉不浪费';
    }
    const names = pantryIngredientIds
      .map(id => CANONICAL_ID_MAP.get(id)?.name)
      .filter(Boolean);
    return `包含：${names.slice(0, 4).join('、')}${names.length > 4 ? ` 等${names.length}样` : ''}`;
  }, [pantryIngredientIds]);

  const timeGreeting = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // 06:00 - 09:30
    if (totalMinutes >= 360 && totalMinutes < 570) {
      return {
        greeting: '早上好，今天吃什么？',
        subtitle: '今天早晨来顿快手热乎饭 · 唤醒满满元气',
      };
    }
    // 09:30 - 13:30
    if (totalMinutes >= 570 && totalMinutes < 810) {
      return {
        greeting: '中午吃什么？',
        subtitle: '荤素搭配营养充足 · 下午工作不犯困',
      };
    }
    // 13:30 - 16:30
    if (totalMinutes >= 810 && totalMinutes < 990) {
      return {
        greeting: '下午好，今天吃什么？',
        subtitle: '提前看看今晚吃什么 · 顺手买菜不纠结',
      };
    }
    // 16:30 - 20:30 (e.g. 18:30 dinner decision)
    if (totalMinutes >= 990 && totalMinutes < 1230) {
      return {
        greeting: '今晚吃什么？',
        subtitle: '下班犒劳自己一顿家常美味 · 踏实又暖胃',
      };
    }
    // 20:30 - 06:00
    return {
      greeting: '夜深了，来点清淡热食？',
      subtitle: '来碗清淡少油的热汤或面食 · 温暖不积食',
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs relative overflow-hidden">
      {/* 1. Header: 按时段智能文案与问候 (V0.4 细节打磨) */}
      <div className="mb-3.5">
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          {timeGreeting.greeting}
        </h2>
        <p className="text-xs text-stone-500 mt-1 font-medium">
          {timeGreeting.subtitle}
        </p>
      </div>

      {/* 2. Multi-select Filter Chips */}
      <div className="mb-2.5">
        <QuickFilterBar
          selectedFilters={selectedFilters}
          onToggleFilter={onToggleFilter}
        />
      </div>

      {/* 次级入口: “我家有食材” (在现有条件附近，不新增大型主卡片) */}
      {onOpenPantry && (
        <div className="mb-4">
          <button
            id="btn-hero-open-pantry"
            type="button"
            onClick={onOpenPantry}
            className={`w-full py-2 px-3 rounded-2xl border transition-all flex items-center justify-between group active:scale-[0.99] ${
              pantryIngredientIds.length > 0
                ? 'bg-amber-50/70 border-amber-200/90 text-amber-950 shadow-2xs'
                : 'bg-[#FAF7F2] hover:bg-stone-100/90 border-stone-200/80 text-stone-700'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  pantryIngredientIds.length > 0
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white text-stone-500 border border-stone-200/70'
                }`}
              >
                <Refrigerator className="w-3.5 h-3.5" />
              </div>

              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">我家有食材</span>
                  {clearFridgeMode && (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100/80 px-1.5 py-0.2 rounded border border-orange-200/50">
                      清冰箱
                    </span>
                  )}
                  {pantryIngredientIds.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded">
                      已选 {pantryIngredientIds.length} 样
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-400 truncate">
                  {pantrySummaryText}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 group-hover:text-stone-800 shrink-0 pl-2">
              <span>{pantryIngredientIds.length > 0 ? '调整' : '去挑选'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700" />
            </div>
          </button>
        </div>
      )}

      {/* 3. Redesigned Two Core Entrances (Warm, balanced, not two overwhelming orange banners) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 入口 A: 帮我选一顿 - 主视觉 CTA, 采用清爽温润暖橙 */}
        <button
          id="btn-hero-decide-meal"
          type="button"
          onClick={onDecideMeal}
          disabled={isLoadingMeal}
          className="text-left p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20 hover:shadow-md active:scale-[0.98] transition-all flex flex-col justify-between group border border-orange-400/30 min-h-[148px]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                <Utensils className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-medium bg-black/10 text-white/95 px-2 py-0.5 rounded-full">
                即选即做
              </span>
            </div>

            <h3 className="text-base font-black text-white tracking-tight">
              帮我选一顿
            </h3>
            <p className="text-xs text-white/90 mt-1 font-medium">
              现在就解决这一餐
            </p>
            <p className="text-[11px] text-white/75 mt-0.5">
              适合临时决定早餐、午餐或晚餐
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-white/95 font-semibold">
            <span>主菜 + 时蔬 + 主食</span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3 h-3 text-white" />
            </div>
          </div>
        </button>

        {/* 入口 B: 帮我安排一天 - 暖米白/浅橙背景 + 橙色图标和描边 */}
        <button
          id="btn-hero-decide-day"
          type="button"
          onClick={onDecideDay}
          className="text-left p-4 rounded-2xl bg-[#FFF9F3] hover:bg-[#FFF4E8] text-stone-800 border border-orange-200/90 shadow-2xs hover:shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between group min-h-[148px]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center border border-orange-200/50">
                <CalendarDays className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-orange-700 bg-orange-100/60 px-2 py-0.5 rounded-full border border-orange-200/60">
                全天省心
              </span>
            </div>

            <h3 className="text-base font-black text-stone-900 tracking-tight group-hover:text-orange-600 transition">
              帮我安排一天
            </h3>
            <p className="text-xs text-stone-600 mt-1 font-medium">
              早餐 · 午餐 · 晚餐
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              一次决定今天怎么吃
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-orange-100 flex items-center justify-between text-xs text-stone-600 font-semibold">
            <span className="text-stone-500">自动合并采购清单</span>
            <div className="w-5 h-5 rounded-full bg-orange-100/70 text-orange-600 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-3 h-3 text-orange-600" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
