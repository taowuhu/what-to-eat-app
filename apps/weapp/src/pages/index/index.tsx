import { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import {
  generateMealRecommendation,
  DEFAULT_USER_PROFILE,
  MealCombo,
} from '../../shared/coreBridge';
import './index.css';

export default function Index() {
  const [meal, setMeal] = useState<MealCombo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRecommend = () => {
    try {
      setError(null);
      setLoading(true);
      // Call the shared root Core recommender directly
      const result = generateMealRecommendation({
        userProfile: DEFAULT_USER_PROFILE,
        mealType: 'lunch',
      });
      setMeal(result);
    } catch (err: any) {
      console.error('Core Recommendation Runtime Error:', err);
      setError('推荐生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="index-container">
      <View className="header">
        <Text className="title">今天吃什么</Text>
        <Text className="subtitle">Shared Core Bridge (V0.5.0 Spike)</Text>
      </View>

      <View className="action-section">
        <Button
          className="primary-btn"
          onClick={handleRecommend}
          loading={loading}
          hoverClass="none"
        >
          帮我选一顿
        </Button>
      </View>

      {error && (
        <View className="error-card">
          <Text className="error-text">{error}</Text>
        </View>
      )}

      {meal && (
        <View className="meal-card">
          <Text className="meal-badge">
            {meal.isOnePot ? '一锅搞定' : meal.cookwareCount ? `${meal.cookwareCount}个锅` : '均衡搭配'}
          </Text>

          <Text className="meal-title">{meal.comboTitle}</Text>

          <Text className="section-label">菜品列表</Text>
          <View className="dish-list">
            {meal.recipes.map((r, idx) => (
              <Text key={r.id || idx} className="dish-item">
                • {r.name}
              </Text>
            ))}
          </View>

          <View className="meta-row">
            <View className="meta-item">
              预计时间: <Text className="meta-val">{meal.estimatedTimeMinutes} 分钟</Text>
            </View>
            <View className="meta-item">
              人数: <Text className="meta-val">{meal.servingSize || '1人份'}</Text>
            </View>
          </View>

          <Text className="section-label">营养估算摘要</Text>
          <View className="nutrition-box">
            <Text className="nutrition-text">
              热量约 {meal.totalCalories} kcal · 蛋白质 {meal.totalProtein}g · 碳水 {meal.totalCarbs}g · 脂肪 {meal.totalFat}g
            </Text>
          </View>

          {meal.recommendationReason && (
            <View className="reason-box">
              <Text className="reason-text">{meal.recommendationReason}</Text>
            </View>
          )}
        </View>
      )}

      {!meal && !error && (
        <View className="empty-state">
          <Text>点击上方按钮，由共享 Core 智能生成本餐搭配</Text>
        </View>
      )}
    </View>
  );
}
