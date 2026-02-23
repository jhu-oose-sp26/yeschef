package com.yeschef.api;

import com.yeschef.api.controller.RecipeController;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.model.Recipe;

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
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Arrays;
import java.util.Optional;

import org.springframework.security.config.Customizer;

@WebMvcTest(controllers = RecipeController.class)
@Import(ApiApplicationTests.TestJacksonConfig.class)
class ApiApplicationTests {

	/*
	* Discovered REST endpoints (@RestController scan):
	* - POST /recipes        (RecipeController.createRecipe)
	* - DELETE /recipes/{id} (RecipeController.deleteRecipe)
	*/

	// This test-only Jackson configuration lets MockMvc read/write entity fields directly
	// It avoids changing production code while entities still rely on private fields only
	@TestConfiguration
	static class TestJacksonConfig {
		@Bean
		Jackson2ObjectMapperBuilderCustomizer jacksonFieldVisibilityCustomizer() {
			return builder -> builder.visibility(PropertyAccessor.FIELD, JsonAutoDetect.Visibility.ANY);
		}
	}

	// Test security config keeps authentication + CSRF enabled, but uses HTTP Basic semantics
	// so unauthenticated requests return 401 instead of redirecting to a login page
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

	// We mock the repository so controller tests stay focused on request handling,
	// security behavior, and JSON responses without depending on database state
	@MockBean
	private RecipeRepository recipeRepository;

	@BeforeEach
	void resetMocks() {
		Mockito.reset(recipeRepository);
	}

	@Test
	void contextLoads() {
	}

	@Test
	void createRecipe_returnsOkAndBody_whenAuthenticatedWithCsrf() throws Exception {
		when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> {
			Recipe recipe = invocation.getArgument(0, Recipe.class);
			ReflectionTestUtils.setField(recipe, "id", 1L);
			return recipe;
		});

		mockMvc.perform(
				post("/recipes")
					.with(user("testuser").roles("USER"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipeJson()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.title").value("Test Recipe"))
			.andExpect(jsonPath("$.source.name").value("Test Kitchen"))
			.andExpect(jsonPath("$.instruction.prepTime").value(10))
			.andExpect(jsonPath("$.instruction.cookTime").value(25))
			.andExpect(jsonPath("$.instruction.steps['1']").value("Step one"))
			.andExpect(jsonPath("$.ingredients[0]").value("2 cups flour"))
			.andExpect(jsonPath("$.ingredients[1]").value("1 cup sugar"));
	}

	@Test
	void createRecipe_returnsForbidden_withoutCsrf() throws Exception {
		mockMvc.perform(
				post("/recipes")
					.with(user("testuser").roles("USER"))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipeJson()))
			.andExpect(status().isForbidden());
	}

	@Test
	void deleteRecipe_returnsNoContent_whenRecipeExists() throws Exception {
		when(recipeRepository.existsById(1L)).thenReturn(true);
		doNothing().when(recipeRepository).deleteById(1L);

		mockMvc.perform(
				delete("/recipes/{id}", 1L)
					.with(user("testuser").roles("USER"))
					.with(csrf()))
			.andExpect(status().isNoContent());

		verify(recipeRepository, times(1)).existsById(1L);
		verify(recipeRepository, times(1)).deleteById(1L);
	}

	@Test
	void deleteRecipe_returnsNotFound_whenRecipeDoesNotExist() throws Exception {
		when(recipeRepository.existsById(999L)).thenReturn(false);

		mockMvc.perform(
				delete("/recipes/{id}", 999L)
					.with(user("testuser").roles("USER"))
					.with(csrf()))
			.andExpect(status().isNotFound());

		verify(recipeRepository, times(1)).existsById(999L);
		verify(recipeRepository, times(0)).deleteById(999L);
	}

	@Test
	void deleteRecipe_requiresAuthentication() throws Exception {
		// If the user is not authenticated, the request should return 401 Unauthorized
		mockMvc.perform(
				delete("/recipes/{id}", 1L)
					.with(csrf()))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void updateRecipe_returnsOkAndUpdatedBody_whenRecipeExists() throws Exception {
		Recipe existing = new Recipe();
		ReflectionTestUtils.setField(existing, "id", 1L);
		ReflectionTestUtils.setField(existing, "title", "Old Title");

		when(recipeRepository.findById(1L)).thenReturn(Optional.of(existing));
		when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> invocation.getArgument(0));

		mockMvc.perform(
				put("/recipes/{id}", 1L)
					.with(user("testuser").roles("USER"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipeJson()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.title").value("Test Recipe"))
			.andExpect(jsonPath("$.instruction.prepTime").value(10))
			.andExpect(jsonPath("$.instruction.cookTime").value(25))
			.andExpect(jsonPath("$.ingredients[0]").value("2 cups flour"));

		verify(recipeRepository, times(1)).findById(1L);
		verify(recipeRepository, times(1)).save(any(Recipe.class));
	}

	@Test
	void updateRecipe_returnsNotFound_whenRecipeDoesNotExist() throws Exception {
		when(recipeRepository.findById(999L)).thenReturn(Optional.empty());

		mockMvc.perform(
				put("/recipes/{id}", 999L)
					.with(user("testuser").roles("USER"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipeJson()))
			.andExpect(status().isNotFound());

		verify(recipeRepository, times(1)).findById(999L);
		verify(recipeRepository, times(0)).save(any(Recipe.class));
	}

	@Test
	void updateRecipe_returnsForbidden_withoutCsrf() throws Exception {
		mockMvc.perform(
				put("/recipes/{id}", 1L)
					.with(user("testuser").roles("USER"))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipeJson()))
			.andExpect(status().isForbidden());
	}

	@Test
	void updateRecipe_requiresAuthentication() throws Exception {
		mockMvc.perform(
				put("/recipes/{id}", 1L)
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(validRecipeJson()))
			.andExpect(status().isUnauthorized());
	}

	@Test
    void getRecipe_returnsRecipe_whenRecipeExists() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setTitle("Test Recipe");
        
        when(recipeRepository.findById(1L)).thenReturn(Optional.of(recipe));

        mockMvc.perform(get("/recipes/{id}", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.title").value("Test Recipe"));
    }

    @Test
    void getRecipe_returnsNotFound_whenRecipeDoesNotExist() throws Exception {
        when(recipeRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/recipes/{id}", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }

    @Test
    void getAllRecipes_returnsAllRecipes() throws Exception {
        Recipe recipe1 = new Recipe();
        recipe1.setId(1L);
        recipe1.setTitle("Recipe 1");
        Recipe recipe2 = new Recipe();
        recipe2.setId(2L);
        recipe2.setTitle("Recipe 2");
        
        when(recipeRepository.findAll()).thenReturn(Arrays.asList(recipe1, recipe2));

        mockMvc.perform(get("/recipes").with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].title").value("Recipe 1"))
            .andExpect(jsonPath("$[1].id").value(2L))
            .andExpect(jsonPath("$[1].title").value("Recipe 2"));
    }

    @Test
    void getByIngredient_returnsFilteredRecipes() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setTitle("Flour-based Recipe");
        
        when(recipeRepository.findByIngredient("flour")).thenReturn(Arrays.asList(recipe));

        mockMvc.perform(get("/recipes/by-ingredient")
                .param("ingredient", "flour").with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].title").value("Flour-based Recipe"));
    }

    @Test
    void getByIngredients_returnsFilteredRecipes() throws Exception {
        Recipe recipe1 = new Recipe();
        recipe1.setId(1L);
        recipe1.setTitle("Flour Recipe");
        
        Recipe recipe2 = new Recipe();
        recipe2.setId(2L);
        recipe2.setTitle("Sugar Recipe");

        when(recipeRepository.findByIngredient("flour")).thenReturn(Arrays.asList(recipe1));
        when(recipeRepository.findByIngredient("sugar")).thenReturn(Arrays.asList(recipe2));

        mockMvc.perform(get("/recipes/by-ingredients")
                .param("ingredientList", "flour")
                .param("ingredientList", "sugar").with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].title").value("Flour Recipe"))
            .andExpect(jsonPath("$[1].id").value(2L))
            .andExpect(jsonPath("$[1].title").value("Sugar Recipe"));
    }

    @Test
    void getByTime_returnsRecipesFilteredByMaxTime() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(1L);
        recipe.setTitle("Quick Recipe");
        
        when(recipeRepository.findByMaxTotalTime(30)).thenReturn(Arrays.asList(recipe));

        mockMvc.perform(get("/recipes/by-time")
                .param("maxTime", "30").with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].title").value("Quick Recipe"));
    }

	private static String validRecipeJson() {
		// Ratings are left out for now because the Rating entity requires a linked Recipe,
		// which would need additional back-reference setup in the request payload
		return """
			{
			"title": "Test Recipe",
			"source": { "name": "Test Kitchen" },
			"instruction": {
				"prepTime": 10,
				"cookTime": 25,
				"steps": {
				"1": "Step one",
				"2": "Step two"
				}
			},
			"ingredients": ["2 cups flour", "1 cup sugar"]
			}
			""";
	}
}