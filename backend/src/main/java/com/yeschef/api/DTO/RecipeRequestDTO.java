package com.yeschef.api.DTO;

import java.util.List;

import com.yeschef.api.DTO.InstructionDTO.InstructionStepDTO;

public class RecipeRequestDTO {

    private String title;
    private String sourceType;
    private int prepTime;
    private int cookTime;
    private List<InstructionStepDTO> steps;
    private List<IngredientDTO> ingredients;

    public static class IngredientDTO {
        private String ingredient;
        private String quantity;

        public IngredientDTO() {}

        public IngredientDTO(String ingredient, String quantity) {
            this.ingredient = ingredient;
            this.quantity = quantity;
        }

        public String getIngredient() { return ingredient; }
        public String getQuantity() { return quantity; }

        public void setIngredient(String ingredient) { this.ingredient = ingredient; }
        public void setQuantity(String quantity) { this.quantity = quantity; }
    }

    public String getTitle() { return title; }
    //public Long getSourceId() { return sourceId; }
    public String getSourceType() { return sourceType; }
    public int getPrepTime() { return prepTime; }
    public int getCookTime() { return cookTime; }
    public List<InstructionStepDTO> getSteps() { return steps; }
    public List<IngredientDTO> getIngredients() { return ingredients; }

    public void setTitle(String title) { this.title = title; }
    //public void setSourceId(Long sourceId) { this.sourceId = sourceId; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }
    public void setPrepTime(int prepTime) { this.prepTime = prepTime; }
    public void setCookTime(int cookTime) { this.cookTime = cookTime; }
    public void setSteps(List<InstructionStepDTO> instructions) { this.steps = instructions; }
    public void setIngredients(List<IngredientDTO> ingredients) { this.ingredients = ingredients; }
}
