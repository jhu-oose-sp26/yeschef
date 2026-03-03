package com.yeschef.api.model;

import jakarta.persistence.*;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// import org.hibernate.annotations.JdbcTypeCode;
// import org.hibernate.type.SqlTypes;

@Entity
@Table(name ="recipes")
public class Recipe {
    
    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(nullable = false) // this column cannot be null
    private String title;

    @ManyToOne // because many recipes can point to the same source
    @JoinColumn(name = "source_id", nullable=false) // tells Hibernate to create a foreign key column
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RecipeSource source;

    // one recipe has many ratings
    @OneToMany(mappedBy="recipe", cascade = CascadeType.ALL, orphanRemoval = true) // deleting a recipe deletes its ratings
    private List<Rating> ratings;

    @OneToOne(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Instruct instruction;

    // one recipe can have many likes
    @OneToMany(mappedBy="recipe", cascade = CascadeType.ALL, orphanRemoval = true) // deleting a recipe deletes its likes
    private List<HasLiked> hasLiked;

    // one recipe can have many saves
    @OneToMany(mappedBy="recipe", cascade = CascadeType.ALL, orphanRemoval = true) // deleting a recipe deletes its likes
    private List<HasSaved> hasSaved;

    // child Ingredient object
    @Embeddable
    public static class Ingredient {
        @Column(name = "ingredient", nullable = false)
        private String ingredient;

        @Column(name = "quantity", nullable = true)
        private String quantity;

        public Ingredient() {}

        public Ingredient(String ingredient, String quantity) {
            this.ingredient = ingredient;
            this.quantity = quantity;
        }
        public String getIngredient() { return ingredient; }
        public String getQuantity() { return quantity; }

        public void setIngredient(String ingredient) { this.ingredient = ingredient; }
        public void setQuantity(String quantity) { this.quantity = quantity; }
        
    }
    
    @ElementCollection
    @CollectionTable(name = "ingredients", joinColumns = @JoinColumn(name="recipe_id", nullable=false))
    @OrderColumn(name="line_number")
    private List<Ingredient> ingredients;


    public Long getId() { return id; }
    public String getTitle() { return title; }
    public RecipeSource getSource() { return source; }
    public List<Rating> getRatings() { return ratings; }
    public Instruct getInstruction() { return instruction; }
    public List<HasLiked> getLikes() { return hasLiked; }
    public List<HasSaved> getSaves() { return hasSaved; }
    public List<Ingredient> getIngredients() { return ingredients; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setSource(RecipeSource source) { this.source = source; }
    public void setRatings(List<Rating> ratings) { this.ratings = ratings; }
    public void setInstruction(Instruct instruction) { this.instruction = instruction; }
    public void setLikes(List<HasLiked> likes) { this.hasLiked = likes;}
    public void setSaves(List<HasSaved> saves) { this.hasSaved = saves;}
    public void setIngredients(List<Ingredient> ingredients) { this.ingredients = ingredients; }
}