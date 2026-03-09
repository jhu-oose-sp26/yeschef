package com.yeschef.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;
}