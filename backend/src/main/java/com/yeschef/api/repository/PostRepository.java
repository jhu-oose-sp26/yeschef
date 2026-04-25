package com.yeschef.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.Post;

public interface PostRepository extends JpaRepository<Post, Long> {
}
