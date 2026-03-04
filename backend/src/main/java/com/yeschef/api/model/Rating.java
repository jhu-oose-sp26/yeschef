package com.yeschef.api.model;

import jakarta.persistence.*;

@Entity
@Table(
    name ="ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "recipe_id"})
)
public class Rating {
    
    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @ManyToOne // many ratings to one recipe
    @JoinColumn(name = "recipe_id", nullable=false)
    private Recipe recipe;

    @ManyToOne // many ratings to one user
    @JoinColumn(name = "user_id", nullable=false)
    private User user;

    @Column(nullable = false) // this column cannot be null
    private int tasteQuality;

    @Column(nullable = false) // this column cannot be null
    private int easeOfExecution;
}