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