package com.yeschef.api.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yeschef.api.model.HasSaved;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.HasSavedRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;

// This controller exposes REST endpoints for saving and unsaving recipes per user.
@RestController
@RequestMapping("/users/{userId}/saved")
public class HasSavedController {

    private final HasSavedRepository hasSavedRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

    public HasSavedController(HasSavedRepository hasSavedRepository,
                              UserRepository userRepository,
                              RecipeRepository recipeRepository) {
        this.hasSavedRepository = hasSavedRepository;
        this.userRepository = userRepository;
        this.recipeRepository = recipeRepository;
    }

    // Handle GET requests to /users/{userId}/saved
    // Returns all recipes saved by a given user
    @GetMapping
    public ResponseEntity<List<HasSaved>> getSavedRecipes(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        List<HasSaved> saved = hasSavedRepository.findByUserId(userId);
        return ResponseEntity.ok(saved);
    }

    // Handle POST requests to /users/{userId}/saved/{recipeId}
    // Saves a recipe for a user. Returns 409 if already saved.
    @PostMapping("/{recipeId}")
    public ResponseEntity<HasSaved> saveRecipe(@PathVariable Long userId, @PathVariable Long recipeId) {
        Optional<User> userMaybe = userRepository.findById(userId);
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Recipe> recipeMaybe = recipeRepository.findById(recipeId);
        if (recipeMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Check if the user already saved this recipe
        Optional<HasSaved> existing = hasSavedRepository.findByUserIdAndRecipeId(userId, recipeId);
        if (existing.isPresent()) {
            return ResponseEntity.status(409).build();
        }

        HasSaved hasSaved = new HasSaved();
        hasSaved.setUser(userMaybe.get());
        hasSaved.setRecipe(recipeMaybe.get());
        return ResponseEntity.ok(hasSavedRepository.save(hasSaved));
    }

    // Handle DELETE requests to /users/{userId}/saved/{recipeId}
    // Unsaves a recipe for a user. Returns 404 if the save entry doesn't exist.
    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> unsaveRecipe(@PathVariable Long userId, @PathVariable Long recipeId) {
        Optional<HasSaved> hasSaved = hasSavedRepository.findByUserIdAndRecipeId(userId, recipeId);
        if (hasSaved.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        hasSavedRepository.delete(hasSaved.get());
        return ResponseEntity.noContent().build();
    }

    // no update function because only user_id and recipe_id are a part of this... nothing that can be updated directly
}
