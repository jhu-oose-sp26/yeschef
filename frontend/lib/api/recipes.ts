import { recipesUrl } from '@/constants/api';
import { authHeaders, handleResponse } from './client';
import { tokenStore } from '@/lib/auth/tokenStore';
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

export function normalizeRecipe(recipe: RawRecipe): Recipe {
  if ('instruction' in recipe || (recipe.source && typeof recipe.source !== 'string')) {
    return {
      ...recipe,
      source: normalizeSource(recipe.source),
    };
  }

  const dto = recipe as RecipeDtoResponse;
  return {
    id: dto.id,
    title: dto.title,
    source: normalizeSource(dto.source),
    creatorUsername: dto.username,
    ingredients: dto.ingredients ?? [],
    instruction:
      dto.prepTime != null || dto.cookTime != null || dto.steps != null
        ? {
            id: dto.id,
            prepTime: dto.prepTime ?? 0,
            cookTime: dto.cookTime ?? 0,
            steps: dto.steps ?? [],
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
      headers: { Accept: 'application/json', ...authHeaders() },
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
      headers: { Accept: 'application/json', ...authHeaders() },
    }
  );
  const data = await handleResponse<RawRecipe[]>(res);
  return data.map(normalizeRecipe);
}

export function normalizeRecipes(recipes: RawRecipe[]): Recipe[] {
  return recipes.map(normalizeRecipe);
}

/** Search recipes by title (uses /by-name entity endpoint). */
export async function searchRecipesByName(query: string): Promise<Recipe[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(recipesUrl(`/by-name?name=${encodeURIComponent(query)}`), {
      headers: { Accept: 'application/json', ...authHeaders() },
    });
    if (!res.ok) return [];
    const list: RawRecipe[] = await res.json();
    return list.map(normalizeRecipe);
  } catch {
    return [];
  }
}

/**
 * Fetch the raw Recipe entity (includes real source.id and instruction.id)
 * needed for the PUT body. Uses a manual fetch that never throws and never
 * dispatches auth:unauthorized, so it won't clear the session token.
 */
export async function getRecipeEntityByIdSafe(id: number, title: string): Promise<any | null> {
  try {
    const res = await fetch(recipesUrl(`/by-name?name=${encodeURIComponent(title)}`), {
      headers: { Accept: 'application/json', ...authHeaders() },
    });
    if (!res.ok) return null;
    const list: any[] = await res.json();
    return list.find((r: any) => r.id === id) ?? null;
  } catch {
    return null;
  }
}

/** PUT /recipes/{id} - update a recipe. tokenOverride bypasses tokenStore for reliability. */
export async function updateRecipe(id: number, body: Recipe, tokenOverride?: string | null): Promise<Recipe> {
  const token = tokenOverride ?? tokenStore.get();
  const res = await fetch(recipesUrl(`/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await handleResponse<RawRecipe>(res);
  return normalizeRecipe(data);
}

/** DELETE /recipes/{id} - delete a recipe. */
export async function deleteRecipe(id: number): Promise<void> {
  const res = await fetch(recipesUrl(`/${id}`), {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Delete failed: ${res.status}`);
  }
}
