package com.yeschef.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.yeschef.api.model.Recipe;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    // FILTERING:
    // Query to get the time it takes to make a recipe by summing prep time and cooktime
    @Query("""
        SELECT r
        FROM Recipe r
        JOIN r.instruction i
        WHERE (i.prepTime + i.cookTime) <= :maxTime
    """)
    // Used by filtering where maxTime will be a filter parameter -> used to return
    // all recipes under a certain number of minutes
    List<Recipe> findByMaxTotalTime(@Param("maxTime") int maxTime);

    // Get all recipes that contain a certain ingredient
    @Query("""
    SELECT DISTINCT r
    FROM Recipe r
    JOIN r.ingredients ing
    WHERE LOWER(ing) = LOWER(:ingredient)
    """)
    List<Recipe> findByIngredient(@Param("ingredient") String ingredient);

    @Query("""
    SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
    FROM Recipe r
    JOIN r.source s
    WHERE LOWER(r.title) = LOWER(:title)
      AND s.api_url = :apiUrl
    """)
    boolean existsByTitleAndSourceApiUrl(@Param("title") String title, @Param("apiUrl") String apiUrl);
}

