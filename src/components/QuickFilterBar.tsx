import React from 'react';
import { Timer, Flame, User, Utensils, Sparkles } from 'lucide-react';
import { QuickFilterId } from '../types';
import { QUICK_FILTERS } from '../data/defaultProfile';

interface QuickFilterBarProps {
  selectedFilters: QuickFilterId[];
  onToggleFilter: (filterId: QuickFilterId) => void;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  selectedFilters,
  onToggleFilter,
}) => {
  const getIcon = (id: QuickFilterId) => {
    switch (id) {
      case '15min':
        return <Timer className="w-3.5 h-3.5" />;
      case 'single_person':
        return <User className="w-3.5 h-3.5" />;
      case 'high_protein':
        return <Flame className="w-3.5 h-3.5" />;
      case 'lazy_mode':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'homestyle':
        return <Utensils className="w-3.5 h-3.5" />;
      default:
        return <Utensils className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
      {QUICK_FILTERS.map((f) => {
        const isSelected = selectedFilters.includes(f.id);
        return (
          <button
            key={f.id}
            id={`filter-${f.id}`}
            type="button"
            onClick={() => onToggleFilter(f.id)}
            className={`flex-1 min-w-[76px] py-2 px-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
              isSelected
                ? 'bg-orange-50/90 text-orange-800 border-orange-300 shadow-2xs font-bold'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80 font-medium'
            }`}
          >
            <div className={`flex items-center gap-1 text-xs ${isSelected ? 'text-orange-600' : 'text-stone-500'}`}>
              {getIcon(f.id)}
              <span className="leading-tight">{f.label}</span>
            </div>
            <span className={`text-[10px] ${isSelected ? 'text-orange-600/80 font-semibold' : 'text-stone-400'}`}>
              {f.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
};
