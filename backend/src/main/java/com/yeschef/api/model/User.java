package com.yeschef.api.model;

import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name="users")
public class User{

    @Id // this is the primary ID
    @GeneratedValue(strategy = GenerationType.IDENTITY) // will auto-generate ID
    private Long id;

    @Column(name = "supabase_id", nullable = false, unique = true, columnDefinition = "uuid")
    private UUID supabaseId;

    @Column(nullable=false, unique=true)
    private String username;

    @OneToMany(mappedBy = "user") // this side does not own relationship. FK lives in RecipeSource entity in its field called user
    private List<RecipeSource> recipeSources;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true) 
    private List<HasLiked> likes;    

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HasSaved> saves;    

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Rating> ratings;
    @OneToMany(mappedBy = "self", cascade = CascadeType.ALL, orphanRemoval = true) 
    private List<Friendship> friendshipsSent;  

    @OneToMany(mappedBy = "friend", cascade = CascadeType.ALL, orphanRemoval = true)     
    private List<Friendship> friendshipsReceived;  

    // getters and setters
    public Long getId() { return id; }
    public UUID getSupabaseId() { return supabaseId; }
    public String getUsername() { return username; }
    public List<RecipeSource> getRecipeSources() { return recipeSources; }
    public List<HasLiked> getLikes() { return likes; }
    public List<HasSaved> getSaves() { return saves; }
    public List<Rating> getRatings() { return ratings; }
    public List<Friendship> getFriendships() {
        List<Friendship> temp = new java.util.ArrayList<>();
        if (friendshipsSent != null) {
            temp.addAll(friendshipsSent);
        }
        if (friendshipsReceived != null) {
            temp.addAll(friendshipsReceived);
        }
        return temp;
    }
    public List<Friendship> getFriendshipsSent() { return friendshipsSent; }

    public void setId(Long id) { this.id = id; }
    public void setSupabaseId(UUID supabaseId) { this.supabaseId = supabaseId; }
    public void setUsername(String username) { this.username = username; }
    public void setRecipeSources(List<RecipeSource> recipeSources) { this.recipeSources = recipeSources; }
    public void setLikes(List<HasLiked> likes) { this.likes = likes; }
    public void setSaves(List<HasSaved> saves) { this.saves = saves; }
    public void setRatings(List<Rating> ratings) { this.ratings = ratings; }
    public void setFriendshipsSent(List<Friendship> friendshipsSent) { this.friendshipsSent = friendshipsSent; }
}