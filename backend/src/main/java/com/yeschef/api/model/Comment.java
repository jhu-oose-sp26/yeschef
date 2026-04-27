package com.yeschef.api.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "comments",
    indexes = {
        @Index(name = "idx_comments_user_id", columnList = "user_id"),
        @Index(name = "idx_comments_post_id", columnList = "post_id")
    }
)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String text;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private Post post;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getText() { return text; }
    public User getUser() { return user; }
    public Post getPost() { return post; }
    public Instant getCreatedAt() { return createdAt; }

    public void setText(String text) { this.text = text; }
    public void setUser(User user) { this.user = user; }
    public void setPost(Post post) { this.post = post; }
}
