package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.HasSaved;

public interface HasSavedRepository extends JpaRepository<HasSaved, Long> {

    // Get all saved entries for a given user (user_Id = id of the User relation)
    List<HasSaved> findByUser_Id(Long userId);

    // Find a specific save entry by user and recipe ids (used to check duplicates and for deletion)
    Optional<HasSaved> findByUser_IdAndRecipe_Id(Long userId, Long recipeId);
}
