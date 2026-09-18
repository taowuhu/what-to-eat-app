import React from 'react';
import { UtensilsCrossed, BookOpen, User } from 'lucide-react';

export type NavTab = 'home' | 'library' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickDecide?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pointer-events-none pb-safe">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-8 py-2.5 flex items-center justify-between pointer-events-auto shadow-lg shadow-stone-900/5">
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 py-1 px-4 transition-colors ${
            currentTab === 'home' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600 font-medium'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="text-xs">今天吃什么</span>
        </button>

        <button
          id="nav-tab-library"
          type="button"
          onClick={() => onTabChange('library')}
          className={`flex flex-col items-center gap-1 py-1 px-4 transition-colors ${
            currentTab === 'library' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600 font-medium'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs">家常菜库</span>
        </button>

        <button
          id="nav-tab-profile"
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-4 transition-colors ${
            currentTab === 'profile' ? 'text-orange-600 font-bold' : 'text-stone-400 hover:text-stone-600 font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs">我的</span>
        </button>
      </div>
    </nav>
  );
};
