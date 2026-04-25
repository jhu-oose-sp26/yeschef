package com.yeschef.api.DTO;

import java.time.Instant;

public class CommentResponseDTO {
    private Long id;
    private Long postId;
    private Long userId;
    private String text;
    private Instant createdAt;

    public CommentResponseDTO() {}

    public CommentResponseDTO(Long id, Long postId, Long userId, String text, Instant createdAt) {
        this.id = id;
        this.postId = postId;
        this.userId = userId;
        this.text = text;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getPostId() { return postId; }
    public Long getUserId() { return userId; }
    public String getText() { return text; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setPostId(Long postId) { this.postId = postId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setText(String text) { this.text = text; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
