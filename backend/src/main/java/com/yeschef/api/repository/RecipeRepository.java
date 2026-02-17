package com.yeschef.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.Recipe;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
}

