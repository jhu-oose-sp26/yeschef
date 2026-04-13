import { recipesUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';
import type { Recipe, RecipeCreateRequest, RecipeDtoResponse, RecipeSource } from './types';

export type {
  Recipe,
  RecipeCreateRequest,
  RecipeIngredient,
  RecipeInstruction,
  RecipeSource,
} from './types';

type RawRecipe = Recipe | RecipeDtoResponse;

function normalizeSource(source: RecipeSource | string | undefined): RecipeSource | undefined {
  if (!source) return undefined;
  if (typeof source === 'string') {
    return { sourceType: source as RecipeSource['sourceType'] };
  }
  return source;
}

function normalizeRecipe(recipe: RawRecipe): Recipe {
  if ('instruction' in recipe || (recipe.source && typeof recipe.source !== 'string')) {
    return {
      ...recipe,
      source: normalizeSource(recipe.source),
    };
  }

  return {
    id: recipe.id,
    title: recipe.title,
    source: normalizeSource(recipe.source),
    ingredients: recipe.ingredients ?? [],
    instruction:
      recipe.prepTime != null || recipe.cookTime != null || recipe.steps != null
        ? {
            id: recipe.id,
            prepTime: recipe.prepTime ?? 0,
            cookTime: recipe.cookTime ?? 0,
            steps: recipe.steps ?? [],
          }
        : undefined,
  };
}

/** GET /recipes - fetch all recipes (validates API connectivity). */
export async function getRecipes(): Promise<Recipe[]> {
  const res = await fetch(recipesUrl(), {
    method: 'GET',
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  const data = await handleResponse<RawRecipe[]>(res);
  return data.map(normalizeRecipe);
}

/** GET /recipes/{id} - fetch a single recipe by id. */
export async function getRecipe(id: number): Promise<Recipe> {
  const res = await fetch(recipesUrl(`/${id}`), {
    method: 'GET',
    headers: { Accept: 'application/json', ...authHeaders() },
  });
  const data = await handleResponse<RawRecipe>(res);
  return normalizeRecipe(data);
}

/** POST /recipes - create a recipe owned by the current user. */
export async function createRecipe(body: RecipeCreateRequest): Promise<Recipe> {
  const res = await fetch(recipesUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await handleResponse<RawRecipe>(res);
  return normalizeRecipe(data);
}

export async function getRecipesByIngredient(ingredient: string): Promise<Recipe[]> {
  const res = await fetch(
    recipesUrl(`/by-ingredient?ingredient=${encodeURIComponent(ingredient)}`),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );
  const data = await handleResponse<RawRecipe[]>(res);
  return data.map(normalizeRecipe);
}

export async function getRecipesByTime(maxTime: number): Promise<Recipe[]> {
  const res = await fetch(
    recipesUrl(`/by-time?maxTime=${encodeURIComponent(maxTime)}`),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );
  const data = await handleResponse<RawRecipe[]>(res);
  return data.map(normalizeRecipe);
}

export function normalizeRecipes(recipes: RawRecipe[]): Recipe[] {
  return recipes.map(normalizeRecipe);
}
