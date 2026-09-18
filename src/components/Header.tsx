import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userProfile, onOpenProfile }) => {
  // Format today's date in friendly Chinese format
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDayStr = weekDays[today.getDay()];

  const goalTextMap: Record<string, { label: string; color: string }> = {
    fat_loss: { label: '健康饮食', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    maintain: { label: '健康饮食', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    muscle_gain: { label: '健康饮食', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  };

  const goalBadge = goalTextMap[userProfile.goal] || { label: '健康饮食', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

  return (
    <header className="pt-4 pb-3 px-4 flex items-center justify-between bg-[#FAF7F2]/90 backdrop-blur-md sticky top-0 z-20 border-b border-stone-200/50">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-orange-600/20">
              吃
            </span>
            今天吃什么
          </h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${goalBadge.color}`}>
            {goalBadge.label}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
          <span>{month}月{date}日 {weekDayStr}</span>
          <span>·</span>
          <span>家常快手 · 一步步做饭</span>
        </p>
      </div>

      <button
        id="btn-header-profile"
        onClick={onOpenProfile}
        className="flex items-center gap-1 text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 border border-stone-200/80 px-2.5 py-1.5 rounded-full transition shadow-xs active:scale-95"
      >
        <Settings className="w-3.5 h-3.5 text-stone-500" />
        <span>偏好设置</span>
      </button>
    </header>
  );
};
