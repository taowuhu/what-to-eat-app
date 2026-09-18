import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Check, ArrowRight, ArrowLeft, Clock, ChefHat, Sparkles,
  Flame, CheckCircle2, RotateCcw, AlertCircle, Play, Pause,
  Utensils, CheckSquare, Square, ThumbsUp, ThumbsDown, Smile
} from 'lucide-react';
import { Recipe, MealCombo, MealType, Ingredient, CookingStep, CookingRating, CookingFeedbackTag } from '../types';
import { saveCookingFeedback } from '../utils/storage';
import { scaleRecipe } from '../utils/servingsScaler';
import { ServingsSegment } from './ServingsSegment';

interface CookingModeViewProps {
  recipe?: Recipe;
  combo?: MealCombo;
  onClose: () => void;
  onFinishCooking: (title: string, recipes: Recipe[], mealType: MealType) => void;
}

type CookingPhase = 1 | 2 | 3 | 4;

export const CookingModeView: React.FC<CookingModeViewProps> = ({
  recipe,
  combo,
  onClose,
  onFinishCooking,
}) => {
  // Current 4-phase step: 1: 准备食材, 2: 处理食材, 3: 开始烹饪, 4: 完成
  const [currentPhase, setCurrentPhase] = useState<CookingPhase>(1);

  // Servings state: defaults to combo serving or recipe serving
  const [servings, setServings] = useState<number>(() => {
    if (combo?.servingSize?.includes('2')) return 2;
    if (combo?.servingSize?.includes('3')) return 3;
    if (combo?.servingSize?.includes('4')) return 4;
    return combo?.recipes[0]?.servings || recipe?.servings || 1;
  });

  // Base and scaled cooking recipes pool
  const baseRecipes: Recipe[] = useMemo(() => {
    return combo ? combo.recipes : (recipe ? [recipe] : []);
  }, [combo, recipe]);

  const cookingRecipes: Recipe[] = useMemo(() => {
    return baseRecipes.map(r => scaleRecipe(r, servings));
  }, [baseRecipes, servings]);

  const title = combo ? combo.comboTitle : (recipe ? recipe.name : '美味家常饭');

  // Phase 1: Ingredients check state (set of ingredient keys checked)
  const allIngredients: { id: string; name: string; amount: number; unit: string; category?: string; recipeName: string }[] = [];
  cookingRecipes.forEach((r) => {
    r.ingredients.forEach((ing, i) => {
      allIngredients.push({
        id: `${r.id}_ing_${i}`,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category,
        recipeName: r.name,
      });
    });
  });

  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkAllIngredients = () => {
    const allChecked: Record<string, boolean> = {};
    allIngredients.forEach((ing) => {
      allChecked[ing.id] = true;
    });
    setCheckedIngredients(allChecked);
  };

  // Phase 3: Active cooking steps across the recipes
  const allCookingSteps: { step: CookingStep; recipeName: string; index: number }[] = [];
  cookingRecipes.forEach((r) => {
    r.steps.forEach((s) => {
      allCookingSteps.push({
        step: s,
        recipeName: r.name,
        index: allCookingSteps.length,
      });
    });
  });

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const currentStepItem = allCookingSteps[activeStepIndex] || allCookingSteps[0];

  // Timer for active cooking step
  const [timeLeft, setTimeLeft] = useState(currentStepItem?.step?.durationSeconds || 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    if (currentStepItem?.step?.durationSeconds) {
      setTimeLeft(currentStepItem.step.durationSeconds);
      setIsTimerRunning(false);
    }
  }, [activeStepIndex, currentStepItem]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, timeLeft]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(currentStepItem?.step?.durationSeconds || 60);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Phase 4 finish meal type selector and post-cooking feedback
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [rating, setRating] = useState<CookingRating | null>(null);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState<CookingFeedbackTag[]>([]);

  const toggleFeedbackTag = (tag: CookingFeedbackTag) => {
    setSelectedFeedbackTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCompleteAll = () => {
    // If feedback rating or tags provided, save to localStorage
    if (rating || selectedFeedbackTags.length > 0) {
      cookingRecipes.forEach(r => {
        saveCookingFeedback({
          recipeId: r.id,
          recipeName: r.name,
          rating: rating || 'like',
          tags: selectedFeedbackTags,
          timestamp: Date.now(),
        });
      });
    }
    onFinishCooking(title, cookingRecipes, mealType);
    onClose();
  };

  const phaseNames: Record<CookingPhase, string> = {
    1: '准备食材',
    2: '处理食材',
    3: '开始烹饪',
    4: '完成出锅',
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] flex flex-col justify-between max-w-md mx-auto overflow-hidden">
      {/* ============================================================ */}
      {/* Top Wizard Navigation Bar */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-stone-200/90 p-4 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              新手保姆级教程
            </span>
            <h2 className="text-sm font-black text-stone-900 truncate max-w-[200px]">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Steps Indicator Pill Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          {([1, 2, 3, 4] as CookingPhase[]).map((phaseNum) => {
            const isDone = currentPhase > phaseNum;
            const isCurrent = currentPhase === phaseNum;
            return (
              <div
                key={phaseNum}
                onClick={() => {
                  if (phaseNum <= currentPhase) setCurrentPhase(phaseNum);
                }}
                className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-orange-600 text-white font-bold shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold'
                    : 'bg-stone-100 text-stone-400 font-medium'
                }`}
              >
                <span className="text-[10px] tracking-tight">第 {phaseNum} 步</span>
                <span className="text-xs font-bold leading-tight truncate">
                  {phaseNames[phaseNum]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Main Phase Body */}
      {/* ============================================================ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ============================================================ */}
        {/* PHASE 1: 准备食材 (Checklist) */}
        {/* ============================================================ */}
        {currentPhase === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <ChefHat className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-black text-stone-900">第一步：核对并备齐食材</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                新手做饭不慌的法宝：提前把所有肉类、蔬菜和调料按克数称好放盘子里，炒菜时顺手一倒即可，绝不会手忙脚乱！
              </p>

              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-stone-100 text-xs">
                <span className="text-stone-500 font-medium">
                  已备齐：{Object.values(checkedIngredients).filter(Boolean).length} / {allIngredients.length}
                </span>
                <button
                  onClick={checkAllIngredients}
                  className="text-orange-600 hover:text-orange-700 font-bold text-xs bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60"
                >
                  一键全部备齐 ✓
                </button>
              </div>

              {/* Servings Switcher */}
              <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">就餐份量：</span>
                <ServingsSegment currentServings={servings} onChangeServings={setServings} />
              </div>
            </div>

            {/* Recipe by Recipe Ingredients Table */}
            {cookingRecipes.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <h4 className="text-xs font-bold text-stone-800">
                      {r.name}
                    </h4>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {r.ingredients.length} 样食材
                  </span>
                </div>

                <div className="space-y-1.5">
                  {r.ingredients.map((ing, idx) => {
                    const ingId = `${r.id}_ing_${idx}`;
                    const isChecked = !!checkedIngredients[ingId];
                    return (
                      <div
                        key={ingId}
                        onClick={() => toggleIngredient(ingId)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50/60 border-emerald-200/70 text-stone-500 line-through'
                            : 'bg-[#FAF7F2] border-stone-200/70 text-stone-800 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400 shrink-0" />
                          )}
                          <span className="font-semibold">{ing.name}</span>
                          {ing.notes && (
                            <span className="text-[10px] text-stone-400">({ing.notes})</span>
                          )}
                        </div>

                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-800">
                          {ing.amount} {ing.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 2: 处理食材 (Preparation, Cutting & Marinating) */}
        {/* ============================================================ */}
        {currentPhase === 2 && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <ChefHat className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-black text-stone-900">第二步：食材清洗、切配与腌制</h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                按照以下步骤预处理好食材。这是做饭最好吃的关键，提前腌好肉、切好菜，下锅只管翻炒！
              </p>
            </div>

            {/* Preparation Cards */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>主食提前上锅（最省时）</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed pl-7">
                  若有米饭或杂粮饭，先淘洗干净加入 1.2 倍水，按下电饭煲煮饭键。等菜炒好时米饭刚好热气腾腾出锅！
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <span>肉类切配与抓腌（鲜嫩秘诀）</span>
                </div>
                <div className="text-xs text-stone-700 space-y-1.5 pl-7 leading-relaxed">
                  <p>• <strong>逆纹切薄片</strong>：牛肉或猪肉顺着纹理切会塞牙发硬，横着垂直肉丝纹理切，肉质最嫩。</p>
                  <p>• <strong>抓匀腌制 10 分钟</strong>：加入 1勺生抽 + 半勺料酒 + 1勺生粉 + 几滴油抓匀静置，油能锁住水分不柴。</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>蔬菜清洗与备小碟</span>
                </div>
                <div className="text-xs text-stone-700 space-y-1.5 pl-7 leading-relaxed">
                  <p>• 西兰花剪小朵加少许盐水浸泡冲净；叶菜洗净沥干水分（水多下锅容易溅油且炒软）。</p>
                  <p>• 蒜瓣拍扁切碎，辣椒切段备在小味碟中。</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-[11px] font-black">
                    4
                  </span>
                  <span>新手防糊秘技：提前调料汁</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed pl-7">
                  小碗中预调：1勺生抽 + 半勺蚝油 + 少许白胡椒/黑胡椒 + 2勺清水 + 半勺淀粉搅匀。锅热后直接倒入翻炒包裹食材，再也不用手忙脚乱一个一个找瓶子！
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 3: 开始烹饪 (Stove Actions with Timer & Cues) */}
        {/* ============================================================ */}
        {currentPhase === 3 && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Step Progress Pill */}
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">
                  当前正在烹饪：{currentStepItem?.recipeName}
                </span>
                <h3 className="text-sm font-black text-stone-900 mt-0.5">
                  步骤 {activeStepIndex + 1} / {allCookingSteps.length}：{currentStepItem?.step?.title}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-30 flex items-center justify-center text-stone-700 transition"
                  title="上一步"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={activeStepIndex === allCookingSteps.length - 1}
                  onClick={() => setActiveStepIndex((prev) => Math.min(allCookingSteps.length - 1, prev + 1))}
                  className="w-8 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-30 flex items-center justify-center text-white transition"
                  title="下一步"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Current Step Action Card */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-xs space-y-3.5">
              {/* Flame level & tags */}
              <div className="flex items-center gap-2">
                <span className="bg-orange-50 text-orange-700 border border-orange-200/60 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-600" />
                  {currentStepItem?.step?.flameLevel || '中火'}
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {currentStepItem?.step?.durationSeconds
                    ? `建议操作约 ${Math.round(currentStepItem.step.durationSeconds / 60)} 分钟`
                    : '根据状态出锅'}
                </span>
              </div>

              {/* Action text */}
              <p className="text-stone-900 text-sm font-bold leading-relaxed">
                {currentStepItem?.step?.action}
              </p>

              {/* Visual Cue - What to look for */}
              <div className="bg-amber-50/80 border border-amber-200/70 p-3 rounded-xl text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1 text-amber-950 mb-0.5">
                  <span>👀 怎么判断做好了（感官状态确认）：</span>
                </div>
                <p className="leading-relaxed font-medium">
                  {currentStepItem?.step?.visualCue}
                </p>
              </div>

              {/* Interactive Timer */}
              {currentStepItem?.step?.durationSeconds && (
                <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-stone-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="text-[10px] text-stone-400 font-semibold block">烹饪倒计时</span>
                      <span className="text-xl font-black font-mono text-stone-900 tracking-wider">
                        {formatTimer(timeLeft)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleTimer}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        isTimerRunning
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-orange-600 text-white hover:bg-orange-700'
                      }`}
                    >
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isTimerRunning ? '暂停' : '计时'}</span>
                    </button>

                    <button
                      onClick={resetTimer}
                      className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
                      title="重置时间"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick overview of all steps */}
            <div className="bg-white/80 rounded-2xl p-3 border border-stone-200/70 space-y-1.5">
              <span className="text-[11px] font-bold text-stone-500 block px-1">全部步骤进度：</span>
              <div className="space-y-1">
                {allCookingSteps.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`text-xs p-2 rounded-xl flex items-center justify-between cursor-pointer transition ${
                      idx === activeStepIndex
                        ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200/60'
                        : idx < activeStepIndex
                        ? 'text-stone-400 bg-[#FAF7F2] line-through'
                        : 'text-stone-600 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. [{item.recipeName}] {item.step.title}
                    </span>
                    {idx < activeStepIndex && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* PHASE 4: 完成出锅 (Finish & Celebrate) */}
        {/* ============================================================ */}
        {currentPhase === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200 text-center">
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30 animate-bounce">
                <ChefHat className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
                  🎉 烹饪大获成功
                </span>
                <h3 className="text-xl font-black text-stone-900 mt-2">
                  香气扑鼻！开动啦
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  恭喜你成功做出一整顿家常好饭！营养丰富少油健康，给自己一个大大的赞。
                </p>
              </div>

              {/* Food Photos Thumbnails */}
              <div className="pt-2 flex items-center justify-center gap-2">
                {cookingRecipes.map((r) => (
                  <div key={r.id} className="text-center">
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border-2 border-orange-200 mx-auto shadow-2xs"
                    />
                    <span className="text-[11px] font-bold text-stone-700 block mt-1 truncate max-w-[72px]">
                      {r.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Post-cooking feedback (V0.4 新增：今天这顿怎么样？轻量不强制) */}
              <div className="pt-3 border-t border-stone-100 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-900">
                    今天这顿怎么样？
                  </span>
                  <span className="text-[11px] text-stone-400">可选·自动记住你的口味</span>
                </div>

                {/* 3 ratings: 好吃 / 一般 / 不喜欢 */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setRating(rating === 'like' ? null : 'like')}
                    className={`py-2 px-2 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 ${
                      rating === 'like'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>👍</span>
                    <span>好吃</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRating(rating === 'neutral' ? null : 'neutral')}
                    className={`py-2 px-2 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 ${
                      rating === 'neutral'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>😐</span>
                    <span>一般</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRating(rating === 'dislike' ? null : 'dislike')}
                    className={`py-2 px-2 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 ${
                      rating === 'dislike'
                        ? 'bg-stone-700 text-white border-stone-700 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>👎</span>
                    <span>不喜欢</span>
                  </button>
                </div>

                {/* Optional tags: 可多选 */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  {(['下次还想吃', '有点麻烦', '太辣', '太淡', '太咸'] as CookingFeedbackTag[]).map(tag => {
                    const isSelected = selectedFeedbackTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleFeedbackTag(tag)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-orange-100 text-orange-800 border-orange-300 shadow-2xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meal Type selection */}
              <div className="pt-3 border-t border-stone-100 text-left">
                <span className="text-xs font-bold text-stone-700 block mb-2">
                  记入今日做饭记录（时段）：
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => {
                    const names: Record<string, string> = {
                      breakfast: '早餐',
                      lunch: '午餐',
                      dinner: '晚餐',
                    };
                    return (
                      <button
                        key={type}
                        onClick={() => setMealType(type)}
                        className={`py-2 px-1 rounded-xl border font-bold transition ${
                          mealType === type
                            ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {names[type]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* Bottom Sticky Action Bar */}
      {/* ============================================================ */}
      <div className="p-4 bg-white border-t border-stone-200/80 shrink-0 shadow-lg">
        {currentPhase === 1 && (
          <button
            id="btn-phase1-next"
            onClick={() => setCurrentPhase(2)}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-600/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <span>食材备齐，进入第 2 步处理食材</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {currentPhase === 2 && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setCurrentPhase(1)}
              className="col-span-1 py-3 px-2 rounded-2xl border border-stone-200 text-stone-600 font-bold text-xs bg-stone-50 hover:bg-stone-100 transition"
            >
              ← 上一步
            </button>
            <button
              id="btn-phase2-next"
              onClick={() => setCurrentPhase(3)}
              className="col-span-2 py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-600/25 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <span>处理完毕，第 3 步开始烹饪</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentPhase === 3 && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (activeStepIndex > 0) {
                    setActiveStepIndex(activeStepIndex - 1);
                  } else {
                    setCurrentPhase(2);
                  }
                }}
                className="py-3 px-3 rounded-2xl border border-stone-200 text-stone-600 font-bold text-xs bg-stone-50 hover:bg-stone-100 transition"
              >
                ← 上一步
              </button>

              {activeStepIndex < allCookingSteps.length - 1 ? (
                <button
                  id="btn-cooking-next-step"
                  onClick={() => setActiveStepIndex(activeStepIndex + 1)}
                  className="py-3 px-3 rounded-2xl font-bold text-xs text-white bg-orange-600 hover:bg-orange-700 shadow-2xs transition flex items-center justify-center gap-1"
                >
                  <span>下一步操作</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  id="btn-cooking-to-finish"
                  onClick={() => setCurrentPhase(4)}
                  className="py-3 px-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>全部出锅完成！</span>
                </button>
              )}
            </div>
          </div>
        )}

        {currentPhase === 4 && (
          <button
            id="btn-finish-recording"
            onClick={handleCompleteAll}
            className="w-full py-4 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 shadow-lg shadow-orange-600/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>记录到我的做饭足迹并返回首页</span>
          </button>
        )}
      </div>
    </div>
  );
};
