package com.yeschef.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPost_Id(Long postId);

    List<Comment> findByUser_Id(Long userId);
}
