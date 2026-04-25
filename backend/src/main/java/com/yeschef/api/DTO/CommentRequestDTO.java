package com.yeschef.api.DTO;

public class CommentRequestDTO {
    private Long postId;
    private Long userId;
    private String text;

    public Long getPostId() { return postId; }
    public Long getUserId() { return userId; }
    public String getText() { return text; }

    public void setPostId(Long postId) { this.postId = postId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setText(String text) { this.text = text; }
}
