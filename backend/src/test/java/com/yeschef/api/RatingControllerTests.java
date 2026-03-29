package com.yeschef.api;

import com.yeschef.api.controller.RatingController;
import com.yeschef.api.model.Rating;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.RatingRepository;
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
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = RatingController.class)
@Import(RatingControllerTests.TestSecurityConfig.class)
class RatingControllerTests {

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
    private RatingRepository ratingRepository;

    @MockBean
    private RecipeRepository recipeRepository;

    @MockBean
    private UserRepository userRepository;

    @BeforeEach
    void resetMocks() {
        Mockito.reset(ratingRepository);
        Mockito.reset(recipeRepository);
        Mockito.reset(userRepository);
    }

    @Test
    void getRatingById_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        Rating rating = new Rating();
        rating.setId(3L);
        rating.setRecipe(recipe);
        rating.setUser(user);
        rating.setTasteQuality(5);
        rating.setEaseOfExecution(4);

        when(ratingRepository.findById(3L)).thenReturn(Optional.of(rating));

        mockMvc.perform(get("/ratings/{id}", 3L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.recipeId").value(1L))
            .andExpect(jsonPath("$.userId").value(2L))
            .andExpect(jsonPath("$.tasteQuality").value(5))
            .andExpect(jsonPath("$.easeOfExecution").value(4));
    }

    @Test
    void getRatingsByRecipe_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        Rating rating = new Rating();
        rating.setId(3L);
        rating.setRecipe(recipe);
        rating.setUser(user);
        rating.setTasteQuality(5);
        rating.setEaseOfExecution(4);

        when(recipeRepository.existsById(1L)).thenReturn(true);
        when(ratingRepository.findByRecipe_Id(1L)).thenReturn(Arrays.asList(rating));

        mockMvc.perform(get("/ratings/recipe/{recipeId}", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(3L))
            .andExpect(jsonPath("$[0].recipeId").value(1L))
            .andExpect(jsonPath("$[0].userId").value(2L))
            .andExpect(jsonPath("$[0].tasteQuality").value(5))
            .andExpect(jsonPath("$[0].easeOfExecution").value(4));
    }

    @Test
    void getRatingsByUser_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        Rating rating = new Rating();
        rating.setId(3L);
        rating.setRecipe(recipe);
        rating.setUser(user);
        rating.setTasteQuality(5);
        rating.setEaseOfExecution(4);

        when(userRepository.existsById(2L)).thenReturn(true);
        when(ratingRepository.findByUser_Id(2L)).thenReturn(Arrays.asList(rating));

        mockMvc.perform(get("/ratings/user/{userId}", 2L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(3L))
            .andExpect(jsonPath("$[0].recipeId").value(1L))
            .andExpect(jsonPath("$[0].userId").value(2L))
            .andExpect(jsonPath("$[0].tasteQuality").value(5))
            .andExpect(jsonPath("$[0].easeOfExecution").value(4));
    }

    @Test
    void getRatingByUserAndRecipe_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        Rating rating = new Rating();
        rating.setId(3L);
        rating.setRecipe(recipe);
        rating.setUser(user);
        rating.setTasteQuality(5);
        rating.setEaseOfExecution(4);

        when(userRepository.existsById(2L)).thenReturn(true);
        when(recipeRepository.existsById(1L)).thenReturn(true);
        when(ratingRepository.findByUser_IdAndRecipe_Id(2L, 1L)).thenReturn(Optional.of(rating));

        mockMvc.perform(get("/ratings/user/{userId}/recipe/{recipeId}", 2L, 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.recipeId").value(1L))
            .andExpect(jsonPath("$.userId").value(2L))
            .andExpect(jsonPath("$.tasteQuality").value(5))
            .andExpect(jsonPath("$.easeOfExecution").value(4));
    }

    @Test
    void getRatingByUserAndRecipe_notFound() throws Exception {
        when(userRepository.existsById(2L)).thenReturn(true);
        when(recipeRepository.existsById(1L)).thenReturn(true);
        when(ratingRepository.findByUser_IdAndRecipe_Id(2L, 1L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/ratings/user/{userId}/recipe/{recipeId}", 2L, 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }

    @Test
    void createRating_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(ratingRepository.findByUser_IdAndRecipe_Id(2L, 1L)).thenReturn(Optional.empty());
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> {
            Rating rating = invocation.getArgument(0);
            rating.setId(3L);
            return rating;
        });

        mockMvc.perform(
                post("/ratings")
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "recipeId": 1,
                          "userId": 2,
                          "tasteQuality": 5,
                          "easeOfExecution": 4
                        }
                        """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.recipeId").value(1L))
            .andExpect(jsonPath("$.userId").value(2L))
            .andExpect(jsonPath("$.tasteQuality").value(5))
            .andExpect(jsonPath("$.easeOfExecution").value(4));
    }

    @Test
    void createDuplicateRating_failure() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        Rating existing = new Rating();
        existing.setId(3L);
        existing.setRecipe(recipe);
        existing.setUser(user);
        existing.setTasteQuality(5);
        existing.setEaseOfExecution(4);

        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(ratingRepository.findByUser_IdAndRecipe_Id(2L, 1L)).thenReturn(Optional.of(existing));

        mockMvc.perform(
                post("/ratings")
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "recipeId": 1,
                          "userId": 2,
                          "tasteQuality": 5,
                          "easeOfExecution": 4
                        }
                        """))
            .andExpect(status().isConflict());

        verify(ratingRepository, never()).save(any());
    }

    @Test
    void createWithInvalidRecipeId() throws Exception {
        when(recipeRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                post("/ratings")
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "recipeId": 999,
                          "userId": 2,
                          "tasteQuality": 5,
                          "easeOfExecution": 4
                        }
                        """))
            .andExpect(status().isNotFound());

        verify(ratingRepository, never()).save(any());
    }

    @Test
    void createWithInvalidUserId() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                post("/ratings")
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "recipeId": 1,
                          "userId": 999,
                          "tasteQuality": 5,
                          "easeOfExecution": 4
                        }
                        """))
            .andExpect(status().isNotFound());

        verify(ratingRepository, never()).save(any());
    }

    @Test
    void updateRating_success() throws Exception {
        Recipe oldRecipe = new Recipe();
        oldRecipe.setId(1L);

        Recipe newRecipe = new Recipe();
        newRecipe.setId(4L);

        User oldUser = new User();
        oldUser.setId(2L);

        User newUser = new User();
        newUser.setId(5L);

        Rating existing = new Rating();
        existing.setId(3L);
        existing.setRecipe(oldRecipe);
        existing.setUser(oldUser);
        existing.setTasteQuality(2);
        existing.setEaseOfExecution(1);

        when(ratingRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(recipeRepository.findById(4L)).thenReturn(Optional.of(newRecipe));
        when(userRepository.findById(5L)).thenReturn(Optional.of(newUser));
        when(ratingRepository.findByUser_IdAndRecipe_Id(5L, 4L)).thenReturn(Optional.empty());
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(
                put("/ratings/{id}", 3L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "recipeId": 4,
                          "userId": 5,
                          "tasteQuality": 5,
                          "easeOfExecution": 4
                        }
                        """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.recipeId").value(4L))
            .andExpect(jsonPath("$.userId").value(5L))
            .andExpect(jsonPath("$.tasteQuality").value(5))
            .andExpect(jsonPath("$.easeOfExecution").value(4));
    }

    @Test
    void updateRating_notFound() throws Exception {
        when(ratingRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                put("/ratings/{id}", 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                        {
                          "recipeId": 1,
                          "userId": 2,
                          "tasteQuality": 5,
                          "easeOfExecution": 4
                        }
                        """))
            .andExpect(status().isNotFound());

        verify(ratingRepository, never()).save(any());
    }

    @Test
    void deleteRating_success() throws Exception {
        when(ratingRepository.existsById(3L)).thenReturn(true);
        doNothing().when(ratingRepository).deleteById(3L);

        mockMvc.perform(
                delete("/ratings/{id}", 3L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNoContent());

        verify(ratingRepository, times(1)).deleteById(3L);
    }

    @Test
    void deleteRating_notFound() throws Exception {
        when(ratingRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(
                delete("/ratings/{id}", 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(ratingRepository, never()).deleteById(any());
    }
}
