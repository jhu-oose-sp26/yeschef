package com.yeschef.api.model;

import jakarta.persistence.*;
import java.util.List;

// import org.hibernate.annotations.JdbcTypeCode;
// import org.hibernate.type.SqlTypes;

@Entity
@Table(name ="RECIPES")
public class Recipe {
    
    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(nullable = false) // this column cannot be null
    private String title;

    @ManyToOne // because many recipes can point to the same source
    @JoinColumn(name = "source_id") // tells Hibernate to create a foreign key column
    private RecipeSource source;

    // one recipe has many ratings
    @OneToMany(mappedBy="recipe", cascade = CascadeType.ALL, orphanRemoval = true) // deleting a recipe deletes its ratings
    private List<Rating> ratings;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "instruction_id")
    private Instruct instruction;

    @ElementCollection
    // creating a separate table to store ingredients
    @CollectionTable(name = "ingredients",joinColumns = @JoinColumn(name = "recipe_id"))
    // ingredients table has two columns, recipe_id and ingredient
    @Column(name = "ingredient", nullable = false)
    private List<String> ingredients;
}