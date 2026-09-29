/**
 * WeChat Mini Program Shared Core Bridge (V0.5.0 Phase 2)
 *
 * Direct bridge to the root repository's Shared Core.
 * Imports and re-exports minimal API and types required by the WeChat applet.
 * NO duplicate core files exist in apps/weapp!
 */
export { generateMealRecommendation } from '@shared-core/utils/recommender';
export type { RecommendationOptions } from '@shared-core/utils/recommender';

export { DEFAULT_USER_PROFILE } from '@shared-core/utils/nutrition';

export type {
  MealCombo,
  UserProfile,
  Recipe,
  MacroNutrients,
  PantryCoverageInfo,
  MealType,
  QuickFilterId,
} from '@shared-core/types';
