package com.yeschef.api.DTO;

import java.util.List;
import com.yeschef.api.DTO.InstructionDTO.InstructionStepDTO;

public class RecipeResponseDTO {
    private Long id;
    private String title;
    private String source;
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

    public RecipeResponseDTO() {}

    public RecipeResponseDTO(
            Long id,
            String title,
            String source,
            int prepTime,
            int cookTime,
            List<IngredientDTO> ingredients,
            List<InstructionStepDTO> steps) {

        this.id = id;
        this.title = title;
        this.source = source;
        this.prepTime = prepTime;
        this.cookTime = cookTime;
        this.ingredients = ingredients;
        this.steps = steps;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getSource() { return source; }
    public int getPrepTime() { return prepTime; }
    public int getCookTime() { return cookTime; }
    public List<IngredientDTO> getIngredients() { return ingredients; }
    public List<InstructionStepDTO> getSteps() { return steps; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setSource(String source) { this.source = source; }
    public void setPrepTime(int prepTime) { this.prepTime = prepTime; }
    public void setCookTime(int cookTime) { this.cookTime = cookTime; }
    public void setIngredients(List<IngredientDTO> ingredients) { this.ingredients = ingredients; }
    public void setSteps(List<InstructionStepDTO> steps) { this.steps = steps; }
}
