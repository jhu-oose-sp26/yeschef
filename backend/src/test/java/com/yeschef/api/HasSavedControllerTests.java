package com.yeschef.api;

import com.yeschef.api.controller.HasSavedController;
import com.yeschef.api.model.HasSaved;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.HasSavedRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = HasSavedController.class)
@Import(HasSavedControllerTests.TestSecurityConfig.class)
class HasSavedControllerTests {

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

    @MockBean
    private HasSavedRepository hasSavedRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RecipeRepository recipeRepository;

    @BeforeEach
    void resetMocks() {
        Mockito.reset(hasSavedRepository);
        Mockito.reset(userRepository);
        Mockito.reset(recipeRepository);
    }

    // --- GET /users/{userId}/saved ---

    @Test
    void getSavedRecipes_returnsSavedList_whenUserExists() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        Recipe recipe = new Recipe();
        recipe.setId(10L);
        recipe.setTitle("Pasta");

        HasSaved hasSaved = new HasSaved();
        hasSaved.setId(1L);
        hasSaved.setUser(user);
        hasSaved.setRecipe(recipe);

        when(userRepository.existsById(1L)).thenReturn(true);
        when(hasSavedRepository.findByUserId(1L)).thenReturn(Arrays.asList(hasSaved));

        mockMvc.perform(get("/users/{userId}/saved", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].recipe.id").value(10L))
            .andExpect(jsonPath("$[0].recipe.title").value("Pasta"));
    }

    @Test
    void getSavedRecipes_returnsEmptyList_whenUserHasNoSaves() throws Exception {
        when(userRepository.existsById(1L)).thenReturn(true);
        when(hasSavedRepository.findByUserId(1L)).thenReturn(Arrays.asList());

        mockMvc.perform(get("/users/{userId}/saved", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getSavedRecipes_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(get("/users/{userId}/saved", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());

        verify(hasSavedRepository, never()).findByUserId(any());
    }

    @Test
    void getSavedRecipes_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/users/{userId}/saved", 1L))
            .andExpect(status().isUnauthorized());
    }

    // --- POST /users/{userId}/saved/{recipeId} ---

    @Test
    void saveRecipe_returnsOk_whenUserAndRecipeExistAndNotAlreadySaved() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        Recipe recipe = new Recipe();
        recipe.setId(10L);
        recipe.setTitle("Pasta");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(recipeRepository.findById(10L)).thenReturn(Optional.of(recipe));
        when(hasSavedRepository.findByUserIdAndRecipeId(1L, 10L)).thenReturn(Optional.empty());
        when(hasSavedRepository.save(any(HasSaved.class))).thenAnswer(invocation -> {
            HasSaved hs = invocation.getArgument(0);
            hs.setId(1L);
            return hs;
        });

        mockMvc.perform(
                post("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.user.id").value(1L))
            .andExpect(jsonPath("$.recipe.id").value(10L));
    }

    @Test
    void saveRecipe_returnsConflict_whenAlreadySaved() throws Exception {
        User user = new User();
        user.setId(1L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        HasSaved existing = new HasSaved();
        existing.setId(1L);
        existing.setUser(user);
        existing.setRecipe(recipe);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(recipeRepository.findById(10L)).thenReturn(Optional.of(recipe));
        when(hasSavedRepository.findByUserIdAndRecipeId(1L, 10L)).thenReturn(Optional.of(existing));

        mockMvc.perform(
                post("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isConflict());

        verify(hasSavedRepository, never()).save(any());
    }

    @Test
    void saveRecipe_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                post("/users/{userId}/saved/{recipeId}", 999L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasSavedRepository, never()).save(any());
    }

    @Test
    void saveRecipe_returnsNotFound_whenRecipeDoesNotExist() throws Exception {
        User user = new User();
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(recipeRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                post("/users/{userId}/saved/{recipeId}", 1L, 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasSavedRepository, never()).save(any());
    }

    @Test
    void saveRecipe_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                post("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER")))
            .andExpect(status().isForbidden());
    }

    @Test
    void saveRecipe_requiresAuthentication() throws Exception {
        mockMvc.perform(
                post("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(csrf()))
            .andExpect(status().isUnauthorized());
    }

    // --- DELETE /users/{userId}/saved/{recipeId} ---

    @Test
    void unsaveRecipe_returnsNoContent_whenSaveExists() throws Exception {
        User user = new User();
        user.setId(1L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        HasSaved hasSaved = new HasSaved();
        hasSaved.setId(1L);
        hasSaved.setUser(user);
        hasSaved.setRecipe(recipe);

        when(hasSavedRepository.findByUserIdAndRecipeId(1L, 10L)).thenReturn(Optional.of(hasSaved));
        doNothing().when(hasSavedRepository).delete(hasSaved);

        mockMvc.perform(
                delete("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNoContent());

        verify(hasSavedRepository, times(1)).delete(hasSaved);
    }

    @Test
    void unsaveRecipe_returnsNotFound_whenSaveDoesNotExist() throws Exception {
        when(hasSavedRepository.findByUserIdAndRecipeId(1L, 999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                delete("/users/{userId}/saved/{recipeId}", 1L, 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasSavedRepository, never()).delete(any());
    }

    @Test
    void unsaveRecipe_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                delete("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(user("testuser").roles("USER")))
            .andExpect(status().isForbidden());
    }

    @Test
    void unsaveRecipe_requiresAuthentication() throws Exception {
        mockMvc.perform(
                delete("/users/{userId}/saved/{recipeId}", 1L, 10L)
                    .with(csrf()))
            .andExpect(status().isUnauthorized());
    }
}
