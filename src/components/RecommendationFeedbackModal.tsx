import React, { useState } from 'react';
import { X, Clock, ThumbsDown, Sparkles, Flame, Ban, Check, Salad, Droplets } from 'lucide-react';
import { FeedbackSkipReason, Recipe } from '../types';

interface RecommendationFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  onSubmit: (reason: FeedbackSkipReason, targetRecipeId?: string) => void;
}

export const RecommendationFeedbackModal: React.FC<RecommendationFeedbackModalProps> = ({
  isOpen,
  onClose,
  recipes,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<FeedbackSkipReason | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');

  if (!isOpen) return null;

  const handleSelectReason = (reason: FeedbackSkipReason) => {
    setSelectedReason(reason);
    if (reason !== 'dislike_dish') {
      onSubmit(reason);
      onClose();
    }
  };

  const handleConfirmDislikeDish = () => {
    onSubmit('dislike_dish', selectedRecipeId);
    onClose();
  };

  const options: {
    key: FeedbackSkipReason;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'recently_eaten',
      label: '最近刚吃过',
      description: '短期内少推荐这几道菜',
      icon: <Clock className="w-4 h-4 text-blue-500" />,
    },
    {
      key: 'not_today',
      label: '今天单纯不想吃这个',
      description: '直接换一套完全不同口味的',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
    },
    {
      key: 'prefer_light',
      label: '今天想吃清淡一点',
      description: '换少油、白灼、清蒸、鲜汤',
      icon: <Droplets className="w-4 h-4 text-teal-500" />,
    },
    {
      key: 'no_meat_today',
      label: '今天不想吃肉',
      description: '多配时蔬、蛋类与高钙豆制品',
      icon: <Salad className="w-4 h-4 text-emerald-500" />,
    },
    {
      key: 'too_troublesome',
      label: '太麻烦 / 想更省时',
      description: '换备料简单、15分钟极速出锅的',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
    },
    {
      key: 'dislike_dish',
      label: '不喜欢其中某道菜',
      description: '降低这道菜以后的推荐频率',
      icon: <Ban className="w-4 h-4 text-rose-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 border border-stone-200">
        {/* Header */}
        <div className="p-4 bg-white border-b border-stone-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-stone-900">为什么想换这顿？</h3>
            <p className="text-xs text-stone-500 mt-0.5">选个原因，自动记住偏好并重新挑选</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {options.map(opt => (
            <div key={opt.key}>
              <button
                type="button"
                onClick={() => handleSelectReason(opt.key)}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between group active:scale-[0.99] ${
                  selectedReason === opt.key
                    ? 'bg-orange-50/90 border-orange-300 shadow-2xs'
                    : 'bg-white hover:bg-stone-50 border-stone-200/90'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-stone-200/70 flex items-center justify-center shrink-0">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-orange-600 transition">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {opt.description}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold text-stone-400 group-hover:text-stone-700">
                  选择
                </span>
              </button>

              {/* Expand dish selector if user clicked 'dislike_dish' */}
              {selectedReason === 'dislike_dish' && opt.key === 'dislike_dish' && (
                <div className="mt-2 p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-rose-900">请选择不喜欢的具体菜品：</div>
                  <div className="space-y-1.5">
                    {recipes.map(r => (
                      <label
                        key={r.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          selectedRecipeId === r.id
                            ? 'bg-white border-rose-300 font-bold text-rose-950 shadow-2xs'
                            : 'bg-white/80 border-stone-200 text-stone-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="dislikeRecipe"
                            value={r.id}
                            checked={selectedRecipeId === r.id}
                            onChange={() => setSelectedRecipeId(r.id)}
                            className="accent-rose-600"
                          />
                          <span>{r.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-400">({r.category === 'main' ? '主菜' : r.category === 'vegetable' ? '蔬菜' : '主食'})</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmDislikeDish}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    确认降权并立即换一顿
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
