package com.yeschef.api;

import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.yeschef.api.controller.RecipeController;
import com.yeschef.api.model.Instruct;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.RecipeSourceRepository;
import com.yeschef.api.repository.UserRepository;

@WebMvcTest(controllers = RecipeController.class)
@Import({
    ApiApplicationTests.TestJacksonConfig.class,
    ApiApplicationTests.TestSecurityConfig.class
})
// Provides a dummy Supabase URL so SupabaseJwtFilter can be instantiated in the test context
@TestPropertySource(properties = "supabase.url=https://test.supabase.co")
@SuppressWarnings({"null", "unused"})
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
	@MockitoBean
	private RecipeRepository recipeRepository;

	@MockitoBean
	private RecipeSourceRepository sourceRepository;

	@MockitoBean
	private UserRepository userRepository;

	@BeforeEach
	void resetMocks() {
		Mockito.reset(recipeRepository);
		Mockito.reset(sourceRepository);
		Mockito.reset(userRepository);
	}

	@Test
	void contextLoads() {
	}

	@Test
    void testCreateRecipe() throws Exception {
        String recipeJson = """
        {
          "title": "Chocolate Cake",
          "sourceType": "USER",
          "prepTime": 20,
          "cookTime": 30,
          "ingredients": [
            { "ingredient": "Flour", "quantity": "2 cups" },
            { "ingredient": "Sugar", "quantity": "1 cup" },
            { "ingredient": "Cocoa Powder", "quantity": "5 tbsp" }
          ],
          "steps": [
            { "stepNumber": 1, "stepDescription": "Mix dry ingredients." },
            { "stepNumber": 2, "stepDescription": "Add wet ingredients." }
          ]
        }
        """;

        when(sourceRepository.save(any(RecipeSource.class))).thenAnswer(invocation -> {
            RecipeSource s = invocation.getArgument(0);
            ReflectionTestUtils.setField(s, "id", 1L);
            return s;
        });
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> {
            Recipe r = invocation.getArgument(0, Recipe.class);
            ReflectionTestUtils.setField(r, "id", 1L);
            return r;
        });

        mockMvc.perform(post("/recipes")
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(recipeJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Chocolate Cake"))
                .andExpect(jsonPath("$.ingredients[0].ingredient").value("Flour"));
    }

	@Test
	void createRecipe_returnsOkAndBody_whenAuthenticatedWithCsrf() throws Exception {
		when(sourceRepository.save(any(RecipeSource.class))).thenAnswer(invocation -> {
			RecipeSource s = invocation.getArgument(0);
			ReflectionTestUtils.setField(s, "id", 1L);
			return s;
		});
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
			.andExpect(jsonPath("$.source").value("USER"))
			.andExpect(jsonPath("$.prepTime").value(10))
			.andExpect(jsonPath("$.cookTime").value(25))
			.andExpect(jsonPath("$.steps[0].stepDescription").value("Step one"))
			.andExpect(jsonPath("$.ingredients[0].ingredient").value("2 cups flour"))
			.andExpect(jsonPath("$.ingredients[1].ingredient").value("1 cup sugar"));
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
					.content(validUpdateRecipeJson()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.title").value("Test Recipe"));

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
					.content(validUpdateRecipeJson()))
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
					.content(validUpdateRecipeJson()))
			.andExpect(status().isForbidden());
	}

	@Test
	void updateRecipe_requiresAuthentication() throws Exception {
		mockMvc.perform(
				put("/recipes/{id}", 1L)
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(validUpdateRecipeJson()))
			.andExpect(status().isUnauthorized());
	}

	@Test
    void getRecipe_returnsRecipe_whenRecipeExists() throws Exception {
        Recipe recipe = minimalRecipe(1L, "Test Recipe");

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
        Recipe recipe1 = minimalRecipe(1L, "Recipe 1");
        Recipe recipe2 = minimalRecipe(2L, "Recipe 2");

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

	@Test
	void createRecipe_linksUser_whenUserIdProvided() throws Exception {
		User user = new User();
		user.setId(1L);
		user.setUsername("alice");

		when(userRepository.findById(1L)).thenReturn(Optional.of(user));
		when(sourceRepository.save(any(RecipeSource.class))).thenAnswer(invocation -> {
			RecipeSource s = invocation.getArgument(0);
			ReflectionTestUtils.setField(s, "id", 1L);
			return s;
		});
		when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> {
			Recipe r = invocation.getArgument(0, Recipe.class);
			ReflectionTestUtils.setField(r, "id", 1L);
			return r;
		});

		String json = """
			{
			"title": "Alice's Pasta",
			"sourceType": "USER",
			"userId": 1,
			"prepTime": 10,
			"cookTime": 20,
			"steps": [{"stepNumber": 1, "stepDescription": "Boil water"}],
			"ingredients": [{"ingredient": "pasta", "quantity": "200g"}]
			}
			""";

		mockMvc.perform(post("/recipes")
				.with(user("testuser").roles("USER"))
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(json))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("Alice's Pasta"));

		verify(userRepository, times(1)).findById(1L);
	}

	@Test
	void createRecipe_returnsNotFound_whenUserIdDoesNotExist() throws Exception {
		when(userRepository.findById(99L)).thenReturn(Optional.empty());
		when(sourceRepository.save(any(RecipeSource.class))).thenAnswer(invocation -> {
			RecipeSource s = invocation.getArgument(0);
			ReflectionTestUtils.setField(s, "id", 1L);
			return s;
		});

		String json = """
			{
			"title": "Ghost Recipe",
			"sourceType": "USER",
			"userId": 99,
			"prepTime": 5,
			"cookTime": 10,
			"steps": [{"stepNumber": 1, "stepDescription": "Do something"}],
			"ingredients": [{"ingredient": "air", "quantity": "1 cup"}]
			}
			""";

		mockMvc.perform(post("/recipes")
				.with(user("testuser").roles("USER"))
				.with(csrf())
				.contentType(MediaType.APPLICATION_JSON)
				.content(json))
			.andExpect(status().isNotFound());
	}

	// Creates a minimal Recipe with the fields toDTO() requires to avoid NPEs
	private static Recipe minimalRecipe(Long id, String title) {
		Recipe recipe = new Recipe();
		recipe.setId(id);
		recipe.setTitle(title);
		RecipeSource source = new RecipeSource();
		source.setSourceType(RecipeSource.SourceType.USER);
		recipe.setSource(source);
		Instruct instruct = new Instruct();
		ReflectionTestUtils.setField(instruct, "steps", new java.util.ArrayList<>());
		recipe.setInstruction(instruct);
		recipe.setIngredients(new java.util.ArrayList<>());
		return recipe;
	}

	// JSON for POST /recipes (RecipeRequestDTO format)
	private static String validRecipeJson() {
		return """
			{
			"title": "Test Recipe",
			"sourceType": "USER",
			"prepTime": 10,
			"cookTime": 25,
			"steps": [
				{"stepNumber": 1, "stepDescription": "Step one"},
				{"stepNumber": 2, "stepDescription": "Step two"}
			],
			"ingredients": [
				{"ingredient": "2 cups flour", "quantity": "2 cups"},
				{"ingredient": "1 cup sugar", "quantity": "1 cup"}
			]
			}
			""";
	}

	// JSON for PUT /recipes/{id} (Recipe entity format)
	private static String validUpdateRecipeJson() {
		return """
			{
			"title": "Test Recipe",
			"source": {"sourceType": "USER"},
			"instruction": {
				"prepTime": 10,
				"cookTime": 25,
				"steps": [
					{"stepNumber": 1, "stepDescription": "Step one"}
				]
			},
			"ingredients": [
				{"ingredient": "2 cups flour", "quantity": "2 cups"}
			]
			}
			""";
	}
}
