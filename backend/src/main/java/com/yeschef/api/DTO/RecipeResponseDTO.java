package com.yeschef.api.DTO;

import java.util.ArrayList;

public class RecipeResponseDTO {
    private Long id;
    private String title;
    private String source;
    private String instruction;
    private ArrayList<IngredientDTO> ingredients;

    public static class IngredientDTO {
        private String ingredient;
        private String quantity;

        public String getIngredient() { return ingredient; }
        public String getQuantity() { return quantity; }

        public void setIngredient(String ingredient) { this.ingredient = ingredient; }
        public void setQuantity(String quantity) { this.quantity = quantity; }
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getSource() { return source; }
    public String getInstruction() { return instruction; }
    public ArrayList<IngredientDTO> getIngredients() { return ingredients; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setSource(String source) { this.source = source; }
    public void setInstruction(String instruction) { this.instruction = instruction; }
    public void setIngredients(ArrayList<IngredientDTO> ingredients) { this.ingredients = ingredients; }
}
