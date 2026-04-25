package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.Post;

public interface PostRepository extends JpaRepository<Post, Long> {

    // Find a post by its associated recipe ID (1-to-1 relationship)
    Optional<Post> findByRecipeId(Long recipeId);

    // (Optional but recommended for performance later)
    List<Post> findByRecipe_IdIn(List<Long> recipeIds);

    List<Post> findByRecipe_Ingredients_IngredientIgnoreCase(String ingredient);

    List<Post> findByRecipe_Instruction_PrepTimePlusCookTimeLessThanEqual(int maxTime);

    List<Post> findByRecipe_TitleContainingIgnoreCase(String name);
}

