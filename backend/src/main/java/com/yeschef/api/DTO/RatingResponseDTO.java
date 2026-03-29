package com.yeschef.api.DTO;

public class RatingResponseDTO {
    private Long id;
    private Long recipeId;
    private Long userId;
    private int tasteQuality;
    private int easeOfExecution;

    public RatingResponseDTO() {}

    public RatingResponseDTO(
            Long id,
            Long recipeId,
            Long userId,
            int tasteQuality,
            int easeOfExecution) {
        this.id = id;
        this.recipeId = recipeId;
        this.userId = userId;
        this.tasteQuality = tasteQuality;
        this.easeOfExecution = easeOfExecution;
    }

    public Long getId() { return id; }
    public Long getRecipeId() { return recipeId; }
    public Long getUserId() { return userId; }
    public int getTasteQuality() { return tasteQuality; }
    public int getEaseOfExecution() { return easeOfExecution; }

    public void setId(Long id) { this.id = id; }
    public void setRecipeId(Long recipeId) { this.recipeId = recipeId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setTasteQuality(int tasteQuality) { this.tasteQuality = tasteQuality; }
    public void setEaseOfExecution(int easeOfExecution) { this.easeOfExecution = easeOfExecution; }
}
