package com.yeschef.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.List;

import com.yeschef.api.DTO.RecipeResponseDTO;
import com.yeschef.api.DTO.RecipeRequestDTO;
import com.yeschef.api.DTO.InstructionDTO.InstructionStepDTO;
import com.yeschef.api.model.Instruct;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.RecipeSourceRepository;

// This controller exposes REST endpoints related to recipes.
@RestController
@RequestMapping("/recipes") // base path for all recipe-related endpoints
public class RecipeController {

    // Spring injects an implementation of RecipeRepository at runtime.
    // We use this to talk to the database for Recipe entities.
    private final RecipeRepository recipeRepository;
    private final RecipeSourceRepository sourceRepository;

    // Constructor-based dependency injection tells Spring how to provide the repository.
    public RecipeController(RecipeRepository recipeRepository, RecipeSourceRepository sourceRepository) {
        this.recipeRepository = recipeRepository;
        this.sourceRepository = sourceRepository;
    }

    // convert recipe object to dto:
    private RecipeResponseDTO toDTO(Recipe recipe) {

        // stream to get all the ingredients
        List<RecipeResponseDTO.IngredientDTO> ingredients =
        recipe.getIngredients()
            .stream()
            .map(i -> new RecipeResponseDTO.IngredientDTO(
                    i.getIngredient(),
                    i.getQuantity()))
            .collect(Collectors.toList());

        // stream to get all the steps
        List<InstructionStepDTO> steps =
            recipe.getInstruction()
                    .getSteps()
                    .stream()
                    .map(s -> new InstructionStepDTO(
                            s.getStepNumber(),
                            s.getStepDescription()))
                    .collect(Collectors.toList());

        // return a dto object
        return new RecipeResponseDTO(
            recipe.getId(),
            recipe.getTitle(),
            recipe.getSource().getSourceType().toString(),
            recipe.getInstruction().getPrepTime(),
            recipe.getInstruction().getCookTime(),
            ingredients,
            steps);
        }

    // convert dto to recipe
    private Recipe toEntity(RecipeRequestDTO dto) {

        Recipe recipe = new Recipe();
        recipe.setTitle(dto.getTitle());

        // to generate a database id for the source
        RecipeSource source = new RecipeSource();
        source.setSourceTypeFromString(dto.getSourceType());
        source = sourceRepository.save(source); // persist to generate database id
        recipe.setSource(source);

        // stream for ingredients
        List<Recipe.Ingredient> ingredients =
                dto.getIngredients()
                        .stream()
                        .map(i -> new Recipe.Ingredient(
                                i.getIngredient(),
                                i.getQuantity()))
                        .collect(Collectors.toList());

        recipe.setIngredients(ingredients);

        // create instructions
        Instruct instruct = new Instruct();
        instruct.setPrepTime(dto.getPrepTime());
        instruct.setCookTime(dto.getCookTime());
        instruct.setRecipe(recipe);

        // stream for isntruction steps
        List<Instruct.InstructionStep> steps =
                dto.getSteps()
                        .stream()
                        .map(s -> new Instruct.InstructionStep(
                                s.getStepNumber(),
                                s.getStepDescription()))
                        .collect(Collectors.toList());

        instruct.setSteps(steps);

        recipe.setInstruction(instruct);

        return recipe;
    }

    // Handle GET requests to /recipes
    // Return one recipe by id
    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponseDTO> getRecipe(@PathVariable Long id) {
        // call repo to find recipe by id
        Optional<Recipe> recipeMaybe = recipeRepository.findById(id);
        // return recipe or null if not found
        if (recipeMaybe.isPresent()) {
            return ResponseEntity.ok(toDTO(recipeMaybe.get()));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Handle GET requests returning JSON of all recipes in database
    @GetMapping
    public ResponseEntity<List<RecipeResponseDTO>> getAllRecipes() {

        List<RecipeResponseDTO> recipes =
            recipeRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(recipes);
    }

    // Handle GET requests allowing for filtering by ingredient
    @GetMapping("/by-ingredient")
    public ResponseEntity<List<Recipe>> getByIngredient (@RequestParam String ingredient) {
        // call db query from the recipe repo and return list
        List<Recipe> recipesFiltered = recipeRepository.findByIngredient(ingredient);
        return ResponseEntity.ok(recipesFiltered);
    }

    // Handle GET requests allowing for filtering by ingredients
    @GetMapping("/by-ingredients")
    public ResponseEntity<List<Recipe>> getByIngredients (@RequestParam List<String> ingredientList) {
        // call db query from the recipe repo and return list
        List<Recipe> allFilteredRecipes = new ArrayList<Recipe>();
        for (String ingredient : ingredientList) {
            List<Recipe> recipesFiltered = recipeRepository.findByIngredient(ingredient);
            allFilteredRecipes.addAll(recipesFiltered);
        }
        return ResponseEntity.ok(allFilteredRecipes);
    }

    // Handle GET requests allowing for filtering by time
    // Done by summing the prep and cook time for a given recipe
    @GetMapping("/by-time")
    public ResponseEntity<List<Recipe>> getByTime(@RequestParam String maxTime) {
        int time = Integer.parseInt(maxTime);
        List<Recipe> recipesFiltered = recipeRepository.findByMaxTotalTime(time);
        return ResponseEntity.ok(recipesFiltered);
    }

    // Handles POST requests to /recipes
    // Expects a Recipe JSON in the request body, converts it to a Recipe entity, saves it to the database, and returns the saved Recipe.
    @PostMapping
    public ResponseEntity<RecipeResponseDTO> createRecipe(
        @RequestBody RecipeRequestDTO dto) {

        Recipe recipe = toEntity(dto);
        RecipeSource source = recipe.getSource();
        source.setSourceType(RecipeSource.SourceType.valueOf(dto.getSourceType()));
        // Take the Recipe from the request body, save it to the database, and return the saved version.
        Recipe saved = recipeRepository.save(recipe);

        return ResponseEntity.ok(toDTO(saved));
    }

    // Handles PUT requests to /recipes/{id}
    // Updates an existing recipe's title, source, instruction, and ingredients.
    // Ratings are managed separately and are not overwritten here.
    @PutMapping("/{id}")
    public ResponseEntity<Recipe> updateRecipe(@PathVariable Long id, @RequestBody Recipe updatedRecipe) {
        Optional<Recipe> recipeMaybe = recipeRepository.findById(id);
        if (recipeMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Recipe existing = recipeMaybe.get();
        existing.setTitle(updatedRecipe.getTitle());
        existing.setSource(updatedRecipe.getSource());
        existing.setInstruction(updatedRecipe.getInstruction());
        existing.setIngredients(updatedRecipe.getIngredients());

        Recipe saved = recipeRepository.save(existing);
        return ResponseEntity.ok(saved);
    }
    /*
   @PutMapping("/{id}")
    public ResponseEntity<RecipeResponseDTO> updateRecipe(
        @PathVariable Long id,
        @RequestBody RecipeRequestDTO dto) {

        Optional<Recipe> recipeMaybe = recipeRepository.findById(id);

        if (recipeMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Recipe recipe = recipeMaybe.get();

        recipe.setTitle(dto.getTitle());

        RecipeSource source =
            sourceRepository.findById(dto.getSourceId())
                .orElseThrow();

        recipe.setSource(source);

        List<Recipe.Ingredient> ingredients =
            dto.getIngredients()
                .stream()
                .map(i -> new Recipe.Ingredient(
                        i.getIngredient(),
                        i.getQuantity()))
                .toList();

        recipe.setIngredients(ingredients);

        Instruct instruct = recipe.getInstruction();

        instruct.setPrepTime(dto.getPrepTime());
        instruct.setCookTime(dto.getCookTime());

        List<Instruct.InstructionStep> steps =
            dto.getSteps()
                .stream()
                .map(s -> new Instruct.InstructionStep(
                        s.getStepNumber(),
                        s.getStepDescription()))
                .toList();

        instruct.setSteps(steps);

        Recipe saved = recipeRepository.save(recipe);

        return ResponseEntity.ok(toDTO(saved));
    }
    */

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

