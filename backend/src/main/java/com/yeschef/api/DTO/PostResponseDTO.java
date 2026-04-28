package com.yeschef.api.DTO;

import com.yeschef.api.DTO.RecipeResponseDTO;

public class PostResponseDTO {

    private Long id;
    private String image;
    private String notes;
    private RecipeResponseDTO recipe;

    public PostResponseDTO() {}

    public PostResponseDTO(Long id, String image, String notes, RecipeResponseDTO recipe) {
        this.id = id;
        this.image = image;
        this.notes = notes;
        this.recipe = recipe;
    }

    public Long getId() { return id; }
    public String getImage() { return image; }
    public String getNotes() { return notes; }
    public RecipeResponseDTO getRecipe() { return recipe; }

    public void setId(Long id) { this.id = id; }
    public void setImage(String image) { this.image = image; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setRecipe(RecipeResponseDTO recipe) { this.recipe = recipe; }
}