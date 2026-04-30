package com.yeschef.api.DTO;

import java.time.Instant;

public record NotificationResponseDTO(
    Long id,
    Long actorId,
    String actorUsername,
    String type,
    Long referenceId,
    Long recipeId,
    String referenceTitle,
    boolean isRead,
    Instant createdAt
) {}
