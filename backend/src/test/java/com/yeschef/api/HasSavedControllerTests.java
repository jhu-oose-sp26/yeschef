package com.yeschef.api;

import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.yeschef.api.controller.HasSavedController;
import com.yeschef.api.model.HasSaved;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.HasSavedRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.service.AuthenticatedUserService;

@WebMvcTest(controllers = HasSavedController.class)
@Import(HasSavedControllerTests.TestSecurityConfig.class)
@TestPropertySource(properties = "supabase.url=https://test.supabase.co")
@SuppressWarnings({"null", "unused"})
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

    @MockitoBean
    private HasSavedRepository hasSavedRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private RecipeRepository recipeRepository;

    @MockitoBean
    private AuthenticatedUserService authenticatedUserService;

    @BeforeEach
    void resetMocks() {
        reset(hasSavedRepository, userRepository, recipeRepository, authenticatedUserService);
    }

    @Test
    void getSavedRecipes_returnsSavedList_whenUserExists() throws Exception {
        User user = new User();
        user.setId(1L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        HasSaved hasSaved = new HasSaved();
        hasSaved.setId(1L);
        hasSaved.setUser(user);
        hasSaved.setRecipe(recipe);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(user);
        when(userRepository.existsById(1L)).thenReturn(true);
        when(hasSavedRepository.findByUser_Id(1L)).thenReturn(Arrays.asList(hasSaved));

        mockMvc.perform(get("/users/{userId}/saved", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].recipeId").value(10L));
    }

    @Test
    void getSavedRecipes_returnsForbidden_whenUserTargetsDifferentAccount() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(1L);

        mockMvc.perform(get("/users/{userId}/saved", 1L)
                .with(authentication(new UsernamePasswordAuthenticationToken("different-user", null))))
            .andExpect(status().isForbidden());
    }

    @Test
    void saveRecipe_returnsOk_whenUserAndRecipeExistAndNotAlreadySaved() throws Exception {
        User user = new User();
        user.setId(1L);

        Recipe recipe = new Recipe();
        recipe.setId(10L);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(user);
        when(recipeRepository.findById(10L)).thenReturn(Optional.of(recipe));
        when(hasSavedRepository.findByUser_IdAndRecipe_Id(1L, 10L)).thenReturn(Optional.empty());
        when(hasSavedRepository.save(any(HasSaved.class))).thenAnswer(invocation -> {
            HasSaved saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        mockMvc.perform(post("/users/{userId}/saved/{recipeId}", 1L, 10L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.recipeId").value(10L));
    }

    @Test
    void saveRecipe_returnsForbidden_whenUserTargetsDifferentAccount() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(1L);

        mockMvc.perform(post("/users/{userId}/saved/{recipeId}", 1L, 10L)
                .with(authentication(new UsernamePasswordAuthenticationToken("different-user", null)))
                .with(csrf()))
            .andExpect(status().isForbidden());
    }

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

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(user);
        when(hasSavedRepository.findByUser_IdAndRecipe_Id(1L, 10L)).thenReturn(Optional.of(hasSaved));
        doNothing().when(hasSavedRepository).delete(hasSaved);

        mockMvc.perform(delete("/users/{userId}/saved/{recipeId}", 1L, 10L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(hasSavedRepository, times(1)).delete(hasSaved);
    }

    @Test
    void unsaveRecipe_returnsNotFound_whenSaveDoesNotExist() throws Exception {
        User user = new User();
        user.setId(1L);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(user);
        when(hasSavedRepository.findByUser_IdAndRecipe_Id(1L, 999L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/users/{userId}/saved/{recipeId}", 1L, 999L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(hasSavedRepository, never()).delete(any());
    }
}
