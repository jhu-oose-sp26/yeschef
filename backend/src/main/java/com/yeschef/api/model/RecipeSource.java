package com.yeschef.api.model;

import jakarta.persistence.*;

@Entity
@Table(name ="recipe_source")
public class RecipeSource {

    public enum SourceType {
        API,
        USER
    }
    
    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name="source_type", nullable=false)
    private SourceType sourceType;

    @Column
    private String api_url;

    @ManyToOne
    @JoinColumn(name = "user_id") // create a column called user_id in table and it holds FK to referenced entity's PK
    private User user;
}