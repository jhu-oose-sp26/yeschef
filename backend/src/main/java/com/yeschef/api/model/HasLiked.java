package com.yeschef.api.model;

import jakarta.persistence.*;

@Entity
@Table(
    name="has_liked",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "recipe_id"}) // one (user_id, recipe_id) pair can only appear once
)
public class HasLiked{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;
}