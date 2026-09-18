import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Refrigerator,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Flame,
  Layers,
} from 'lucide-react';
import {
  CANONICAL_INGREDIENTS,
  CANONICAL_ID_MAP,
  PantryCategory,
  CanonicalIngredient,
} from '../data/canonicalIngredients';

interface PantrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  recentIds: string[];
  clearFridgeMode: boolean;
  onToggleClearFridgeMode: (enabled: boolean) => void;
  onSubmitAndRecommend: () => void;
}

const CATEGORIES: { key: PantryCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '肉蛋奶', label: '肉蛋奶' },
  { key: '蔬菜', label: '蔬菜' },
  { key: '主食', label: '主食' },
  { key: '豆制品', label: '豆制品' },
  { key: '水产', label: '水产' },
  { key: '其他', label: '其他' },
];

export const PantrySelectorModal: React.FC<PantrySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedIds,
  onChangeSelectedIds,
  recentIds,
  clearFridgeMode,
  onToggleClearFridgeMode,
  onSubmitAndRecommend,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<PantryCategory | 'all'>('all');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Toggle single ingredient selection
  const handleToggle = (id: string) => {
    if (selectedSet.has(id)) {
      onChangeSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      onChangeSelectedIds([...selectedIds, id]);
    }
  };

  const handleClearAll = () => {
    onChangeSelectedIds([]);
  };

  // Filtered ingredients based on category and search query
  const filteredIngredients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return CANONICAL_INGREDIENTS.filter(item => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // Search query filter (matches canonical name or any alias)
      if (!q) return true;
      if (item.name.toLowerCase().includes(q)) return true;
      return item.aliases.some(alias => alias.toLowerCase().includes(q));
    });
  }, [activeCategory, searchTerm]);

  // Derive recent canonical items
  const recentItems = useMemo(() => {
    return recentIds
      .map(id => CANONICAL_ID_MAP.get(id))
      .filter((item): item is CanonicalIngredient => Boolean(item));
  }, [recentIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        id="pantry-selector-sheet"
        className="bg-[#FAF7F2] w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-250 border border-stone-200"
      >
        {/* Top Header */}
        <div className="p-4 bg-white border-b border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
              <Refrigerator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                我家有食材
              </h2>
              <p className="text-[11px] text-stone-500">
                挑选厨房已有食材 · 优先推荐不浪费
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-3.5 flex-1">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索食材（如：番茄/西红柿、鸡蛋、牛肉...）"
              className="w-full pl-9.5 pr-8 py-2.5 bg-white border border-stone-200/90 rounded-2xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 清冰箱模式开关 (低视觉权重选项) */}
          <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2 pr-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <span>优先用掉已有食材</span>
                  <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200/50">
                    清冰箱模式
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  大幅提升已有食材推荐权重，尽量不买新菜
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={clearFridgeMode}
              onClick={() => onToggleClearFridgeMode(!clearFridgeMode)}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                clearFridgeMode ? 'bg-orange-500' : 'bg-stone-200'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  clearFridgeMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 最近使用 (快速点击区域) */}
          {!searchTerm && recentItems.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-stone-400" />
                  <span>常用与最近使用</span>
                </span>
                <span className="text-[10px] text-stone-400">点击快速添加</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {recentItems.map(item => {
                  const isSelected = selectedSet.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs shadow-orange-500/20 font-bold'
                          : 'bg-white text-stone-700 border-stone-200/90 hover:border-orange-200 shadow-2xs'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 分类浏览 Tabs */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    activeCategory === cat.key
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/70'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 食材网格 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1">
              {filteredIngredients.map(item => {
                const isSelected = selectedSet.has(item.id);
                // Highlight alias if matched query
                const matchedAlias = searchTerm
                  ? item.aliases.find(a => a.toLowerCase().includes(searchTerm.trim().toLowerCase()))
                  : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[58px] active:scale-95 ${
                      isSelected
                        ? 'bg-orange-50/90 border-orange-400 text-orange-950 font-bold shadow-2xs'
                        : 'bg-white border-stone-200/80 text-stone-800 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs truncate">{item.name}</span>
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'border border-stone-300 bg-stone-50'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="text-[10px] text-stone-400 truncate mt-1">
                      {matchedAlias ? `别名: ${matchedAlias}` : item.category}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredIngredients.length === 0 && (
              <div className="py-8 text-center text-xs text-stone-400">
                未找到与 “{searchTerm}” 相关的食材，可尝试搜索核心词如“蛋”、“牛”、“番茄”
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="p-4 bg-white border-t border-stone-200/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-800">
                  已选择{' '}
                  <span className="text-orange-600 text-sm font-black font-mono">
                    {selectedIds.length}
                  </span>{' '}
                  种食材
                </span>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] text-stone-400 hover:text-rose-600 transition underline underline-offset-2 ml-1"
                  >
                    清空
                  </button>
                )}
              </div>
              <span className="text-[10px] text-stone-400 truncate max-w-[170px]">
                {selectedIds.length > 0
                  ? selectedIds
                      .map(id => CANONICAL_ID_MAP.get(id)?.name)
                      .filter(Boolean)
                      .join('、')
                  : '未选择时将智能推荐'}
              </span>
            </div>

            <button
              id="btn-pantry-recommend"
              type="button"
              onClick={onSubmitAndRecommend}
              className="py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-sm shadow-orange-500/20 active:scale-98 transition flex items-center justify-center gap-1.5"
            >
              <span>用这些帮我选一顿</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
