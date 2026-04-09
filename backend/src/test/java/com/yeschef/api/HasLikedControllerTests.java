package com.yeschef.api;

import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yeschef.api.controller.HasLikedController;
import com.yeschef.api.model.HasLiked;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.HasLikedRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;

@WebMvcTest(controllers = HasLikedController.class)
@Import(HasLikedControllerTests.TestSecurityConfig.class)
@SuppressWarnings({"null", "unused"})
class HasLikedControllerTests {

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
    private HasLikedRepository hasLikedRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private RecipeRepository recipeRepository;

    @BeforeEach
    void resetMocks() {
        Mockito.reset(hasLikedRepository);
        Mockito.reset(userRepository);
        Mockito.reset(recipeRepository);
    }

    // --- GET /users/{userId}/liked ---

    @Test
    void getLikedRecipes_returnsLikedList_whenUserExists() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        Recipe recipe = new Recipe();
        recipe.setId(10L);
        recipe.setTitle("Pasta");

        HasLiked hasLiked = new HasLiked();
        hasLiked.setUser(user);
        hasLiked.setRecipe(recipe);

        when(userRepository.existsById(1L)).thenReturn(true);
        when(hasLikedRepository.findByUser_Id(1L)).thenReturn(Arrays.asList(hasLiked));

        mockMvc.perform(get("/users/{userId}/liked", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].recipeId").value(10L));
    }

    @Test
    void getLikedRecipes_returnsEmptyList_whenUserHasNoLikes() throws Exception {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(hasLikedRepository.findByUser_Id(1L)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/users/{userId}/liked", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getLikedRecipes_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(get("/users/{userId}/liked", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());

        verify(hasLikedRepository, never()).findByUser_Id(any());
    }

    @Test
    void getLikedRecipes_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/users/{userId}/liked", 1L))
            .andExpect(status().isUnauthorized());
    }

    // --- POST /users/{userId}/liked/{recipeId} ---

    @Test
    void likeRecipe_returnsOk_whenUserAndRecipeExistAndNotAlreadyLiked() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        Recipe recipe = new Recipe();
        recipe.setId(10L);
        recipe.setTitle("Pasta");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(recipeRepository.findById(10L)).thenReturn(Optional.of(recipe));
        when(hasLikedRepository.findByUser_IdAndRecipe_Id(1L, 10L)).thenReturn(Optional.empty());
        when(hasLikedRepository.save(any(HasLiked.class))).thenAnswer(invocation -> {
            HasLiked hl = invocation.getArgument(0);
            hl.setUser(user);
            hl.setRecipe(recipe);
            return hl;
        });

        mockMvc.perform(
                post("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.recipeId").value(10L));
    }

    @Test
    void likeRecipe_returnsConflict_whenAlreadyLiked() throws Exception {
        User user = new User();
        user.setId(1L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        HasLiked existing = new HasLiked();
        existing.setUser(user);
        existing.setRecipe(recipe);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(recipeRepository.findById(10L)).thenReturn(Optional.of(recipe));
        when(hasLikedRepository.findByUser_IdAndRecipe_Id(1L, 10L)).thenReturn(Optional.of(existing));

        mockMvc.perform(
                post("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isConflict());

        verify(hasLikedRepository, never()).save(any());
    }

    @Test
    void likeRecipe_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                post("/users/{userId}/liked/{recipeId}", 999L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasLikedRepository, never()).save(any());
    }

    @Test
    void likeRecipe_returnsNotFound_whenRecipeDoesNotExist() throws Exception {
        User user = new User();
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(recipeRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                post("/users/{userId}/liked/{recipeId}", 1L, 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasLikedRepository, never()).save(any());
    }

    @Test
    void likeRecipe_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                post("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER")))
            .andExpect(status().isForbidden());
    }

    @Test
    void likeRecipe_requiresAuthentication() throws Exception {
        mockMvc.perform(
                post("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(csrf()))
            .andExpect(status().isUnauthorized());
    }

    // --- DELETE /users/{userId}/liked/{recipeId} ---

    @Test
    void unlikeRecipe_returnsNoContent_whenLikeExists() throws Exception {
        User user = new User();
        user.setId(1L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        HasLiked hasLiked = new HasLiked();
        hasLiked.setUser(user);
        hasLiked.setRecipe(recipe);

        when(hasLikedRepository.findByUser_IdAndRecipe_Id(1L, 10L)).thenReturn(Optional.of(hasLiked));
        doNothing().when(hasLikedRepository).delete(hasLiked);

        mockMvc.perform(
                delete("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNoContent());

        verify(hasLikedRepository, times(1)).delete(hasLiked);
    }

    @Test
    void unlikeRecipe_returnsNotFound_whenLikeDoesNotExist() throws Exception {
        when(hasLikedRepository.findByUser_IdAndRecipe_Id(1L, 999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                delete("/users/{userId}/liked/{recipeId}", 1L, 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasLikedRepository, never()).delete(any());
    }

    @Test
    void unlikeRecipe_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                delete("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER")))
            .andExpect(status().isForbidden());
    }

    @Test
    void unlikeRecipe_requiresAuthentication() throws Exception {
        mockMvc.perform(
                delete("/users/{userId}/liked/{recipeId}", 1L, 10L)
                    .with(csrf()))
            .andExpect(status().isUnauthorized());
    }
}
