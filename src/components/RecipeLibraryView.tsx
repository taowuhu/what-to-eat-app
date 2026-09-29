import React, { useState, useMemo } from 'react';
import { Search, Clock, Flame, ChefHat, Filter, Sparkles, X, ChevronRight, Utensils, Star } from 'lucide-react';
import { Recipe, RecipeCategory, ProteinSource, RecipeDifficulty } from '../types';
import { ALL_RECIPES, getPublicRecipes } from '../data/recipes';

interface RecipeLibraryViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  favoriteRecipeIds?: string[];
  onToggleFavorite?: (recipeId: string) => void;
}

type LibraryCategory =
  | 'all'
  | 'favorites'
  | 'breakfast'
  | 'chicken'
  | 'beef'
  | 'pork'
  | 'seafood'
  | 'egg_tofu'
  | 'vegetable'
  | 'soup'
  | 'staple';

export const RecipeLibraryView: React.FC<RecipeLibraryViewProps> = ({
  onSelectRecipe,
  favoriteRecipeIds = [],
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory>('all');
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);

  const categories: { id: LibraryCategory; label: string; count?: number }[] = [
    { id: 'all', label: '全部' },
    { id: 'favorites', label: `⭐ 我的收藏 (${favoriteRecipeIds.length})` },
    { id: 'breakfast', label: '早餐' },
    { id: 'chicken', label: '鸡肉' },
    { id: 'beef', label: '牛肉' },
    { id: 'pork', label: '猪肉' },
    { id: 'seafood', label: '鱼虾水产' },
    { id: 'egg_tofu', label: '蛋类豆腐' },
    { id: 'vegetable', label: '时蔬菌菇' },
    { id: 'soup', label: '暖胃靓汤' },
    { id: 'staple', label: '杂粮主食' },
  ];

  const demandTags = [
    { label: '15分钟快手', tag: '15分钟' },
    { label: '一人食', tag: '一人食' },
    { label: '高蛋白', tag: '高蛋白' },
    { label: '小白友好', tag: '小白友好' },
    { label: '低预算', tag: '低预算' },
    { label: '一锅搞定', tag: '一锅' },
  ];

  const toggleDemand = (tag: string) => {
    setSelectedDemands(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const publicRecipes = useMemo(() => getPublicRecipes(), []);

  const filteredRecipes = useMemo(() => {
    return publicRecipes.filter((r) => {
      // 1. Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'favorites') {
          if (!favoriteRecipeIds.includes(r.id)) return false;
        } else if (selectedCategory === 'breakfast') {
          const isBf = r.category === 'breakfast' || r.mealTypes?.includes('breakfast') || r.tags.includes('早餐');
          if (!isBf) return false;
        } else if (selectedCategory === 'chicken') {
          if (r.proteinSource !== 'chicken') return false;
        } else if (selectedCategory === 'beef') {
          if (r.proteinSource !== 'beef') return false;
        } else if (selectedCategory === 'pork') {
          if (r.proteinSource !== 'pork') return false;
        } else if (selectedCategory === 'seafood') {
          if (r.proteinSource !== 'fish' && r.proteinSource !== 'shrimp') return false;
        } else if (selectedCategory === 'egg_tofu') {
          if (r.proteinSource !== 'egg' && r.proteinSource !== 'tofu') return false;
        } else if (selectedCategory === 'vegetable') {
          if (r.category !== 'vegetable' && r.category !== 'side') return false;
        } else if (selectedCategory === 'soup') {
          if (r.category !== 'soup') return false;
        } else if (selectedCategory === 'staple') {
          if (r.category !== 'staple') return false;
        }
      }

      // 2. Demand tags filter
      if (selectedDemands.length > 0) {
        for (const demand of selectedDemands) {
          const hasTag = r.tags.some(t => t.includes(demand));
          const hasDifficulty = demand === '小白友好' && r.difficulty === '小白友好';
          const isQuick = demand === '15分钟' && (r.cookTimeMinutes <= 15 || r.timeMinutes <= 20);
          if (!hasTag && !hasDifficulty && !isQuick) {
            return false;
          }
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesSummary = (r.summary || '').toLowerCase().includes(q);
        const matchesTags = r.tags.some(t => t.toLowerCase().includes(q));
        const matchesIng = r.ingredients.some(i => i.name.toLowerCase().includes(q));
        return matchesName || matchesSummary || matchesTags || matchesIng;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDemands, favoriteRecipeIds]);

  return (
    <div className="space-y-4 pb-20">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">家常菜谱库</h2>
            <p className="text-[11px] text-stone-500">
              收录 {publicRecipes.length} 道中国家庭真实会做常吃的健康菜式
            </p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60">
            精选家常
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索菜名、食材（如：牛肉、鸡胸、西兰花、豆腐、番茄）"
            className="w-full bg-[#FAF7F2] text-xs text-stone-800 placeholder:text-stone-400 pl-9 pr-9 py-2.5 rounded-2xl border border-stone-200/90 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="w-5 h-5 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 absolute right-3 top-2.5 flex items-center justify-center transition"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Horizontal Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 border border-stone-200/70 hover:bg-stone-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Demand Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-stone-100">
          <span className="text-[11px] text-stone-400 flex items-center gap-1 mr-0.5">
            <Filter className="w-3 h-3 text-stone-400" /> 场景:
          </span>
          {demandTags.map((d) => {
            const isSelected = selectedDemands.includes(d.tag);
            return (
              <button
                key={d.tag}
                onClick={() => toggleDemand(d.tag)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${
                  isSelected
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : 'bg-[#FAF7F2] text-stone-600 border-stone-200/60 hover:bg-stone-100'
                }`}
              >
                {d.label}
              </button>
            );
          })}
          {selectedDemands.length > 0 && (
            <button
              onClick={() => setSelectedDemands([])}
              className="text-[10px] text-orange-600 hover:underline font-medium ml-1"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-stone-700">
          共找到 {filteredRecipes.length} 道符合条件的食谱
        </span>
        <span className="text-[11px] text-stone-400">点击查看完整备料与做饭步骤</span>
      </div>

      {/* Recipe List */}
      {filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/80 space-y-2">
          {selectedCategory === 'favorites' ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-2 border border-amber-200">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              </div>
              <p className="text-stone-700 text-sm font-bold">还没有收藏菜谱</p>
              <p className="text-stone-400 text-xs max-w-xs mx-auto">
                在任意食谱卡片或详情页点击 ⭐ 即可收藏常做、爱吃的菜谱，方便随时查看。
              </p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="mt-3 text-xs text-orange-600 font-bold hover:underline"
              >
                浏览全部家常菜库
              </button>
            </>
          ) : (
            <>
              <Utensils className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-stone-600 text-sm font-bold">未找到相关家常菜</p>
              <p className="text-stone-400 text-xs">可以尝试清空筛选标签或换一个食材关键词搜索</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedDemands([]);
                }}
                className="mt-2 text-xs text-orange-600 font-bold hover:underline"
              >
                显示全部菜谱
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredRecipes.map((recipe) => {
            const isFav = favoriteRecipeIds.includes(recipe.id);
            return (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs hover:border-orange-200 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group active:scale-[0.99] relative"
              >
                <div className="flex gap-3">
                  <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {recipe.cookingMethod && (
                      <span className="absolute bottom-1 right-1 bg-stone-900/80 text-white text-[9px] font-bold px-1 py-0.5 rounded backdrop-blur-2xs">
                        {recipe.cookingMethod}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-sm font-bold text-stone-900 group-hover:text-orange-600 transition truncate">
                            {recipe.name}
                          </h4>
                          <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded shrink-0">
                            {recipe.difficulty}
                          </span>
                        </div>

                        {/* Favorite button */}
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
                            title={isFav ? '取消收藏' : '加入收藏'}
                          >
                            <Star
                              className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`}
                            />
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                        {recipe.summary}
                      </p>
                    </div>

                    {/* Ingredients Preview */}
                    <div className="flex items-center gap-1 overflow-hidden text-[10px] text-stone-400 mt-1">
                      <span className="truncate">
                        食材: {recipe.ingredients.slice(0, 3).map(i => i.name).join('、')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-stone-100 text-[10px] text-stone-500">
                  <span className="font-mono font-bold text-orange-600">
                    {recipe.calories} kcal
                  </span>
                  <span>优质蛋白 {recipe.protein}g</span>
                  <span className="flex items-center gap-1 text-stone-400">
                    <Clock className="w-3 h-3" /> {recipe.cookTimeMinutes}分钟
                  </span>
                  <div className="w-4 h-4 rounded-full bg-stone-50 group-hover:bg-orange-50 text-stone-400 group-hover:text-orange-600 flex items-center justify-center transition">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
