/** Mirrors backend Recipe model for API responses. */
export interface RecipeSource {
  id: number;
  sourceType: 'API' | 'USER';
  api_url?: string;
}

export interface RecipeIngredient {
  ingredient: string;
  quantity?: string;
}

export interface InstructionStep {
  stepNumber: number;
  stepDescription: string;
}

export interface RecipeInstruction {
  id: number;
  prepTime: number;
  cookTime: number;
  steps?: InstructionStep[];
}

export interface Recipe {
  id: number;
  title: string;
  source?: RecipeSource;
  ingredients?: RecipeIngredient[];
  instruction?: RecipeInstruction;
  ratings?: unknown[];
  likes?: unknown[];
  saves?: unknown[];
}

/** Rating from GET /ratings endpoints. */
export interface RatingResponse {
  id: number;
  recipeId: number;
  userId: number;
  tasteQuality: number;
  easeOfExecution: number;
}

/** Body for POST /ratings and PUT /ratings/{id}. */
export interface RatingRequest {
  recipeId: number;
  userId: number;
  tasteQuality: number;
  easeOfExecution: number;
}

/** User from GET /users or GET /users/{id}. */
export interface User {
  id: number;
  username: string;
}

/** Saved-recipe entry from GET /users/{userId}/saved. */
export interface HasSaved {
  id: number;
  recipeId: number | null;
}
