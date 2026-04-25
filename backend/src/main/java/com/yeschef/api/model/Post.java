package com.yeschef.api.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.List;

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

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = Instant.now();
    }

    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public void setImage(String image) { this.image = image; }

    public Long getId() { return this.id; }
    public Recipe getRecipe() { return this.recipe; }
    public String getImage() { return this.image; }
    public List<Comment> getComments() { return comments; }
    public Instant getCreatedAt() { return createdAt; }
}