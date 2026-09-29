import { Recipe, RecipeCategory, MealType, ProteinSource } from '../types';
export * from './recipes/index';
import {
  ALL_RECIPES,
  getRecipeById,
  getRecipesByCategory,
  getRecipesByMealType,
  getRecipesByProtein,
  isFoodComponent,
  isCompleteRecipe,
  getPublicRecipes,
} from './recipes/index';

export const RECIPES: Recipe[] = ALL_RECIPES;
export const SAMPLE_RECIPES: Recipe[] = ALL_RECIPES;

export {
  getRecipeById,
  getRecipesByCategory,
  getRecipesByMealType,
  getRecipesByProtein,
  isFoodComponent,
  isCompleteRecipe,
  getPublicRecipes,
};
