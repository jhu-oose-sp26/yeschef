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
