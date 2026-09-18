import React from 'react';
import { Sparkles, Dices, ChefHat, ArrowRight } from 'lucide-react';

interface BigDecideButtonProps {
  onDecide: () => void;
  isLoading?: boolean;
}

export const BigDecideButton: React.FC<BigDecideButtonProps> = ({ onDecide, isLoading }) => {
  return (
    <div className="relative group">
      {/* Ambient background glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300" />

      <button
        id="btn-big-decide"
        onClick={onDecide}
        disabled={isLoading}
        className="relative w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-md shadow-orange-600/25 active:scale-[0.99] transition-all flex items-center justify-between overflow-hidden"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -left-4 -top-4 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

        <div className="flex items-center gap-3.5 z-10 text-left">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
            {isLoading ? (
              <Dices className="w-6 h-6 animate-spin text-white" />
            ) : (
              <ChefHat className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white drop-shadow-xs">
                今天吃什么？
              </span>
              <span className="bg-amber-300 text-amber-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                智能搭配一整顿
              </span>
            </div>
            <p className="text-xs text-orange-100 mt-0.5 font-medium line-clamp-1">
              结合今日剩余营养与忌口 · 均衡搭配主菜+时蔬+主食
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 z-10 group-hover:translate-x-0.5 transition-transform">
          <ArrowRight className="w-4 h-4 text-white" />
        </div>
      </button>
    </div>
  );
};
