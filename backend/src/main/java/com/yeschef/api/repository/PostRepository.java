package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.yeschef.api.model.Post;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Override
    @EntityGraph(attributePaths = {"recipe", "recipe.source", "recipe.instruction"})
    List<Post> findAll();

    @Override
    @EntityGraph(attributePaths = {"recipe", "recipe.source", "recipe.instruction"})
    Optional<Post> findById(Long id);

    @EntityGraph(attributePaths = {"recipe", "recipe.source", "recipe.instruction"})
    Optional<Post> findFirstByRecipeId(Long recipeId);

    @EntityGraph(attributePaths = {"recipe", "recipe.source", "recipe.instruction"})
    List<Post> findByRecipe_IdIn(List<Long> recipeIds);

    @EntityGraph(attributePaths = {"recipe", "recipe.source", "recipe.instruction"})
    List<Post> findByRecipe_TitleContainingIgnoreCase(String name);

    // Explicit JOIN FETCH because the derived-query join on ingredients conflicts with EntityGraph
    @Query("""
        SELECT DISTINCT p FROM Post p
        JOIN FETCH p.recipe r
        JOIN FETCH r.source
        JOIN FETCH r.instruction
        JOIN r.ingredients i
        WHERE LOWER(i.ingredient) = LOWER(:ingredient)
        """)
    List<Post> findByRecipe_Ingredients_IngredientIgnoreCase(@Param("ingredient") String ingredient);

    @Query("""
        SELECT p FROM Post p
        JOIN FETCH p.recipe r
        JOIN FETCH r.source
        JOIN FETCH r.instruction i
        WHERE (i.prepTime + i.cookTime) <= :maxTime
        """)
    List<Post> findByTotalTimeLessThanEqual(@Param("maxTime") int maxTime);

    // Single query for the home feed: only posts from friends of the given user,
    // with recipe creator username eagerly loaded so the client gets it without extra calls.
    @Query("""
        SELECT p FROM Post p
        JOIN FETCH p.recipe r
        JOIN FETCH r.source s
        JOIN FETCH s.user
        JOIN FETCH r.instruction
        WHERE s.user IN (SELECT f.friend FROM Friendship f WHERE f.self.id = :userId)
        """)
    List<Post> findByFriendsOf(@Param("userId") Long userId);
}
