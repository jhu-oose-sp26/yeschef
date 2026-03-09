package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.HasSaved;

public interface HasSavedRepository extends JpaRepository<HasSaved, Long> {

    // Get all saved entries for a given user
    List<HasSaved> findByUserId(Long userId);

    // Find a specific save entry by user and recipe (used to check duplicates and for deletion)
    Optional<HasSaved> findByUserIdAndRecipeId(Long userId, Long recipeId);
}
