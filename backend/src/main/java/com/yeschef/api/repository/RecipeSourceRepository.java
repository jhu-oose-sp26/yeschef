package com.yeschef.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.yeschef.api.model.RecipeSource;

public interface RecipeSourceRepository extends JpaRepository<RecipeSource, Long> {
}
