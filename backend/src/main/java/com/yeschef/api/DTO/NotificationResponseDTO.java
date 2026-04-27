package com.yeschef.api.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public record NotificationResponseDTO(
    Long id,
    String actorUsername,
    String type,
    Long referenceId,
    Long postId,
    Long recipeId,
    String referenceTitle,
    @JsonProperty("isRead") boolean isRead,
    Instant createdAt
) {}
