import { recipesUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';
import type { Recipe } from './types';

export type { Recipe, RecipeIngredient, RecipeInstruction, RecipeSource } from './types';

/** GET /recipes - fetch all recipes (validates API connectivity). */
export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch(recipesUrl(), {
    method: 'GET',
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  return handleResponse<Recipe[]>(res);
}

/** GET /recipes/{id} - fetch a single recipe by id. */
export async function getRecipe(id: number): Promise<Recipe> {
  const res = await fetch(recipesUrl(`/${id}`), {
    method: 'GET',
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  return handleResponse<Recipe>(res);
}

export async function getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
  const res = await fetch(
    recipesUrl(`/by-ingredient?ingredient=${encodeURIComponent(ingredient)}`),
    {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders() },
    }
  );
  return handleResponse<Recipe[]>(res);
}

export async function getRecipesByTime(maxTime: number): Promise<Recipe[]> {
  const res = await fetch(
    recipesUrl(`/by-time?maxTime=${encodeURIComponent(maxTime)}`),
    {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders() },
    }
  );
  return handleResponse<Recipe[]>(res);
}