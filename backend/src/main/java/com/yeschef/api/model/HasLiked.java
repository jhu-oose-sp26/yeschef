package com.yeschef.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(
    name="has_liked",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "recipe_id"}) // one (user_id, recipe_id) pair can only appear once
)
public class HasLiked{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Recipe getRecipe() { return recipe; }

    /** Exposed for API responses so clients get recipeId without loading full recipe. */
    public Long getRecipeId() {
        return recipe != null ? recipe.getId() : null;
    }

    public void setUser(User user) { this.user = user; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
}