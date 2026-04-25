package com.yeschef.api.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.yeschef.api.DTO.CommentRequestDTO;
import com.yeschef.api.DTO.CommentResponseDTO;
import com.yeschef.api.model.Comment;
import com.yeschef.api.model.Post;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.CommentRepository;
import com.yeschef.api.repository.PostRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.service.AuthenticatedUserService;

@RestController
@RequestMapping("/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final AuthenticatedUserService authenticatedUserService;

    public CommentController(CommentRepository commentRepository,
                             PostRepository postRepository,
                             UserRepository userRepository,
                             AuthenticatedUserService authenticatedUserService) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.authenticatedUserService = authenticatedUserService;
    }

    private CommentResponseDTO toDTO(Comment comment) {
        return new CommentResponseDTO(
            comment.getId(),
            comment.getPost().getId(),
            comment.getUser().getId(),
            comment.getText(),
            comment.getCreatedAt());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> getComment(@PathVariable Long id) {
        Optional<Comment> commentMaybe = commentRepository.findById(id);
        if (commentMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toDTO(commentMaybe.get()));
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentResponseDTO>> getCommentsByPost(@PathVariable Long postId) {
        if (!postRepository.existsById(postId)) {
            return ResponseEntity.notFound().build();
        }
        List<CommentResponseDTO> comments = commentRepository.findByPost_Id(postId)
            .stream()
            .map(this::toDTO)
            .toList();
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CommentResponseDTO>> getCommentsByUser(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }
        List<CommentResponseDTO> comments = commentRepository.findByUser_Id(userId)
            .stream()
            .map(this::toDTO)
            .toList();
        return ResponseEntity.ok(comments);
    }

    @PostMapping
    public ResponseEntity<CommentResponseDTO> createComment(@RequestBody CommentRequestDTO dto) {
        User currentUser = authenticatedUserService.requireCurrentUser(dto.getUserId());
        Optional<Post> postMaybe = postRepository.findById(dto.getPostId());
        if (postMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Comment comment = new Comment();
        comment.setPost(postMaybe.get());
        comment.setUser(currentUser);
        comment.setText(dto.getText());

        Comment saved = commentRepository.save(comment);
        return ResponseEntity.ok(toDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> updateComment(@PathVariable Long id,
                                                            @RequestBody CommentRequestDTO dto) {
        Optional<Comment> commentMaybe = commentRepository.findById(id);
        if (commentMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        authenticatedUserService.requireCurrentUser(dto.getUserId());
        Comment existing = commentMaybe.get();
        if (!existing.getUser().getId().equals(dto.getUserId())) {
            return ResponseEntity.status(403).build();
        }

        existing.setText(dto.getText());
        Comment saved = commentRepository.save(existing);
        return ResponseEntity.ok(toDTO(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        Optional<Comment> commentMaybe = commentRepository.findById(id);
        if (commentMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        authenticatedUserService.requireCurrentUser(commentMaybe.get().getUser().getId());
        commentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
