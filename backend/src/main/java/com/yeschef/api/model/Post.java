package com.yeschef.api.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "posts",
    uniqueConstraints = @UniqueConstraint(columnNames = "recipe_id")
)
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 
    
    @OneToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    private String image;

    public void setRecipe(Recipe recipe) {
        this.recipe = recipe;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public void setId(Long id) { this.id = id; }

    public Long getId() {
        return this.id;
    }

    public Recipe getRecipe() {
        return this.recipe;
    }

    public String getImage() {
        return this.image;
    }
}

