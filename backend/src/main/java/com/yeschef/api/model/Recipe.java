package com.yeschef.api.model;

import jakarta.persistence.*;
// import java.util.List;
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
}