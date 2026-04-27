package com.yeschef.api.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yeschef.api.DTO.NotificationResponseDTO;
import com.yeschef.api.model.Notification;
import com.yeschef.api.model.Post;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.NotificationRepository;
import com.yeschef.api.repository.PostRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.service.AuthenticatedUserService;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final RecipeRepository recipeRepository;
    private final PostRepository postRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public NotificationController(NotificationRepository notificationRepository,
                                  RecipeRepository recipeRepository,
                                  PostRepository postRepository,
                                  AuthenticatedUserService authenticatedUserService) {
        this.notificationRepository = notificationRepository;
        this.recipeRepository = recipeRepository;
        this.postRepository = postRepository;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponseDTO>> getNotifications(@PathVariable Long userId) {
        User currentUser = authenticatedUserService.requireCurrentUser(userId);
        List<NotificationResponseDTO> notifications = notificationRepository
            .findByRecipientOrderByCreatedAtDesc(currentUser)
            .stream()
            .map(this::toDTO)
            .toList();
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<Void> markAllRead(@PathVariable Long userId) {
        User currentUser = authenticatedUserService.requireCurrentUser(userId);
        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser);
        boolean changed = false;
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                changed = true;
            }
        }
        if (changed) {
            notificationRepository.saveAll(notifications);
        }
        return ResponseEntity.noContent().build();
    }

    private NotificationResponseDTO toDTO(Notification notification) {
        Long postId = null;
        Long recipeId = null;
        String referenceTitle = null;

        if (notification.getType() == Notification.Type.COMMENT && notification.getReferenceId() != null) {
            Optional<Post> postMaybe = postRepository.findById(notification.getReferenceId());
            if (postMaybe.isPresent() && postMaybe.get().getRecipe() != null) {
                postId = postMaybe.get().getId();
                recipeId = postMaybe.get().getRecipe().getId();
                referenceTitle = postMaybe.get().getRecipe().getTitle();
            }
        } else if ((notification.getType() == Notification.Type.RATING
                || notification.getType() == Notification.Type.LIKED
                || notification.getType() == Notification.Type.SAVED)
                && notification.getReferenceId() != null) {
            Optional<Recipe> recipeMaybe = recipeRepository.findById(notification.getReferenceId());
            if (recipeMaybe.isPresent()) {
                recipeId = recipeMaybe.get().getId();
                referenceTitle = recipeMaybe.get().getTitle();
                Optional<Post> postMaybe = postRepository.findByRecipeId(recipeId);
                if (postMaybe.isPresent()) {
                    postId = postMaybe.get().getId();
                }
            }
        }

        return new NotificationResponseDTO(
            notification.getId(),
            notification.getActor().getUsername(),
            notification.getType().name(),
            notification.getReferenceId(),
            postId,
            recipeId,
            referenceTitle,
            notification.isRead(),
            notification.getCreatedAt()
        );
    }
}
