package com.yeschef.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.context.annotation.ComponentScan.Filter;
import org.springframework.context.annotation.FilterType;

import com.yeschef.api.config.SupabaseJwtFilter;
import com.yeschef.api.controller.CommentController;
import com.yeschef.api.model.Comment;
import com.yeschef.api.model.Notification;
import com.yeschef.api.model.Post;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.CommentRepository;
import com.yeschef.api.repository.PostRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.service.AuthenticatedUserService;
import com.yeschef.api.service.NotificationService;

@WebMvcTest(controllers = CommentController.class,
    excludeFilters = @Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SupabaseJwtFilter.class))
@Import(CommentControllerTests.TestSecurityConfig.class)
@TestPropertySource(properties = "supabase.url=https://test.supabase.co")
@SuppressWarnings({"null", "unused"})
class CommentControllerTests {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                .csrf(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .formLogin(AbstractHttpConfigurer::disable);
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CommentRepository commentRepository;

    @MockitoBean
    private PostRepository postRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private AuthenticatedUserService authenticatedUserService;

    @MockitoBean
    private NotificationService notificationService;

    @BeforeEach
    void resetMocks() {
        reset(commentRepository, postRepository, userRepository, authenticatedUserService, notificationService);
    }

    // --- GET /comments/{id} ---

    @Test
    void getComment_returnsComment_whenCommentExists() throws Exception {
        Post post = new Post();
        post.setRecipe(null);
        setPostId(post, 1L);

        User user = new User();
        user.setId(2L);

        Comment comment = buildComment(3L, post, user, "Nice recipe!", Instant.parse("2026-01-01T00:00:00Z"));

        when(commentRepository.findById(3L)).thenReturn(Optional.of(comment));

        mockMvc.perform(get("/comments/{id}", 3L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.postId").value(1L))
            .andExpect(jsonPath("$.userId").value(2L))
            .andExpect(jsonPath("$.text").value("Nice recipe!"));
    }

    @Test
    void getComment_returnsNotFound_whenCommentDoesNotExist() throws Exception {
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/comments/{id}", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }

    @Test
    void getComment_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/comments/{id}", 3L))
            .andExpect(status().isUnauthorized());
    }

    // --- GET /comments/post/{postId} ---

    @Test
    void getCommentsByPost_returnsCommentList_whenPostExists() throws Exception {
        Post post = new Post();
        setPostId(post, 1L);

        User user = new User();
        user.setId(2L);

        Comment c1 = buildComment(3L, post, user, "Looks great!", Instant.parse("2026-01-01T00:00:00Z"));
        Comment c2 = buildComment(4L, post, user, "Will try this.", Instant.parse("2026-01-02T00:00:00Z"));

        when(postRepository.existsById(1L)).thenReturn(true);
        when(commentRepository.findByPost_Id(1L)).thenReturn(Arrays.asList(c1, c2));

        mockMvc.perform(get("/comments/post/{postId}", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2))
            .andExpect(jsonPath("$[0].id").value(3L))
            .andExpect(jsonPath("$[1].id").value(4L));
    }

    @Test
    void getCommentsByPost_returnsEmptyList_whenPostHasNoComments() throws Exception {
        when(postRepository.existsById(1L)).thenReturn(true);
        when(commentRepository.findByPost_Id(1L)).thenReturn(List.of());

        mockMvc.perform(get("/comments/post/{postId}", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getCommentsByPost_returnsNotFound_whenPostDoesNotExist() throws Exception {
        when(postRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(get("/comments/post/{postId}", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }

    // --- GET /comments/user/{userId} ---

    @Test
    void getCommentsByUser_returnsCommentList_whenUserExists() throws Exception {
        Post post = new Post();
        setPostId(post, 1L);

        User user = new User();
        user.setId(2L);

        Comment comment = buildComment(3L, post, user, "Amazing!", Instant.parse("2026-01-01T00:00:00Z"));

        when(userRepository.existsById(2L)).thenReturn(true);
        when(commentRepository.findByUser_Id(2L)).thenReturn(Arrays.asList(comment));

        mockMvc.perform(get("/comments/user/{userId}", 2L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(3L))
            .andExpect(jsonPath("$[0].userId").value(2L));
    }

    @Test
    void getCommentsByUser_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(get("/comments/user/{userId}", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }

    // --- POST /comments ---

    @Test
    void createComment_returnsOk_whenPostAndUserExist() throws Exception {
        Post post = new Post();
        setPostId(post, 1L);

        User user = new User();
        user.setId(2L);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment c = invocation.getArgument(0);
            setCommentId(c, 3L);
            setCreatedAt(c, Instant.parse("2026-01-01T00:00:00Z"));
            return c;
        });

        mockMvc.perform(post("/comments")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 1,
                      "userId": 2,
                      "text": "Delicious!"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.postId").value(1L))
            .andExpect(jsonPath("$.userId").value(2L))
            .andExpect(jsonPath("$.text").value("Delicious!"));
    }

    @Test
    void createComment_returnsNotFound_whenPostDoesNotExist() throws Exception {
        User user = new User();
        user.setId(2L);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/comments")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 999,
                      "userId": 2,
                      "text": "Delicious!"
                    }
                    """))
            .andExpect(status().isNotFound());

        verify(commentRepository, never()).save(any());
    }

    @Test
    void createComment_returnsForbidden_whenUserIdDoesNotMatchAuthenticatedUser() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(2L);

        mockMvc.perform(post("/comments")
                .with(authentication(new UsernamePasswordAuthenticationToken("other-user", null)))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 1,
                      "userId": 2,
                      "text": "Delicious!"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void createComment_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/comments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 1,
                      "userId": 2,
                      "text": "Delicious!"
                    }
                    """))
            .andExpect(status().isUnauthorized());
    }

    // --- PUT /comments/{id} ---

    @Test
    void updateComment_returnsOk_whenCommentBelongsToUser() throws Exception {
        Post post = new Post();
        setPostId(post, 1L);

        User user = new User();
        user.setId(2L);

        Comment existing = buildComment(3L, post, user, "Old text", Instant.parse("2026-01-01T00:00:00Z"));

        when(commentRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/comments/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 1,
                      "userId": 2,
                      "text": "Updated text"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.text").value("Updated text"));
    }

    @Test
    void updateComment_returnsNotFound_whenCommentDoesNotExist() throws Exception {
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/comments/{id}", 999L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 1,
                      "userId": 2,
                      "text": "Updated text"
                    }
                    """))
            .andExpect(status().isNotFound());
    }

    @Test
    void updateComment_returnsForbidden_whenCommentBelongsToAnotherUser() throws Exception {
        Post post = new Post();
        setPostId(post, 1L);

        User owner = new User();
        owner.setId(9L);

        User requester = new User();
        requester.setId(2L);

        Comment existing = buildComment(3L, post, owner, "Old text", Instant.parse("2026-01-01T00:00:00Z"));

        when(commentRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(requester);

        mockMvc.perform(put("/comments/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "postId": 1,
                      "userId": 2,
                      "text": "Updated text"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    // --- DELETE /comments/{id} ---

    @Test
    void deleteComment_returnsNoContent_whenCommentExists() throws Exception {
        User user = new User();
        user.setId(2L);

        Post post = new Post();
        setPostId(post, 1L);

        Comment comment = buildComment(3L, post, user, "Some text", Instant.parse("2026-01-01T00:00:00Z"));

        when(commentRepository.findById(3L)).thenReturn(Optional.of(comment));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        doNothing().when(commentRepository).deleteById(3L);

        mockMvc.perform(delete("/comments/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(commentRepository, times(1)).deleteById(3L);
    }

    @Test
    void deleteComment_returnsNotFound_whenCommentDoesNotExist() throws Exception {
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/comments/{id}", 999L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(commentRepository, never()).deleteById(any());
    }

    @Test
    void deleteComment_returnsForbidden_whenCommentBelongsToAnotherUser() throws Exception {
        User owner = new User();
        owner.setId(9L);

        Post post = new Post();
        setPostId(post, 1L);

        Comment comment = buildComment(3L, post, owner, "Some text", Instant.parse("2026-01-01T00:00:00Z"));

        when(commentRepository.findById(3L)).thenReturn(Optional.of(comment));
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(9L);

        mockMvc.perform(delete("/comments/{id}", 3L)
                .with(authentication(new UsernamePasswordAuthenticationToken("other-user", null)))
                .with(csrf()))
            .andExpect(status().isForbidden());

        verify(commentRepository, never()).deleteById(any());
    }

    // --- Helpers ---

    private Comment buildComment(Long id, Post post, User user, String text, Instant createdAt) {
        Comment comment = new Comment();
        setCommentId(comment, id);
        comment.setPost(post);
        comment.setUser(user);
        comment.setText(text);
        setCreatedAt(comment, createdAt);
        return comment;
    }

    private void setCommentId(Comment comment, Long id) {
        try {
            var field = Comment.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(comment, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setPostId(Post post, Long id) {
        try {
            var field = Post.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(post, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setCreatedAt(Comment comment, Instant createdAt) {
        try {
            var field = Comment.class.getDeclaredField("createdAt");
            field.setAccessible(true);
            field.set(comment, createdAt);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void createComment_doesNotSave_whenPostNotFound_evenIfUserValid() throws Exception {
        User user = new User();
        user.setId(2L);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(postRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/comments")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                    "postId": 1,
                    "userId": 2,
                    "text": "Should not save"
                    }
                    """))
            .andExpect(status().isNotFound());

        verify(commentRepository, never()).save(any());
    }

    @Test
    void createComment_callsAuthenticatedUserService_withCorrectUserId() throws Exception {
        User user = new User();
        user.setId(2L);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(postRepository.findById(1L)).thenReturn(Optional.of(new Post()));
        when(commentRepository.save(any(Comment.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/comments")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                    "postId": 1,
                    "userId": 2,
                    "text": "Hello"
                    }
                    """))
            .andExpect(status().isOk());

        verify(authenticatedUserService, times(1)).requireCurrentUser(2L);
    }

    @Test
    void updateComment_updatesEvenIfPostChanges_butStillReturnsOk() throws Exception {
        Post oldPost = new Post();
        setPostId(oldPost, 1L);

        Post newPost = new Post();
        setPostId(newPost, 2L);

        User user = new User();
        user.setId(2L);

        Comment existing = buildComment(3L, oldPost, user, "Old", Instant.now());

        when(commentRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(commentRepository.save(any(Comment.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/comments/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                    "postId": 2,
                    "userId": 2,
                    "text": "Updated"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.text").value("Updated"));
    }

    @Test
    void deleteComment_callsAuthenticatedUserService_beforeDelete() throws Exception {
        User user = new User();
        user.setId(2L);

        Post post = new Post();
        setPostId(post, 1L);

        Comment comment = buildComment(3L, post, user, "text", Instant.now());

        when(commentRepository.findById(3L)).thenReturn(Optional.of(comment));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);

        mockMvc.perform(delete("/comments/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(authenticatedUserService, times(1)).requireCurrentUser(2L);
        verify(commentRepository, times(1)).deleteById(3L);
    }

    @Test
    void createComment_sendsNotification_whenRecipeOwnerExists() throws Exception {

        User actor = new User();
        actor.setId(2L);

        User recipient = new User();
        recipient.setId(99L);

        Post post = new Post();
        setPostId(post, 1L);

        RecipeSource source = new RecipeSource();
        User sourceUser = recipient;

        com.yeschef.api.model.Recipe recipe = new com.yeschef.api.model.Recipe();
        recipe.setSource(source);
        source.setUser(sourceUser);

        post.setRecipe(recipe);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(actor);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/comments")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                    "postId": 1,
                    "userId": 2,
                    "text": "Nice post!"
                    }
                """))
            .andExpect(status().isOk());

        verify(notificationService, times(1)).createNotification(
                eq(recipient),
                eq(actor),
                eq(Notification.Type.COMMENT),
                eq(1L)
        );
    }

    @Test
    void createComment_doesNotSendNotification_whenNoRecipeOwner() throws Exception {
        User actor = new User();
        actor.setId(2L);

        Post post = new Post();
        setPostId(post, 1L);

        // IMPORTANT: no recipe attached
        post.setRecipe(null);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(actor);
        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/comments")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                    "postId": 1,
                    "userId": 2,
                    "text": "Nice post!"
                    }
                """))
            .andExpect(status().isOk());

        verify(notificationService, never()).createNotification(
                any(),
                any(),
                any(),
                any()
        );
    }
}
