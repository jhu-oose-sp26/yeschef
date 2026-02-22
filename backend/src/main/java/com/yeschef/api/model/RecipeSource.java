package com.yeschef.api.model;

import jakarta.persistence.*;

@Entity
@Table(name ="recipe_source")
public class RecipeSource {
    
    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(nullable = false) // this column cannot be null
    private String name;
}