import React from 'react';
import { Users } from 'lucide-react';

interface ServingsSegmentProps {
  value: number; // 1, 2, 3, 4
  onChange: (servings: number) => void;
  className?: string;
  showHint?: boolean;
}

export const ServingsSegment: React.FC<ServingsSegmentProps> = ({
  value,
  onChange,
  className = '',
  showHint = true,
}) => {
  const options = [1, 2, 3, 4];

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
          <Users className="w-3.5 h-3.5 text-orange-600" />
          <span>份量人数</span>
        </div>
        {showHint && value > 1 && (
          <span className="text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded font-medium border border-orange-200/60">
            食材等比缩放 · 调料适量防咸
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80">
        {options.map(opt => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                isSelected
                  ? 'bg-white text-orange-600 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              {opt}人份
            </button>
          );
        })}
      </div>
    </div>
  );
};
