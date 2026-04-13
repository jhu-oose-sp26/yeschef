package com.yeschef.api.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yeschef.api.model.HasLiked;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.HasLikedRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;

@RestController
@RequestMapping("/users/{userId}/liked")
@CrossOrigin(origins = "*")
public class HasLikedController {

    private final HasLikedRepository hasLikedRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;

    public HasLikedController(HasLikedRepository hasLikedRepository,
                              UserRepository userRepository,
                              RecipeRepository recipeRepository) {
        this.hasLikedRepository = hasLikedRepository;
        this.userRepository = userRepository;
        this.recipeRepository = recipeRepository;
    }

    // GET /users/{userId}/liked - returns all recipes liked by a user
    @GetMapping
    public ResponseEntity<List<HasLiked>> getLikedRecipes(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(hasLikedRepository.findByUser_Id(userId));
    }

    // POST /users/{userId}/liked/{recipeId} - like a recipe. Returns 409 if already liked.
    @PostMapping("/{recipeId}")
    public ResponseEntity<HasLiked> likeRecipe(@PathVariable Long userId, @PathVariable Long recipeId) {
        Optional<User> userMaybe = userRepository.findById(userId);
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Recipe> recipeMaybe = recipeRepository.findById(recipeId);
        if (recipeMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<HasLiked> existing = hasLikedRepository.findByUser_IdAndRecipe_Id(userId, recipeId);
        if (existing.isPresent()) {
            return ResponseEntity.status(409).build();
        }

        HasLiked hasLiked = new HasLiked();
        hasLiked.setUser(userMaybe.get());
        hasLiked.setRecipe(recipeMaybe.get());
        return ResponseEntity.ok(hasLikedRepository.save(hasLiked));
    }

    // DELETE /users/{userId}/liked/{recipeId} - unlike a recipe
    @DeleteMapping("/{recipeId}")
    public ResponseEntity<Void> unlikeRecipe(@PathVariable Long userId, @PathVariable Long recipeId) {
        Optional<HasLiked> hasLiked = hasLikedRepository.findByUser_IdAndRecipe_Id(userId, recipeId);
        if (hasLiked.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        hasLikedRepository.delete(hasLiked.get());
        return ResponseEntity.noContent().build();
    }
}
