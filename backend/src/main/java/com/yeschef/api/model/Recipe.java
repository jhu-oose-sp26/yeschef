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
    @JoinColumn(name = "source_id") // tells Hibernate to create a foreign key column
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private RecipeSource source;

    // one recipe has many ratings
    @OneToMany(mappedBy="recipe", cascade = CascadeType.ALL, orphanRemoval = true) // deleting a recipe deletes its ratings
    private List<Rating> ratings;

    @OneToOne(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Instruct instruction;

    @ElementCollection
    // creating a separate table to store ingredients
    @CollectionTable(name = "ingredients",joinColumns = @JoinColumn(name = "recipe_id"))
    // ingredients table has two columns, recipe_id and ingredient
    @Column(name = "ingredient", nullable = false)
    private List<String> ingredients;


    public Long getId() { return id; }
    public String getTitle() { return title; }
    public RecipeSource getSource() { return source; }
    public List<Rating> getRatings() { return ratings; }
    public Instruct getInstruction() { return instruction; }
    public List<String> getIngredients() { return ingredients; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setSource(RecipeSource source) { this.source = source; }
    public void setRatings(List<Rating> ratings) { this.ratings = ratings; }
    public void setInstruction(Instruct instruction) { this.instruction = instruction; }
    public void setIngredients(List<String> ingredients) { this.ingredients = ingredients; }
}