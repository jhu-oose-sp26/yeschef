package com.yeschef.api.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yeschef.api.DTO.RatingRequestDTO;
import com.yeschef.api.DTO.RatingResponseDTO;
import com.yeschef.api.model.Rating;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.RatingRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.service.AuthenticatedUserService;
import com.yeschef.api.service.NotificationService;
import com.yeschef.api.model.Notification;

@RestController
@RequestMapping("/ratings")
@CrossOrigin(origins = "*")
public class RatingController {

    private final RatingRepository ratingRepository;
    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final NotificationService notificationService;

    public RatingController(RatingRepository ratingRepository,
                            RecipeRepository recipeRepository,
                            UserRepository userRepository,
                            AuthenticatedUserService authenticatedUserService,
                            NotificationService notificationService) {
        this.ratingRepository = ratingRepository;
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
        this.authenticatedUserService = authenticatedUserService;
        this.notificationService = notificationService;
    }

    private RatingResponseDTO toDTO(Rating rating) {
        return new RatingResponseDTO(
            rating.getId(),
            rating.getRecipe().getId(),
            rating.getUser().getId(),
            rating.getTasteQuality(),
            rating.getEaseOfExecution());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RatingResponseDTO> getRating(@PathVariable Long id) {
        Optional<Rating> ratingMaybe = ratingRepository.findById(id);
        if (ratingMaybe.isPresent()) {
            return ResponseEntity.ok(toDTO(ratingMaybe.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/recipe/{recipeId}")
    public ResponseEntity<List<RatingResponseDTO>> getRatingsByRecipe(@PathVariable Long recipeId) {
        if (!recipeRepository.existsById(recipeId)) {
            return ResponseEntity.notFound().build();
        }

        List<RatingResponseDTO> ratings = ratingRepository.findByRecipe_Id(recipeId)
            .stream()
            .map(this::toDTO)
            .toList();

        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RatingResponseDTO>> getRatingsByUser(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        List<RatingResponseDTO> ratings = ratingRepository.findByUser_Id(userId)
            .stream()
            .map(this::toDTO)
            .toList();

        return ResponseEntity.ok(ratings);
    }

    @GetMapping("/user/{userId}/recipe/{recipeId}")
    public ResponseEntity<RatingResponseDTO> getRatingByUserAndRecipe(@PathVariable Long userId,
                                                                      @PathVariable Long recipeId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        if (!recipeRepository.existsById(recipeId)) {
            return ResponseEntity.notFound().build();
        }

        Optional<Rating> ratingMaybe = ratingRepository.findByUser_IdAndRecipe_Id(userId, recipeId);
        if (ratingMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(toDTO(ratingMaybe.get()));
    }

    @PostMapping
    public ResponseEntity<RatingResponseDTO> createRating(@RequestBody RatingRequestDTO dto) {
        User currentUser = authenticatedUserService.requireCurrentUser(dto.getUserId());
        Optional<Recipe> recipeMaybe = recipeRepository.findById(dto.getRecipeId());
        if (recipeMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Rating> existing = ratingRepository.findByUser_IdAndRecipe_Id(dto.getUserId(), dto.getRecipeId());
        if (existing.isPresent()) {
            return ResponseEntity.status(409).build();
        }
        Recipe recipe = recipeMaybe.get();

        Rating rating = new Rating();
        rating.setRecipe(recipeMaybe.get());
        rating.setUser(currentUser);
        rating.setTasteQuality(dto.getTasteQuality());
        rating.setEaseOfExecution(dto.getEaseOfExecution());

        Rating saved = ratingRepository.save(rating);

        // notify
        User actor = currentUser;
        User recipient = null;

        if (recipe.getSource() != null) {
            recipient = recipe.getSource().getUser();
        }

        if (recipient != null) {
            notificationService.createNotification(
                recipient,
                actor,
                Notification.Type.RATING,
                recipe.getId()
            );
        }
        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RatingResponseDTO> updateRating(@PathVariable Long id, @RequestBody RatingRequestDTO dto) {
        Optional<Rating> ratingMaybe = ratingRepository.findById(id);
        if (ratingMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        authenticatedUserService.requireCurrentUser(dto.getUserId());
        if (!ratingMaybe.get().getUser().getId().equals(dto.getUserId())) {
            return ResponseEntity.status(403).build();
        }

        Optional<Recipe> recipeMaybe = recipeRepository.findById(dto.getRecipeId());
        if (recipeMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Rating> duplicate = ratingRepository.findByUser_IdAndRecipe_Id(dto.getUserId(), dto.getRecipeId());
        if (duplicate.isPresent() && !duplicate.get().getId().equals(id)) {
            return ResponseEntity.status(409).build();
        }

        Rating existing = ratingMaybe.get();
        existing.setRecipe(recipeMaybe.get());
        existing.setTasteQuality(dto.getTasteQuality());
        existing.setEaseOfExecution(dto.getEaseOfExecution());

        Rating saved = ratingRepository.save(existing);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable Long id) {
        Optional<Rating> ratingMaybe = ratingRepository.findById(id);
        if (ratingMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        authenticatedUserService.requireCurrentUser(ratingMaybe.get().getUser().getId());
        ratingRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
