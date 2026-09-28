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
  const canonical = findCanonicalIngredient(ingredient.name);
  if (!canonical) {
    const clean = cleanIngredientName(ingredient.name);
    return selectedCanonicalIds.some(id => id === clean || clean.includes(id) || id.includes(clean));
  }
  return (
    selectedCanonicalIds.includes(canonical.id) ||
    selectedCanonicalIds.includes(canonical.name) ||
    selectedCanonicalIds.some(
      token =>
        canonical.aliases.includes(token) ||
        canonical.name.includes(token) ||
        token.includes(canonical.name)
    )
  );
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
}

/**
 * Helper to identify whether an ingredient is a common household seasoning / auxiliary condiment
 */
export function isSeasoningOrAuxiliary(category?: string, name?: string): boolean {
  if (category === '调料辅料') return true;
  if (!name) return false;
  const seasonings = ['盐', '油', '生抽', '老抽', '料酒', '醋', '糖', '胡椒粉', '蚝油', '淀粉', '葱', '姜', '蒜'];
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
    };
  }

  // Aggregate unique non-seasoning ingredients (or all primary items)
  const seenCanonicalMap = new Map<string, { ingredient: Ingredient; canonical: CanonicalIngredient | null }>();
  const unmappedIngredients: Ingredient[] = [];

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      if (ing.category === '调料辅料') {
        // Exclude salt, oil, soy sauce from "pantry lack" unless it's a primary food
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

  for (const [key, item] of seenCanonicalMap.entries()) {
    const isMatched = item.canonical
      ? (
          selectedCanonicalIds.includes(item.canonical.id) ||
          selectedCanonicalIds.includes(item.canonical.name) ||
          selectedCanonicalIds.some(
            token =>
              item.canonical?.aliases.includes(token) ||
              item.canonical?.name.includes(token) ||
              token.includes(item.canonical?.name || '')
          )
        )
      : selectedCanonicalIds.some(
          token =>
            item.ingredient.name.includes(token) ||
            token.includes(cleanIngredientName(item.ingredient.name))
        );

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
  };
}
