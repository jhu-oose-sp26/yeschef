package com.yeschef.api.model;

import java.util.List;

import jakarta.persistence.*;

@Entity
@Table(name="users")
public class User{

    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(nullable=false, unique=true)
    private String username;

    @OneToMany(mappedBy = "user") // this side does not own relationship. FK lives in RecipeSource entity in its field called user
    private List<RecipeSource> recipeSources;

    @OneToMany(mappedBy = "user")
    private List<HasLiked> likes;    

    @OneToMany(mappedBy = "user")
    private List<HasSaved> saves;    

    @OneToMany(mappedBy = "user")
    private List<Rating> ratings;   
}