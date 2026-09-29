import { Ingredient, Recipe, MealCombo } from '../types';
import { CANONICAL_INGREDIENTS, CANONICAL_ID_MAP, CanonicalIngredient } from '../data/canonicalIngredients';
import { formatScaledAmount } from './servingsScaler';

/**
 * Strips notes, punctuation, numbers, and prep instructions from ingredient names
 * e.g. "牛瘦肉/牛腩 (140克(切块))" -> "牛瘦肉/牛腩"
 * e.g. "青椒 (0.5个(切片))" -> "青椒"
 * e.g. "熟透番茄" -> "熟透番茄"
 */
export function cleanIngredientName(rawName: string): string {
  return rawName
    .replace(/\(.*?\)/g, '')
    .replace(/（.*?）/g, '')
    .replace(/[0-9.]+[克g个根瓣碗勺匙片朵张头条]/g, '')
    .trim();
}

/**
 * Fast lookup: Maps lowercase/normalized string tokens to CanonicalIngredient ID
 */
const aliasToCanonicalMap: Map<string, CanonicalIngredient> = new Map();

// Initialize the map with canonical names and aliases
for (const canon of CANONICAL_INGREDIENTS) {
  aliasToCanonicalMap.set(canon.name, canon);
  aliasToCanonicalMap.set(canon.id, canon);
  for (const alias of canon.aliases) {
    aliasToCanonicalMap.set(alias, canon);
  }
}

/**
 * Find canonical ingredient for a given ingredient name.
 * Uses exact match first, then alias match, then substring fuzzy match.
 */
export function findCanonicalIngredient(rawName: string): CanonicalIngredient | null {
  const clean = cleanIngredientName(rawName);
  if (!clean) return null;

  // 1. Direct match
  if (aliasToCanonicalMap.has(clean)) {
    return aliasToCanonicalMap.get(clean)!;
  }

  // 2. Slash-separated (e.g. "圆白菜/包菜", "牛腩/牛腱肉", "红薯/紫薯")
  if (clean.includes('/')) {
    const parts = clean.split('/');
    for (const part of parts) {
      const trimmed = part.trim();
      if (aliasToCanonicalMap.has(trimmed)) {
        return aliasToCanonicalMap.get(trimmed)!;
      }
    }
  }

  // 3. Substring matching against canonical names and aliases
  for (const canon of CANONICAL_INGREDIENTS) {
    if (clean.includes(canon.name) || canon.name.includes(clean)) {
      return canon;
    }
    for (const alias of canon.aliases) {
      if (clean.includes(alias) || alias.includes(clean)) {
        return canon;
      }
    }
  }

  return null;
}

/**
 * Check if a recipe ingredient matches any of the user's selected canonical ingredient IDs or names
 */
export function isIngredientMatched(
  ingredient: Ingredient,
  selectedCanonicalIds: string[]
): boolean {
  if (!selectedCanonicalIds || selectedCanonicalIds.length === 0) return false;

  // Household seasonings / condiments do NOT count towards pantry matching unless specifically selected
  if (isSeasoningOrAuxiliary(ingredient.category, ingredient.name)) {
    const canonical = findCanonicalIngredient(ingredient.name);
    if (!canonical || !selectedCanonicalIds.includes(canonical.id)) {
      return false;
    }
  }

  const canonical = findCanonicalIngredient(ingredient.name);
  if (!canonical) {
    const clean = cleanIngredientName(ingredient.name);
    return selectedCanonicalIds.some(id => id === clean || clean.includes(id) || id.includes(clean));
  }

  // Direct ID or name match
  if (selectedCanonicalIds.includes(canonical.id) || selectedCanonicalIds.includes(canonical.name)) {
    return true;
  }

  // Cross-matching for related meat cuts / forms (e.g. beef and beef_brisket)
  const relatedGroups: Record<string, string[]> = {
    beef: ['beef', 'beef_brisket'],
    beef_brisket: ['beef', 'beef_brisket'],
  };
  const group = relatedGroups[canonical.id];
  if (group && group.some(gid => selectedCanonicalIds.includes(gid))) {
    return true;
  }

  return selectedCanonicalIds.some(
    token =>
      canonical.aliases.includes(token) ||
      canonical.name.includes(token) ||
      token.includes(canonical.name)
  );
}

/**
 * Returns the list of unique canonical pantry IDs matched by a single recipe
 */
export function getRecipeMatchedPantryIds(
  recipe: Recipe,
  selectedCanonicalIds: string[]
): string[] {
  if (!selectedCanonicalIds || selectedCanonicalIds.length === 0) return [];
  const matched = new Set<string>();
  for (const ing of recipe.ingredients) {
    if (ing.category === '调料辅料' || isSeasoningOrAuxiliary(ing.category, ing.name)) continue;
    for (const pid of selectedCanonicalIds) {
      if (isIngredientMatched(ing, [pid])) {
        matched.add(pid);
      }
    }
  }
  return Array.from(matched);
}

/**
 * Returns the list of unique canonical pantry IDs matched across a meal combination
 */
export function getComboMatchedPantryIds(
  recipes: Recipe[],
  selectedCanonicalIds: string[]
): string[] {
  if (!selectedCanonicalIds || selectedCanonicalIds.length === 0) return [];
  const matched = new Set<string>();
  for (const r of recipes) {
    for (const pid of getRecipeMatchedPantryIds(r, selectedCanonicalIds)) {
      matched.add(pid);
    }
  }
  return Array.from(matched);
}

export interface MealPantryAudit {
  totalCount: number;
  matchedCount: number;
  missingCount: number;
  coverageRate: number; // 0 to 1.0 (e.g. 0.75 for 6/8)
  matchedIngredients: { ingredient: Ingredient; canonical: CanonicalIngredient | null }[];
  missingIngredients: { ingredient: Ingredient; canonical: CanonicalIngredient | null }[];
  matchedCanonicalNames: string[];
  missingCanonicalNames: string[];
  scoreBonus: number;
  selectedPantryCount: number;
  matchedPantryCount: number;
  coverageRatio: number;
  pantryFallback: boolean;
  unusedPantryIngredients: string[];
}

/**
 * Helper to identify whether an ingredient is a common household seasoning / auxiliary condiment
 */
export function isSeasoningOrAuxiliary(category?: string, name?: string): boolean {
  if (category === '调料辅料') return true;
  if (!name) return false;
  const seasonings = ['盐', '油', '生抽', '老抽', '料酒', '醋', '糖', '胡椒粉', '蚝油', '淀粉', '葱', '姜', '蒜', '花椒', '八角', '生粉'];
  return seasonings.some(s => name.includes(s));
}

/**
 * Evaluates a MealCombo against user's selected pantry ingredients.
 * Returns breakdown of what user has vs what user is missing.
 */
export function auditMealPantryCoverage(
  recipes: Recipe[],
  selectedCanonicalIds: string[],
  clearFridgeMode: boolean = false
): MealPantryAudit {
  if (selectedCanonicalIds.length === 0) {
    return {
      totalCount: 0,
      matchedCount: 0,
      missingCount: 0,
      coverageRate: 0,
      matchedIngredients: [],
      missingIngredients: [],
      matchedCanonicalNames: [],
      missingCanonicalNames: [],
      scoreBonus: 0,
      selectedPantryCount: 0,
      matchedPantryCount: 0,
      coverageRatio: 1,
      pantryFallback: false,
      unusedPantryIngredients: [],
    };
  }

  // Aggregate unique non-seasoning ingredients (or all primary items)
  const seenCanonicalMap = new Map<string, { ingredient: Ingredient; canonical: CanonicalIngredient | null }>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (ing.category === '调料辅料' || isSeasoningOrAuxiliary(ing.category, ing.name)) {
        // Exclude salt, oil, soy sauce, garlic, ginger, scallion from pantry coverage calculation
        continue;
      }

      const canon = findCanonicalIngredient(ing.name);
      if (canon) {
        const existing = seenCanonicalMap.get(canon.id);
        if (existing) {
          existing.ingredient = {
            ...existing.ingredient,
            amount: formatScaledAmount(existing.ingredient.amount + ing.amount),
            grams: existing.ingredient.grams !== undefined || ing.grams !== undefined
              ? (existing.ingredient.grams || existing.ingredient.amount) + (ing.grams || ing.amount)
              : undefined,
          };
        } else {
          seenCanonicalMap.set(canon.id, { ingredient: { ...ing }, canonical: canon });
        }
      } else {
        const clean = cleanIngredientName(ing.name);
        const existing = seenCanonicalMap.get(clean);
        if (existing) {
          existing.ingredient = {
            ...existing.ingredient,
            amount: formatScaledAmount(existing.ingredient.amount + ing.amount),
            grams: existing.ingredient.grams !== undefined || ing.grams !== undefined
              ? (existing.ingredient.grams || existing.ingredient.amount) + (ing.grams || ing.amount)
              : undefined,
          };
        } else {
          seenCanonicalMap.set(clean, { ingredient: { ...ing }, canonical: null });
        }
      }
    }
  }

  const matched: { ingredient: Ingredient; canonical: CanonicalIngredient | null }[] = [];
  const missing: { ingredient: Ingredient; canonical: CanonicalIngredient | null }[] = [];
  const matchedCanonicalNames: string[] = [];
  const missingCanonicalNames: string[] = [];

  for (const [, item] of seenCanonicalMap.entries()) {
    const isMatched = isIngredientMatched(item.ingredient, selectedCanonicalIds);

    if (isMatched) {
      matched.push(item);
      matchedCanonicalNames.push(item.canonical ? item.canonical.name : item.ingredient.name);
    } else {
      missing.push(item);
      missingCanonicalNames.push(item.canonical ? item.canonical.name : item.ingredient.name);
    }
  }

  const totalCount = matched.length + missing.length;
  const matchedCount = matched.length;
  const missingCount = missing.length;
  const coverageRate = totalCount > 0 ? matchedCount / totalCount : 0;

  const comboMatchedPantryIds = getComboMatchedPantryIds(recipes, selectedCanonicalIds);
  const selectedPantryCount = selectedCanonicalIds.length;
  const matchedPantryCount = comboMatchedPantryIds.length;
  const coverageRatio = selectedPantryCount > 0 ? matchedPantryCount / selectedPantryCount : 1;
  const unusedPantryIds = selectedCanonicalIds.filter(id => !comboMatchedPantryIds.includes(id));
  const unusedPantryIngredients = unusedPantryIds.map(id => CANONICAL_ID_MAP.get(id)?.name || id);
  const pantryFallback = matchedPantryCount < selectedPantryCount;

  // Calculate recommendation score bonus
  // If clearFridgeMode is true, heavy bonus on consuming maximum available items
  let scoreBonus = 0;
  if (clearFridgeMode) {
    scoreBonus = (matchedCount * 50) + (coverageRate * 120) - (missingCount * 12);
  } else {
    scoreBonus = (matchedCount * 25) + (coverageRate * 60) - (missingCount * 6);
  }

  return {
    totalCount,
    matchedCount,
    missingCount,
    coverageRate,
    matchedIngredients: matched,
    missingIngredients: missing,
    matchedCanonicalNames,
    missingCanonicalNames,
    scoreBonus,
    selectedPantryCount,
    matchedPantryCount,
    coverageRatio,
    pantryFallback,
    unusedPantryIngredients,
  };
}
