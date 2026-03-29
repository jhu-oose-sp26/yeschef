package com.yeschef.api.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.Rating;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByRecipe_Id(Long recipeId);

    List<Rating> findByUser_Id(Long userId);

    Optional<Rating> findByUser_IdAndRecipe_Id(Long userId, Long recipeId);
}
