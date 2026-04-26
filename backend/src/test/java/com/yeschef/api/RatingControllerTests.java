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

import java.util.Arrays;
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

import com.yeschef.api.controller.RatingController;
import com.yeschef.api.model.Rating;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.RatingRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.service.AuthenticatedUserService;
import com.yeschef.api.service.NotificationService;
import com.yeschef.api.model.Notification;

@WebMvcTest(controllers = RatingController.class)
@Import(RatingControllerTests.TestSecurityConfig.class)
@TestPropertySource(properties = "supabase.url=https://test.supabase.co")
@SuppressWarnings({"null", "unused"})
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

    @MockitoBean
    private RatingRepository ratingRepository;

    @MockitoBean
    private RecipeRepository recipeRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private AuthenticatedUserService authenticatedUserService;

    @MockitoBean
    private NotificationService notificationService;

    @BeforeEach
    void resetMocks() {
        reset(ratingRepository, recipeRepository, userRepository, authenticatedUserService, notificationService);
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
            .andExpect(jsonPath("$[0].userId").value(2L));
    }

    @Test
    void createRating_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);

        User user = new User();
        user.setId(2L);

        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));
        when(ratingRepository.findByUser_IdAndRecipe_Id(2L, 1L)).thenReturn(Optional.empty());
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> {
            Rating rating = invocation.getArgument(0);
            rating.setId(3L);
            return rating;
        });

        mockMvc.perform(post("/ratings")
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
            .andExpect(jsonPath("$.userId").value(2L));
    }

    @Test
    void createRating_returnsForbidden_whenUserIdDoesNotMatchAuthenticatedUser() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(2L);

        mockMvc.perform(post("/ratings")
                .with(authentication(new UsernamePasswordAuthenticationToken("different-user", null)))
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
            .andExpect(status().isForbidden());
    }

    @Test
    void updateRating_success() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(4L);

        User user = new User();
        user.setId(2L);

        Rating existing = new Rating();
        existing.setId(3L);
        existing.setRecipe(recipe);
        existing.setUser(user);
        existing.setTasteQuality(2);
        existing.setEaseOfExecution(1);

        when(ratingRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        when(recipeRepository.findById(4L)).thenReturn(Optional.of(recipe));
        when(ratingRepository.findByUser_IdAndRecipe_Id(2L, 4L)).thenReturn(Optional.of(existing));
        when(ratingRepository.save(any(Rating.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/ratings/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "recipeId": 4,
                      "userId": 2,
                      "tasteQuality": 5,
                      "easeOfExecution": 4
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(3L))
            .andExpect(jsonPath("$.userId").value(2L));
    }

    @Test
    void updateRating_returnsForbidden_whenRatingBelongsToAnotherUser() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(4L);

        User owner = new User();
        owner.setId(9L);

        User currentUser = new User();
        currentUser.setId(2L);

        Rating existing = new Rating();
        existing.setId(3L);
        existing.setRecipe(recipe);
        existing.setUser(owner);

        when(ratingRepository.findById(3L)).thenReturn(Optional.of(existing));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(currentUser);

        mockMvc.perform(put("/ratings/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "recipeId": 4,
                      "userId": 2,
                      "tasteQuality": 5,
                      "easeOfExecution": 4
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void deleteRating_success() throws Exception {
        User user = new User();
        user.setId(2L);

        Rating rating = new Rating();
        rating.setId(3L);
        rating.setUser(user);

        when(ratingRepository.findById(3L)).thenReturn(Optional.of(rating));
        when(authenticatedUserService.requireCurrentUser(2L)).thenReturn(user);
        doNothing().when(ratingRepository).deleteById(3L);

        mockMvc.perform(delete("/ratings/{id}", 3L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(ratingRepository, times(1)).deleteById(3L);
    }

    @Test
    void deleteRating_notFound() throws Exception {
        when(ratingRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/ratings/{id}", 999L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(ratingRepository, never()).deleteById(any());
    }

    @Test
    void createRating_sendsNotificationToRecipeOwner() throws Exception {
        User rater = new User();
        rater.setId(1L);

        User owner = new User();
        owner.setId(2L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        RecipeSource source = new RecipeSource();
        source.setUser(owner);
        recipe.setSource(source);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(rater);
        when(recipeRepository.findById(10L)).thenReturn(Optional.of(recipe));
        when(ratingRepository.findByUser_IdAndRecipe_Id(1L, 10L)).thenReturn(Optional.empty());
        when(ratingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/ratings")
                .with(user("test").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                        "userId": 1,
                        "recipeId": 10,
                        "tasteQuality": 5,
                        "easeOfExecution": 4
                    }
                """))
            .andExpect(status().isOk());

        verify(notificationService, times(1)).createNotification(
                eq(owner),
                eq(rater),
                eq(Notification.Type.RATING),
                eq(10L)
        );
    }
}
