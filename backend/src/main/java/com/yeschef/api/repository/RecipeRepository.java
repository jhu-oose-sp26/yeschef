package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    /** Load recipes with source, instruction, instruction steps, and ingredients in bulk to avoid N+1 queries. */
    @Override
    @EntityGraph(attributePaths = { "source", "instruction", "instruction.steps", "ingredients" })
    List<Recipe> findAll();

    /** Load a single recipe with all related data to avoid lazy-load queries when serializing. */
    @Override
    @EntityGraph(attributePaths = { "source", "instruction", "instruction.steps", "ingredients" })
    java.util.Optional<Recipe> findById(Long id);

    // find a recipe by its source id
    List<Recipe> findBySourceId(Long sourceId);

    @EntityGraph(attributePaths = {"source", "instruction", "instruction.steps", "ingredients"})
    List<Recipe> findBySourceIn(List<RecipeSource> sources);

    // Single IN query replacing the N-query loop in /recipes/by-ingredients
    @Query("""
        SELECT DISTINCT r FROM Recipe r
        JOIN r.ingredients i
        WHERE LOWER(i.ingredient) IN :lowerIngredients
        """)
    @EntityGraph(attributePaths = {"source", "instruction", "instruction.steps", "ingredients"})
    List<Recipe> findByIngredients(@Param("lowerIngredients") List<String> lowerIngredients);

    // FILTERING:
    // Query to get the time it takes to make a recipe by summing prep time and cooktime
    @EntityGraph(attributePaths = {
        "source",
        "instruction",
        "instruction.steps",
        "ingredients"
    })
    @Query("""
    SELECT r
    FROM Recipe r
    JOIN r.instruction i
    WHERE (i.prepTime + i.cookTime) <= :maxTime
    """)
    List<Recipe> findByMaxTotalTime(@Param("maxTime") int maxTime);

    // Get all recipes that contain a certain ingredient
    /*
    @Query("""
    SELECT DISTINCT r
    FROM Recipe r
    JOIN r.ingredients i
    WHERE LOWER(i.ingredient) LIKE LOWER(CONCAT('%', :ingredient, '%'))
    """)
    List<Recipe> findByIngredient(@Param("ingredient") String ingredient);
    */
   @Query(value = """
    SELECT DISTINCT r.*
    FROM recipes r
    JOIN ingredients i ON r.id = i.recipe_id
    WHERE LOWER(i.ingredient) ~ ('\\y' || LOWER(:ingredient) || '\\y')
    """, nativeQuery = true)
    List<Recipe> findByIngredient(@Param("ingredient") String ingredient);

    @Query("""
    SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
    FROM Recipe r
    JOIN r.source s
    WHERE LOWER(r.title) = LOWER(:title)
      AND s.api_url = :apiUrl
    """)
    boolean existsByTitleAndSourceApiUrl(@Param("title") String title, @Param("apiUrl") String apiUrl);

    @Query("""
    SELECT r
    FROM Recipe r
    WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :name, '%'))
    """)
    List<Recipe> findByName(@Param("name") String name);

    Optional<Recipe> findByTitleIgnoreCase(String title);

    // Single query replacing the two-step source-lookup in UserController.getUserRecipes
    @Query("SELECT r FROM Recipe r JOIN r.source s WHERE s.user.id = :userId")
    List<Recipe> findByUserId(@Param("userId") Long userId);

    // Single query replacing the in-memory friends traversal in UserController.getFriendsRecipes
    @Query("""
        SELECT DISTINCT r FROM Recipe r JOIN r.source s
        WHERE s.user IN (SELECT f.friend FROM Friendship f WHERE f.self.id = :userId)
        """)
    List<Recipe> findByFriendsOf(@Param("userId") Long userId);

    // Single query replacing the in-memory likes traversal in UserController.getFriendsLikedRecipes
    @Query("""
        SELECT DISTINCT hl.recipe FROM HasLiked hl
        WHERE hl.user IN (SELECT f.friend FROM Friendship f WHERE f.self.id = :userId)
        """)
    List<Recipe> findLikedByFriendsOf(@Param("userId") Long userId);
}

