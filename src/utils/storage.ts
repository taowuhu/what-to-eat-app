import { UserProfile, DailyLog, RecommendationFeedback, CookingFeedback } from '../types';
import { DEFAULT_USER_PROFILE, getInitialDailyLog, getTodayDateString } from '../data/defaultProfile';

const PROFILE_KEY = 'today_eat_user_profile_v1';
const DAILY_LOG_KEY_PREFIX = 'today_eat_daily_log_';
const PANTRY_INGREDIENTS_KEY = 'today_eat_pantry_ingredients_v1';
const RECENT_INGREDIENTS_KEY = 'today_eat_recent_ingredients_v1';
const CLEAR_FRIDGE_MODE_KEY = 'today_eat_clear_fridge_mode_v1';
const GROCERY_ITEMS_KEY = 'today_eat_custom_grocery_items_v1';
const FAVORITES_KEY = 'today_eat_favorite_recipe_ids_v1';
const RECOMMENDATION_FEEDBACK_KEY = 'today_eat_recommendation_feedbacks_v1';
const COOKING_FEEDBACK_KEY = 'today_eat_cooking_feedbacks_v1';

import { DEFAULT_RECENT_INGREDIENT_IDS } from '../data/canonicalIngredients';

export interface SavedGroceryItem {
  name: string;
  amount: number;
  unit: string;
  category?: string;
  addedAt: number;
}

export function loadCustomGroceryItems(): SavedGroceryItem[] {
  try {
    const data = localStorage.getItem(GROCERY_ITEMS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load custom grocery items:', e);
  }
  return [];
}

export function saveCustomGroceryItems(items: SavedGroceryItem[]): void {
  try {
    localStorage.setItem(GROCERY_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save custom grocery items:', e);
  }
}

export function loadPantryIngredients(): string[] {
  try {
    const data = localStorage.getItem(PANTRY_INGREDIENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load pantry ingredients:', e);
  }
  return [];
}

export function savePantryIngredients(ids: string[]): void {
  try {
    localStorage.setItem(PANTRY_INGREDIENTS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save pantry ingredients:', e);
  }
}

export function loadRecentIngredients(): string[] {
  try {
    const data = localStorage.getItem(RECENT_INGREDIENTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load recent ingredients:', e);
  }
  return DEFAULT_RECENT_INGREDIENT_IDS;
}

export function saveRecentIngredients(ids: string[]): void {
  try {
    // Keep up to 16 unique recent ingredients
    const unique = Array.from(new Set(ids)).slice(0, 16);
    localStorage.setItem(RECENT_INGREDIENTS_KEY, JSON.stringify(unique));
  } catch (e) {
    console.error('Failed to save recent ingredients:', e);
  }
}

export function loadClearFridgeMode(): boolean {
  try {
    return localStorage.getItem(CLEAR_FRIDGE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveClearFridgeMode(enabled: boolean): void {
  try {
    localStorage.setItem(CLEAR_FRIDGE_MODE_KEY, String(enabled));
  } catch (e) {
    console.error('Failed to save clear fridge mode:', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load user profile from localStorage:', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

export function loadDailyLog(dateStr: string = getTodayDateString()): DailyLog {
  try {
    const key = `${DAILY_LOG_KEY_PREFIX}${dateStr}`;
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load daily log from localStorage:', e);
  }
  return getInitialDailyLog();
}

export function saveDailyLog(dailyLog: DailyLog): void {
  try {
    const key = `${DAILY_LOG_KEY_PREFIX}${dailyLog.date}`;
    localStorage.setItem(key, JSON.stringify(dailyLog));
  } catch (e) {
    console.error('Failed to save daily log:', e);
  }
}

// ==========================================
// V0.4 Favorites Persistence (我的收藏)
// ==========================================
export function loadFavoriteRecipeIds(): string[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load favorite recipes:', e);
  }
  return [];
}

export function saveFavoriteRecipeIds(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (e) {
    console.error('Failed to save favorite recipes:', e);
  }
}

export function toggleFavoriteRecipeId(recipeId: string): boolean {
  const current = loadFavoriteRecipeIds();
  const exists = current.includes(recipeId);
  const updated = exists ? current.filter(id => id !== recipeId) : [...current, recipeId];
  saveFavoriteRecipeIds(updated);
  return !exists;
}

// ==========================================
// V0.4 Recommendation Feedback (“不想吃这个”)
// ==========================================
export function loadRecommendationFeedbacks(): RecommendationFeedback[] {
  try {
    const data = localStorage.getItem(RECOMMENDATION_FEEDBACK_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load recommendation feedbacks:', e);
  }
  return [];
}

export function saveRecommendationFeedback(feedback: RecommendationFeedback): void {
  try {
    const current = loadRecommendationFeedbacks();
    // Keep latest 30 feedbacks
    const updated = [feedback, ...current].slice(0, 30);
    localStorage.setItem(RECOMMENDATION_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recommendation feedback:', e);
  }
}

// ==========================================
// V0.4 Post-Cooking Feedback (“今天这顿怎么样？”)
// ==========================================
export function loadCookingFeedbacks(): CookingFeedback[] {
  try {
    const data = localStorage.getItem(COOKING_FEEDBACK_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load cooking feedbacks:', e);
  }
  return [];
}

export function saveCookingFeedback(feedback: CookingFeedback): void {
  try {
    const current = loadCookingFeedbacks();
    // Keep latest 50 cooking feedbacks
    const updated = [feedback, ...current].slice(0, 50);
    localStorage.setItem(COOKING_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save cooking feedback:', e);
  }
}
