package com.yeschef.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.yeschef.api.controller.PostController;
import com.yeschef.api.model.*;
import com.yeschef.api.repository.*;
import com.yeschef.api.DTO.*;
import com.yeschef.api.service.SupabaseStorageService;

@WebMvcTest(controllers = PostController.class)
@Import(PostControllerTests.TestSecurityConfig.class)
@SuppressWarnings({"null", "unused"})
class PostControllerTests {

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
    private PostRepository postRepository;

    @MockitoBean
    private RecipeRepository recipeRepository;

    @MockitoBean
    private RecipeSourceRepository sourceRepository;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private SupabaseStorageService storageService;

    @BeforeEach
    void resetMocks() {
        reset(postRepository, recipeRepository, sourceRepository, userRepository, storageService);
    }

    private Recipe buildRecipe(Long id, String title) {

        RecipeSource source = new RecipeSource();
        source.setSourceTypeFromString("USER");

        Instruct instruct = new Instruct();
        instruct.setPrepTime(10);
        instruct.setCookTime(20);

        Instruct.InstructionStep step = new Instruct.InstructionStep();
        step.setStepNumber(1);
        step.setStepDescription("Do something");
        instruct.setSteps(List.of(step));

        Recipe recipe = new Recipe();
        recipe.setId(id);
        recipe.setTitle(title);
        recipe.setSource(source);
        recipe.setInstruction(instruct);
        recipe.setIngredients(List.of());

        return recipe;
    }

    private Post buildPost(Long id, Recipe recipe) {
        Post post = new Post();
        post.setId(id);
        post.setImage("img.jpg");
        post.setRecipe(recipe);
        return post;
    }

    @Test
    void getAllPosts_returnsList() throws Exception {

        Recipe recipe = buildRecipe(1L, "Pasta");
        Post post = buildPost(10L, recipe);

        when(postRepository.findAll()).thenReturn(List.of(post));

        mockMvc.perform(get("/posts").with(user("test").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(10L))
            .andExpect(jsonPath("$[0].recipe.title").value("Pasta"));
    }

    @Test
    void getPostById_returnsPost() throws Exception {

        Recipe recipe = buildRecipe(1L, "Soup");
        Post post = buildPost(5L, recipe);

        when(postRepository.findById(5L)).thenReturn(Optional.of(post));

        mockMvc.perform(get("/posts/{id}", 5L).with(user("test").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(5L))
            .andExpect(jsonPath("$.recipe.title").value("Soup"));
    }

    @Test
    void createPost_reusesExistingRecipe() throws Exception {

        Recipe existing = buildRecipe(1L, "Pasta");

        Post savedPost = buildPost(100L, existing);

        when(recipeRepository.findByTitleIgnoreCase("Pasta"))
            .thenReturn(Optional.of(existing));

        when(postRepository.findFirstByRecipeId(1L))
            .thenReturn(Optional.empty());

        when(postRepository.save(any(Post.class)))
            .thenReturn(savedPost);

        String json = """
        {
            "image": "img.jpg",
            "recipe": {
                "title": "Pasta",
                "sourceType": "USER",
                "prepTime": 10,
                "cookTime": 20,
                "ingredients": [],
                "steps": []
            }
        }
        """;

        mockMvc.perform(post("/posts")
                .with(user("test").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(100L));
    }

    @Test
    void deletePost_returnsNoContent() throws Exception {

        when(postRepository.existsById(1L)).thenReturn(true);
        doNothing().when(postRepository).deleteById(1L);

        mockMvc.perform(delete("/posts/{id}", 1L)
                .with(user("test").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(postRepository, times(1)).deleteById(1L);
    }

    @Test
    void updatePost_updatesImage() throws Exception {

        Recipe recipe = buildRecipe(1L, "Pasta");
        Post post = buildPost(1L, recipe);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenReturn(post);

        String json = """
        {
            "image": "new.jpg",
            "recipe": null
        }
        """;

        mockMvc.perform(put("/posts/{id}", 1L)
                .with(user("test").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk());
    }

    @Test
    void getByName_returnsPosts() throws Exception {

        Recipe recipe = buildRecipe(1L, "Pasta");
        Post post = buildPost(10L, recipe);

        when(postRepository.findByRecipe_TitleContainingIgnoreCase("Pasta"))
            .thenReturn(List.of(post));

        mockMvc.perform(get("/posts/by-name?name=Pasta")
                .with(user("test").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].recipe.title").value("Pasta"));
    }

    @Test
    void getPostById_returnsNotFound_whenMissing() throws Exception {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/posts/{id}", 999L)
                .with(user("test").roles("USER")))
            .andExpect(status().isNotFound());
    }

    @Test
    void deletePost_returnsNotFound_whenMissing() throws Exception {
        when(postRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(delete("/posts/{id}", 999L)
                .with(user("test").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(postRepository, never()).deleteById(any());
    }

    @Test
    void createPost_createsNewRecipe_whenNotFound() throws Exception {
        when(recipeRepository.findByTitleIgnoreCase("New Dish"))
            .thenReturn(Optional.empty());

        Recipe savedRecipe = buildRecipe(2L, "New Dish");
        when(recipeRepository.save(any())).thenReturn(savedRecipe);

        Post savedPost = buildPost(200L, savedRecipe);
        when(postRepository.save(any())).thenReturn(savedPost);

        String json = """
        {
            "image": "img.jpg",
            "recipe": {
                "title": "New Dish",
                "sourceType": "USER",
                "prepTime": 5,
                "cookTime": 5,
                "ingredients": [],
                "steps": []
            }
        }
        """;

        mockMvc.perform(post("/posts")
                .with(user("test").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(200L));

        verify(recipeRepository, times(1)).save(any());
    }

    @Test
    void updatePost_updatesNotes() throws Exception {
        Recipe recipe = buildRecipe(1L, "Pasta");
        Post post = buildPost(1L, recipe);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.save(any())).thenReturn(post);

        String json = """
        {
            "image": null,
            "notes": "Updated notes"
        }
        """;

        mockMvc.perform(put("/posts/{id}", 1L)
                .with(user("test").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk());

        verify(postRepository).save(any());
    }

    @Test
    void getByName_returnsEmpty_whenNoMatches() throws Exception {
        when(postRepository.findByRecipe_TitleContainingIgnoreCase("xyz"))
            .thenReturn(List.of());

        mockMvc.perform(get("/posts/by-name?name=xyz")
                .with(user("test").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void createPost_requiresAuthentication() throws Exception {
        mockMvc.perform(post("/posts")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void createPost_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(post("/posts")
                .with(user("test").roles("USER"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void getAllPosts_doesNotExposeComments() throws Exception {
        Recipe recipe = buildRecipe(1L, "Pasta");
        Post post = buildPost(10L, recipe);

        when(postRepository.findAll()).thenReturn(List.of(post));

        mockMvc.perform(get("/posts").with(user("test").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].comments").doesNotExist());
    }

}
