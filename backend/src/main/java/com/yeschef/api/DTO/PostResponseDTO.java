package com.yeschef.api.DTO;

import com.yeschef.api.DTO.RecipeResponseDTO;

public class PostResponseDTO {

    private Long id;
    private String image;
    private RecipeResponseDTO recipe;

    public PostResponseDTO() {}

    public PostResponseDTO(Long id, String image, RecipeResponseDTO recipe) {
        this.id = id;
        this.image = image;
        this.recipe = recipe;
    }

    public Long getId() { return id; }
    public String getImage() { return image; }
    public RecipeResponseDTO getRecipe() { return recipe; }

    public void setId(Long id) { this.id = id; }
    public void setImage(String image) { this.image = image; }
    public void setRecipe(RecipeResponseDTO recipe) { this.recipe = recipe; }
}