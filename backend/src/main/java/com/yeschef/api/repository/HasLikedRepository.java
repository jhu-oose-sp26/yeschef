package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.HasLiked;

public interface HasLikedRepository extends JpaRepository<HasLiked, Long> {

    List<HasLiked> findByUser_Id(Long userId);

    Optional<HasLiked> findByUser_IdAndRecipe_Id(Long userId, Long recipeId);
}
