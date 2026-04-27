package com.yeschef.api.DTO;

import java.time.Instant;

public record NotificationResponseDTO(
    Long id,
    String actorUsername,
    String type,
    Long referenceId,
    Long postId,
    Long recipeId,
    String referenceTitle,
    boolean isRead,
    Instant createdAt
) {}
