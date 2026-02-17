package com.yeschef.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yeschef.api.repository.RecipeRepository;

// This controller exposes REST endpoints related to recipes.
@RestController
@RequestMapping("/recipes") // base path for all recipe-related endpoints
public class RecipeController {

    // Spring injects an implementation of RecipeRepository at runtime.
    // We use this to talk to the database for Recipe entities.
    private final RecipeRepository recipeRepository;

    // Constructor-based dependency injection tells Spring how to provide the repository.
    public RecipeController(RecipeRepository recipeRepository) {
        this.recipeRepository = recipeRepository;
    }



    // Handles DELETE requests to /recipes/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        // First check if a recipe with this ID actually exists.
        // If it doesn't, we return a 404 Not Found response.
        if (!recipeRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // If it does exist, delete it from the database.
        // Because of JPA cascade settings on Recipe, related entities like ratings/instructions/ingredients will also be cleaned up.
        recipeRepository.deleteById(id);

        // Return 204 No Content to indicate the delete succeeded  and there is no response body to send back.
        return ResponseEntity.noContent().build();
    }
}

