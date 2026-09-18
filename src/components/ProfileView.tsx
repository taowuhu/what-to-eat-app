import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal } from '../types';
import { calculateBMR, calculateTDEE, calculateMacroTargets } from '../utils/nutrition';
import { Save, Check, RefreshCcw, Sparkles } from 'lucide-react';

interface ProfileViewProps {
  initialProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onBackToHome: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  initialProfile,
  onSaveProfile,
  onBackToHome,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Dynamic calculations
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(profile);
  const targets = calculateMacroTargets(profile);

  const handleGenderChange = (gender: Gender) => {
    setProfile((prev) => ({ ...prev, gender }));
  };

  const handleGoalChange = (goal: Goal) => {
    setProfile((prev) => ({ ...prev, goal }));
  };

  const handleActivityChange = (activityLevel: ActivityLevel) => {
    setProfile((prev) => ({ ...prev, activityLevel }));
  };

  const commonPreferences = [
    '快手省时',
    '一人食好做',
    '家常少油',
    '高蛋白饱腹',
    '经济低预算',
    '高膳食纤维',
  ];

  const commonDislikes = [
    '香菜',
    '葱姜蒜',
    '虾',
    '海鲜',
    '羊肉',
    '动物内脏',
    '辛辣',
    '牛肉',
    '猪肉',
    '鸡蛋',
    '芹菜',
    '黄瓜',
  ];

  const togglePreference = (pref: string) => {
    setProfile((prev) => {
      const exists = prev.dietaryPreferences.includes(pref);
      return {
        ...prev,
        dietaryPreferences: exists
          ? prev.dietaryPreferences.filter((p) => p !== pref)
          : [...prev.dietaryPreferences, pref],
      };
    });
  };

  const toggleDislike = (dislike: string) => {
    setProfile((prev) => {
      const exists = prev.dislikes.includes(dislike);
      return {
        ...prev,
        dislikes: exists
          ? prev.dislikes.filter((d) => d !== dislike)
          : [...prev.dislikes, dislike],
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profile);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onBackToHome();
    }, 700);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
            ⚙️
          </span>
          <div>
            <h2 className="text-base font-bold text-stone-900">我的做饭推荐偏好</h2>
            <p className="text-xs text-stone-500">
              用于后台智能推荐适合你份量与目标的家常饭，无需理解复杂营养学
            </p>
          </div>
        </div>
      </div>

      {/* Gentle summary badge for background target */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-[10px] text-stone-400 font-semibold block">后台匹配基准</span>
          <span className="text-sm font-black text-stone-800">
            约 {targets.calories} kcal / 天
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 inline-block">
            {profile.goal === 'fat_loss' ? '减脂塑形' : profile.goal === 'muscle_gain' ? '增肌增力' : '健康维持'}
          </span>
          <p className="text-[10px] text-stone-400 mt-0.5">后台自动控油少盐</p>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Basic Physical Data */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3.5">
          <h3 className="text-xs font-bold text-stone-700">基础身体档案</h3>

          {/* Gender */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">性别</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  profile.gender === 'male'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                男生 👨
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  profile.gender === 'female'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                女生 👩
              </button>
            </div>
          </div>

          {/* Age, Height, Weight */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">年龄</label>
              <div className="relative">
                <input
                  type="number"
                  min="14"
                  max="90"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) || 25 })}
                  className="w-full text-sm font-bold border border-stone-200 rounded-xl px-2.5 py-2 font-mono"
                />
                <span className="absolute right-2 top-2.5 text-[10px] text-stone-400">岁</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">身高</label>
              <div className="relative">
                <input
                  type="number"
                  min="120"
                  max="220"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) || 170 })}
                  className="w-full text-sm font-bold border border-stone-200 rounded-xl px-2.5 py-2 font-mono"
                />
                <span className="absolute right-2 top-2.5 text-[10px] text-stone-400">cm</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">体重</label>
              <div className="relative">
                <input
                  type="number"
                  min="35"
                  max="160"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: Number(e.target.value) || 60 })}
                  className="w-full text-sm font-bold border border-stone-200 rounded-xl px-2.5 py-2 font-mono"
                />
                <span className="absolute right-2 top-2.5 text-[10px] text-stone-400">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Selection */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold text-stone-700">当前饮食健康目标</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'fat_loss', label: '科学减脂', desc: '热量赤字 · 高蛋白保肌' },
              { id: 'maintain', label: '维持体型', desc: '收支平衡 · 精力充沛' },
              { id: 'muscle_gain', label: '增肌塑形', desc: '适度盈余 · 强化力量' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => handleGoalChange(g.id as Goal)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  profile.goal === g.id
                    ? 'bg-orange-50 border-orange-600 text-orange-950 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="text-xs font-bold">{g.label}</span>
                <span className="text-[10px] text-stone-500 mt-1 leading-tight">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity & Workouts */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-stone-700">日常活动与健身情况</h3>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">平日活动水平</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sedentary', label: '久坐办公族', desc: '除走动外几乎不运动' },
                { id: 'light', label: '轻度日常活动', desc: '每天散步/轻体力活' },
                { id: 'moderate', label: '规律中度运动', desc: '每周规律跑步/打球' },
                { id: 'active', label: '高强度运动', desc: '高负荷健身/体力工作' },
              ].map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleActivityChange(act.id as ActivityLevel)}
                  className={`p-2 rounded-xl border text-left transition ${
                    profile.activityLevel === act.id
                      ? 'bg-orange-50 border-orange-600 text-orange-900'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">{act.label}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{act.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-stone-500">每周训练 / 运动频次</label>
              <span className="text-xs font-bold text-orange-600 font-mono">
                {profile.weeklyWorkouts} 次/周
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              value={profile.weeklyWorkouts}
              onChange={(e) => setProfile({ ...profile, weeklyWorkouts: Number(e.target.value) })}
              className="w-full accent-orange-600"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>0次 (不健身)</span>
              <span>3次 (一般)</span>
              <span>7次 (每天练)</span>
            </div>
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-stone-700">饮食偏好（智能搭配时加权优先）</h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {commonPreferences.map((pref) => {
              const active = profile.dietaryPreferences.includes(pref);
              return (
                <button
                  key={pref}
                  type="button"
                  onClick={() => togglePreference(pref)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    active
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {active ? '✓ ' : '+ '}
                  {pref}
                </button>
              );
            })}
          </div>
        </div>

        {/* Default Servings (V0.4 新增) */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-700">默认就餐人数 / 份量</h3>
            <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 font-medium">
              每次推荐自动换算对应克数
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/70">
            {[1, 2, 3, 4].map((serv) => (
              <button
                key={serv}
                type="button"
                onClick={() => setProfile({ ...profile, defaultServings: serv })}
                className={`py-2 text-xs font-bold rounded-lg transition-all text-center ${
                  (profile.defaultServings || 1) === serv
                    ? 'bg-white text-orange-600 shadow-2xs font-black'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                {serv}人份
              </button>
            ))}
          </div>
        </div>

        {/* Strictly Exclude (绝对不吃 / 严格排除) */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-stone-800">不吃的食材（严格排除，绝不出）</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">过敏或坚决不碰的食材，任何含此食材的菜谱均不会推荐</p>
            </div>
            <span className="text-[11px] text-rose-600 font-bold shrink-0 ml-2">
              已排除 {(profile.strictlyExclude || []).length} 项
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {['香菜', '动物内脏', '羊肉', '花生', '海鲜', '辛辣', '牛肉', '猪肉'].map((item) => {
              const active = (profile.strictlyExclude || []).includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    const current = profile.strictlyExclude || [];
                    setProfile({
                      ...profile,
                      strictlyExclude: active
                        ? current.filter(x => x !== item)
                        : [...current, item],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    active
                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {active ? '✕ 坚决不吃' : '+ '} {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Soft Dislikes (不喜欢 / 降低权重) */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-stone-800">不喜欢的食材（降低权重，尽量少出）</h3>
              <p className="text-[11px] text-stone-400 mt-0.5">不是绝对禁忌，但在推荐排序中会自动降权</p>
            </div>
            <span className="text-[11px] text-stone-500 font-bold shrink-0 ml-2">
              已选 {profile.dislikes.length} 项
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {['胡萝卜', '苦瓜', '洋葱', '芹菜', '青椒', '菌菇', '蒜薹', '白萝卜'].map((item) => {
              const active = profile.dislikes.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleDislike(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    active
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {active ? '✓ 少推荐' : '+ '} {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="sticky bottom-16 pt-2 pb-2">
          <button
            type="submit"
            id="btn-save-profile"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-600/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>保存身体数据与目标</span>
          </button>
        </div>
      </form>

      {/* Toast */}
      {showSavedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>目标与身体数据已更新！</span>
        </div>
      )}
    </div>
  );
};
