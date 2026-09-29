import {
  StoragePort,
  WebLocalStorageAdapter,
  MemoryStorageAdapter,
  setStoragePort,
  getStoragePort,
  resetStoragePort,
  loadUserProfile,
  saveUserProfile,
  loadPantryIngredients,
  savePantryIngredients,
  loadRecentIngredients,
  saveRecentIngredients,
  loadClearFridgeMode,
  saveClearFridgeMode,
  loadDailyLog,
  saveDailyLog,
  loadFavoriteRecipeIds,
  saveFavoriteRecipeIds,
  toggleFavoriteRecipeId,
  loadCustomGroceryItems,
  saveCustomGroceryItems,
  loadRecommendationFeedbacks,
  saveRecommendationFeedback,
  loadCookingFeedbacks,
  saveCookingFeedback,
  getUserProfile,
  getPantryIngredients,
} from '../src/utils/storage';
import { UserProfile, DailyLog } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('=== V0.4.8 Mini Program Storage Portability Test ===\n');

// 1. Check default port
const defaultPort = getStoragePort();
assert(defaultPort instanceof WebLocalStorageAdapter, 'Default port should be WebLocalStorageAdapter');
console.log('✓ Check 1: Default port is WebLocalStorageAdapter');

// 2. Mock Custom Storage Adapter (simulating WeChat wx.getStorageSync / wx.setStorageSync)
class MockWeChatStorageAdapter implements StoragePort {
  private store: Record<string, string> = {};
  public getCallCount = 0;
  public setCallCount = 0;
  public removeCallCount = 0;

  getItem(key: string): string | null {
    this.getCallCount++;
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.setCallCount++;
    this.store[key] = value;
  }

  removeItem(key: string): void {
    this.removeCallCount++;
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockWeChat = new MockWeChatStorageAdapter();
setStoragePort(mockWeChat);
assert(getStoragePort() === mockWeChat, 'StoragePort should be updated to mockWeChat');
console.log('✓ Check 2: StoragePort successfully injected with custom adapter');

// 3. Test Profile Persistence via Injected Adapter
const testProfile: UserProfile = {
  gender: 'female',
  age: 26,
  height: 165,
  weight: 52,
  activityLevel: 'light',
  weeklyWorkouts: 2,
  goal: 'maintain',
  dietaryPreferences: ['balanced'],
  dislikes: ['cilantro'],
  strictlyExclude: ['peanuts'],
  defaultServings: 1,
};

saveUserProfile(testProfile);
assert(mockWeChat.setCallCount === 1, 'setItem should be called once on injected adapter');

const loadedProfile = loadUserProfile();
assert(mockWeChat.getCallCount === 1, 'getItem should be called once on injected adapter');
assert(loadedProfile.age === 26, 'Loaded profile age should match');
assert(loadedProfile.weight === 52, 'Loaded profile weight should match');
assert(loadedProfile.strictlyExclude?.includes('peanuts') === true, 'Loaded profile strictlyExclude should match');
console.log('✓ Check 3: UserProfile read/write through injected adapter verified');

// 4. Test Alias APIs
const profileViaAlias = getUserProfile();
assert(profileViaAlias.weight === 52, 'getUserProfile alias works identically to loadUserProfile');
console.log('✓ Check 4: Backward-compatible aliases verified');

// 5. Test Pantry Ingredients
const pantryList = ['ing_egg', 'ing_chicken_breast', 'ing_broccoli'];
savePantryIngredients(pantryList);
const loadedPantry = getPantryIngredients();
assert(loadedPantry.length === 3, 'Pantry ingredients length should be 3');
assert(loadedPantry[1] === 'ing_chicken_breast', 'Pantry ingredient item matches');
console.log('✓ Check 5: Pantry ingredients read/write verified');

// 6. Test DailyLog Persistence
const testDailyLog: DailyLog = {
  date: '2026-09-28',
  records: [
    {
      id: 'rec_1',
      mealType: 'breakfast',
      title: '全麦吐司配煎蛋',
      calories: 350,
      protein: 15,
      carbs: 45,
      fat: 10,
      timeString: '08:30',
      dishes: [{ name: '全麦吐司', calories: 200 }, { name: '煎蛋', calories: 150 }],
    },
  ],
};
saveDailyLog(testDailyLog);
const loadedDailyLog = loadDailyLog('2026-09-28');
assert(loadedDailyLog.date === '2026-09-28', 'Daily log date matches');
assert(loadedDailyLog.records.length === 1, 'Daily log records count matches');
assert(loadedDailyLog.records[0].calories === 350, 'Daily log record calories matches');
console.log('✓ Check 6: DailyLog read/write verified');

// 7. Test Favorites and Toggles
saveFavoriteRecipeIds(['recipe_1', 'recipe_2']);
let favs = loadFavoriteRecipeIds();
assert(favs.length === 2 && favs.includes('recipe_1'), 'Favorites saved correctly');
const toggledOff = toggleFavoriteRecipeId('recipe_1');
assert(toggledOff === false, 'Toggle existing favorite should return false (removed)');
favs = loadFavoriteRecipeIds();
assert(favs.length === 1 && !favs.includes('recipe_1'), 'Favorites updated after removal');
const toggledOn = toggleFavoriteRecipeId('recipe_3');
assert(toggledOn === true, 'Toggle new favorite should return true (added)');
favs = loadFavoriteRecipeIds();
assert(favs.length === 2 && favs.includes('recipe_3'), 'Favorites updated after addition');
console.log('✓ Check 7: Favorite recipe IDs & toggling verified');

// 8. Test MemoryStorageAdapter
const memAdapter = new MemoryStorageAdapter();
setStoragePort(memAdapter);
saveClearFridgeMode(true);
assert(loadClearFridgeMode() === true, 'Clear fridge mode in MemoryStorageAdapter');
saveRecentIngredients(['ing_carrot', 'ing_onion']);
const recents = loadRecentIngredients();
assert(recents.includes('ing_carrot'), 'Recent ingredients in MemoryStorageAdapter');
console.log('✓ Check 8: MemoryStorageAdapter verified');

// 9. Reset and verify default recovery
resetStoragePort();
assert(getStoragePort() instanceof WebLocalStorageAdapter, 'resetStoragePort restores WebLocalStorageAdapter');
console.log('✓ Check 9: resetStoragePort successfully restores WebLocalStorageAdapter');

console.log('\n========================================');
console.log('ALL 9 STORAGE PORTABILITY CHECKS PASSED!');
console.log('========================================');
