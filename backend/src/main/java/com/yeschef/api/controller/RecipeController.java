package com.yeschef.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.List;

import com.yeschef.api.model.Recipe;
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

    // Handle GET requests to /recipes
    // Return one recipe by id
    @GetMapping("/{id}")
    public ResponseEntity<Recipe> getRecipe(@PathVariable Long id) {
        // call repo to find recipe by id
        Optional<Recipe> recipeMaybe = recipeRepository.findById(id);
        // return recipe or null if not found
        if (recipeMaybe.isPresent()) {
            return ResponseEntity.ok(recipeMaybe.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        // call repo to return all recipes from database and return
        List<Recipe> recipes = recipeRepository.findAll();
        return ResponseEntity.ok(recipes);
    }

    // Handles POST requests to /recipes
    // Expects a Recipe JSON in the request body, converts it to a Recipe entity, saves it to the database, and returns the saved Recipe.
    @PostMapping
    public ResponseEntity<Recipe> createRecipe(@RequestBody Recipe recipe) {
        // Take the Recipe from the request body, save it to the database, and return the saved version.
        Recipe savedRecipe = recipeRepository.save(recipe);
        return ResponseEntity.ok(savedRecipe);
    } //will double check that these correctly reflect in db once added in supabase

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
    } //will double check that these correctly reflect in db once added in supabase
}

