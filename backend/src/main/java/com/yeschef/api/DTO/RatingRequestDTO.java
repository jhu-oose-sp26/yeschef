package com.yeschef.api.DTO;

public class RatingRequestDTO {
    private Long recipeId;
    private Long userId;
    private int tasteQuality;
    private int easeOfExecution;

    public Long getRecipeId() { return recipeId; }
    public Long getUserId() { return userId; }
    public int getTasteQuality() { return tasteQuality; }
    public int getEaseOfExecution() { return easeOfExecution; }

    public void setRecipeId(Long recipeId) { this.recipeId = recipeId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setTasteQuality(int tasteQuality) { this.tasteQuality = tasteQuality; }
    public void setEaseOfExecution(int easeOfExecution) { this.easeOfExecution = easeOfExecution; }
}
