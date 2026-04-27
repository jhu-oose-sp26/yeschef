package com.yeschef.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

@Entity
@Table(
    name = "ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "recipe_id"}),
    indexes = @Index(name = "idx_ratings_recipe_id", columnList = "recipe_id")
)
public class Rating {
    
    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @ManyToOne // many ratings to one recipe
    @JoinColumn(name = "recipe_id", nullable=false)
    @JsonIgnore
    private Recipe recipe;

    @ManyToOne // many ratings to one user
    @JoinColumn(name = "user_id", nullable=false)
    @JsonIgnore
    private User user;

    @Column(nullable = false) // this column cannot be null
    private int tasteQuality;

    @Column(nullable = false) // this column cannot be null
    private int easeOfExecution;

    public Long getId() { return id; }
    public Recipe getRecipe() { return recipe; }
    public User getUser() { return user; }
    public int getTasteQuality() { return tasteQuality; }
    public int getEaseOfExecution() { return easeOfExecution; }

    public void setId(Long id) { this.id = id; }
    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public void setUser(User user) { this.user = user; }
    public void setTasteQuality(int tasteQuality) { this.tasteQuality = tasteQuality; }
    public void setEaseOfExecution(int easeOfExecution) { this.easeOfExecution = easeOfExecution; }
}
