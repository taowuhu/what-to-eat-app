import { UserProfile, DailyLog, RecommendationFeedback, CookingFeedback } from '../types';
import { DEFAULT_USER_PROFILE, getInitialDailyLog, getTodayDateString } from '../data/defaultProfile';
import { DEFAULT_RECENT_INGREDIENT_IDS } from '../data/canonicalIngredients';

/**
 * StoragePort: Minimal synchronous key-value storage port for cross-platform portability
 * (Web localStorage, WeChat wx.getStorageSync / wx.setStorageSync, Memory Adapter)
 */
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

/**
 * WebLocalStorageAdapter: Default browser adapter using window.localStorage
 */
export class WebLocalStorageAdapter implements StoragePort {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.error(`[WebLocalStorageAdapter] getItem failed for key "${key}":`, e);
    }
    return null;
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error(`[WebLocalStorageAdapter] setItem failed for key "${key}":`, e);
    }
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error(`[WebLocalStorageAdapter] removeItem failed for key "${key}":`, e);
    }
  }

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
        return;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (e) {
      console.error('[WebLocalStorageAdapter] clear failed:', e);
    }
  }
}

/**
 * MemoryStorageAdapter: In-memory fallback adapter for SSR, Node testing, or non-persistent environments
 */
export class MemoryStorageAdapter implements StoragePort {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

let activeStoragePort: StoragePort = new WebLocalStorageAdapter();

/**
 * Injects a custom StoragePort (e.g. Taro/WeChat adapter or Memory adapter)
 */
export function setStoragePort(port: StoragePort): void {
  activeStoragePort = port;
}

/**
 * Returns the currently active StoragePort
 */
export function getStoragePort(): StoragePort {
  return activeStoragePort;
}

/**
 * Resets to the default WebLocalStorageAdapter
 */
export function resetStoragePort(): void {
  activeStoragePort = new WebLocalStorageAdapter();
}

// -------------------------------------------------------------
// Storage Keys
// -------------------------------------------------------------
const PROFILE_KEY = 'today_eat_user_profile_v1';
const DAILY_LOG_KEY_PREFIX = 'today_eat_daily_log_';
const PANTRY_INGREDIENTS_KEY = 'today_eat_pantry_ingredients_v1';
const RECENT_INGREDIENTS_KEY = 'today_eat_recent_ingredients_v1';
const CLEAR_FRIDGE_MODE_KEY = 'today_eat_clear_fridge_mode_v1';
const GROCERY_ITEMS_KEY = 'today_eat_custom_grocery_items_v1';
const FAVORITES_KEY = 'today_eat_favorite_recipe_ids_v1';
const RECOMMENDATION_FEEDBACK_KEY = 'today_eat_recommendation_feedbacks_v1';
const COOKING_FEEDBACK_KEY = 'today_eat_cooking_feedbacks_v1';

export interface SavedGroceryItem {
  name: string;
  amount: number;
  unit: string;
  category?: string;
  addedAt: number;
}

// -------------------------------------------------------------
// 1. Custom Grocery Items (买菜清单)
// -------------------------------------------------------------
export function loadCustomGroceryItems(): SavedGroceryItem[] {
  try {
    const data = getStoragePort().getItem(GROCERY_ITEMS_KEY);
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
    getStoragePort().setItem(GROCERY_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save custom grocery items:', e);
  }
}

// -------------------------------------------------------------
// 2. Pantry Ingredients (冰箱食材)
// -------------------------------------------------------------
export function loadPantryIngredients(): string[] {
  try {
    const data = getStoragePort().getItem(PANTRY_INGREDIENTS_KEY);
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
    getStoragePort().setItem(PANTRY_INGREDIENTS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save pantry ingredients:', e);
  }
}

// -------------------------------------------------------------
// 3. Recent Ingredients (最近使用食材)
// -------------------------------------------------------------
export function loadRecentIngredients(): string[] {
  try {
    const data = getStoragePort().getItem(RECENT_INGREDIENTS_KEY);
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
    getStoragePort().setItem(RECENT_INGREDIENTS_KEY, JSON.stringify(unique));
  } catch (e) {
    console.error('Failed to save recent ingredients:', e);
  }
}

// -------------------------------------------------------------
// 4. Clear Fridge Mode (清冰箱优先模式)
// -------------------------------------------------------------
export function loadClearFridgeMode(): boolean {
  try {
    return getStoragePort().getItem(CLEAR_FRIDGE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveClearFridgeMode(enabled: boolean): void {
  try {
    getStoragePort().setItem(CLEAR_FRIDGE_MODE_KEY, String(enabled));
  } catch (e) {
    console.error('Failed to save clear fridge mode:', e);
  }
}

// -------------------------------------------------------------
// 5. User Profile (用户画像与身体数据)
// -------------------------------------------------------------
export function loadUserProfile(): UserProfile {
  try {
    const data = getStoragePort().getItem(PROFILE_KEY);
    if (data) {
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load user profile from storage:', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    getStoragePort().setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

// -------------------------------------------------------------
// 6. Daily Log (每日做饭打卡日志)
// -------------------------------------------------------------
export function loadDailyLog(dateStr: string = getTodayDateString()): DailyLog {
  try {
    const key = `${DAILY_LOG_KEY_PREFIX}${dateStr}`;
    const data = getStoragePort().getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load daily log from storage:', e);
  }
  return getInitialDailyLog();
}

export function saveDailyLog(dailyLog: DailyLog): void {
  try {
    const key = `${DAILY_LOG_KEY_PREFIX}${dailyLog.date}`;
    getStoragePort().setItem(key, JSON.stringify(dailyLog));
  } catch (e) {
    console.error('Failed to save daily log:', e);
  }
}

// -------------------------------------------------------------
// 7. Favorite Recipe IDs (我的收藏)
// -------------------------------------------------------------
export function loadFavoriteRecipeIds(): string[] {
  try {
    const data = getStoragePort().getItem(FAVORITES_KEY);
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
    getStoragePort().setItem(FAVORITES_KEY, JSON.stringify(Array.from(new Set(ids))));
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

// -------------------------------------------------------------
// 8. Recommendation Feedbacks (“不想吃这个”)
// -------------------------------------------------------------
export function loadRecommendationFeedbacks(): RecommendationFeedback[] {
  try {
    const data = getStoragePort().getItem(RECOMMENDATION_FEEDBACK_KEY);
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
    getStoragePort().setItem(RECOMMENDATION_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recommendation feedback:', e);
  }
}

// -------------------------------------------------------------
// 9. Post-Cooking Feedback (“今天这顿怎么样？”)
// -------------------------------------------------------------
export function loadCookingFeedbacks(): CookingFeedback[] {
  try {
    const data = getStoragePort().getItem(COOKING_FEEDBACK_KEY);
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
    getStoragePort().setItem(COOKING_FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save cooking feedback:', e);
  }
}

// -------------------------------------------------------------
// Backward-compatibility aliases
// -------------------------------------------------------------
export const getUserProfile = loadUserProfile;
export const getPantryIngredients = loadPantryIngredients;
export const getDailyLog = loadDailyLog;
export const getFavoriteRecipeIds = loadFavoriteRecipeIds;
export const getCustomGroceryItems = loadCustomGroceryItems;
export const getRecentIngredients = loadRecentIngredients;
export const getClearFridgeMode = loadClearFridgeMode;
export const getRecommendationFeedbacks = loadRecommendationFeedbacks;
export const getCookingFeedbacks = loadCookingFeedbacks;

