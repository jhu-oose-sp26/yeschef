package com.yeschef.api.model;

import java.time.Instant;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

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

    public void setId(Long id) { this.id = id; }

    public Long getId() {
        return this.id;
    }
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = Instant.now();
    }

    public void setRecipe(Recipe recipe) { this.recipe = recipe; }
    public void setImage(String image) { this.image = image; }

    public Recipe getRecipe() { return this.recipe; }
    public String getImage() { return this.image; }
    public List<Comment> getComments() { return comments; }
    public Instant getCreatedAt() { return createdAt; }
}