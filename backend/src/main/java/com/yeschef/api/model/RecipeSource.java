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

    // constructors
    public RecipeSource() {}

    public RecipeSource(SourceType sourceType, String api_url, User user) {
        this.sourceType = sourceType;
        this.api_url = api_url;
        this.user = user;
    }

    // getters and setters
    public Long getId() {
        return id;
    }

    public SourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(SourceType sourceType) {
        this.sourceType = sourceType;
    }

    public String getApi_url() {
        return api_url;
    }

    public void setApi_url(String api_url) {
        this.api_url = api_url;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}