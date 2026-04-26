package com.yeschef.api.DTO;

public class PostRequestDTO {
    private String image;
    private String notes;
    private RecipeRequestDTO recipe;

    public String getImage() {return image;}
    public String getNotes() {return notes;}
    public RecipeRequestDTO getRecipe() {return recipe;}
}
