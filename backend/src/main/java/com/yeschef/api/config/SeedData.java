package com.yeschef.api.config;

import com.yeschef.api.model.Instruct;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.RecipeSourceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Inserts sample recipes when the database has none (e.g. fresh run or empty DB).
 * Run with default profile so it doesn't run in tests unless desired.
 */
@Component
@Order(1)
public class SeedData implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedData.class);

    private final RecipeRepository recipeRepository;
    private final RecipeSourceRepository recipeSourceRepository;

    public SeedData(RecipeRepository recipeRepository, RecipeSourceRepository recipeSourceRepository) {
        this.recipeRepository = recipeRepository;
        this.recipeSourceRepository = recipeSourceRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (recipeRepository.count() > 0) {
            log.debug("Recipes already present, skipping seed data.");
            return;
        }

        log.info("No recipes found. Seeding sample recipes.");

        RecipeSource apiSource = new RecipeSource();
        apiSource.setSourceType(RecipeSource.SourceType.API);
        apiSource.setApi_url("https://cooking.nytimes.com");
        apiSource = recipeSourceRepository.save(apiSource);

        RecipeSource userSource = new RecipeSource();
        userSource.setSourceType(RecipeSource.SourceType.USER);
        userSource = recipeSourceRepository.save(userSource);

        // Recipe 1: Simple pasta
        Recipe pasta = new Recipe();
        pasta.setTitle("Easy Garlic Pasta");
        pasta.setSource(apiSource);
        pasta.setIngredients(List.of(
            new Recipe.Ingredient("spaghetti", "400 g"),
            new Recipe.Ingredient("garlic", "4 cloves"),
            new Recipe.Ingredient("olive oil", "3 tbsp"),
            new Recipe.Ingredient("parmesan", "to taste"),
            new Recipe.Ingredient("salt and pepper", null)
        ));
        Instruct pastaInstruct = new Instruct();
        pastaInstruct.setPrepTime(5);
        pastaInstruct.setCookTime(15);
        pastaInstruct.setSteps(List.of(
            new Instruct.InstructionStep(1, "Bring a large pot of salted water to boil. Cook spaghetti until al dente, then drain."),
            new Instruct.InstructionStep(2, "While pasta cooks, thinly slice the garlic. Heat olive oil in a pan over medium heat."),
            new Instruct.InstructionStep(3, "Add garlic and cook until fragrant, about 1 minute. Do not brown."),
            new Instruct.InstructionStep(4, "Toss drained pasta with the garlic oil. Add grated parmesan, salt, and pepper. Serve.")
        ));
        pasta = recipeRepository.save(pasta);
        pastaInstruct.setRecipe(pasta);
        pasta.setInstruction(pastaInstruct);
        recipeRepository.save(pasta);

        // Recipe 2: Sheet-pan chicken
        Recipe chicken = new Recipe();
        chicken.setTitle("Sheet-Pan Lemon Herb Chicken");
        chicken.setSource(apiSource);
        chicken.setIngredients(List.of(
            new Recipe.Ingredient("chicken thighs", "4"),
            new Recipe.Ingredient("lemon", "2"),
            new Recipe.Ingredient("olive oil", "2 tbsp"),
            new Recipe.Ingredient("rosemary", "1 tbsp fresh"),
            new Recipe.Ingredient("thyme", "1 tbsp fresh"),
            new Recipe.Ingredient("garlic", "3 cloves"),
            new Recipe.Ingredient("salt and pepper", null)
        ));
        Instruct chickenInstruct = new Instruct();
        chickenInstruct.setPrepTime(10);
        chickenInstruct.setCookTime(35);
        chickenInstruct.setSteps(List.of(
            new Instruct.InstructionStep(1, "Preheat oven to 425°F (220°C). Pat chicken thighs dry and place on a large sheet pan."),
            new Instruct.InstructionStep(2, "Drizzle with olive oil. Zest and juice one lemon over the chicken; slice the second lemon and tuck around the chicken."),
            new Instruct.InstructionStep(3, "Sprinkle with chopped rosemary, thyme, minced garlic, salt, and pepper. Toss to coat."),
            new Instruct.InstructionStep(4, "Roast 35–40 minutes until chicken is golden and cooked through. Rest 5 minutes before serving.")
        ));
        chicken = recipeRepository.save(chicken);
        chickenInstruct.setRecipe(chicken);
        chicken.setInstruction(chickenInstruct);
        recipeRepository.save(chicken);

        // Recipe 3: User-created style
        Recipe oatmeal = new Recipe();
        oatmeal.setTitle("Cinnamon Banana Oatmeal");
        oatmeal.setSource(userSource);
        oatmeal.setIngredients(List.of(
            new Recipe.Ingredient("rolled oats", "1 cup"),
            new Recipe.Ingredient("milk or water", "2 cups"),
            new Recipe.Ingredient("banana", "1 ripe"),
            new Recipe.Ingredient("cinnamon", "1/2 tsp"),
            new Recipe.Ingredient("honey or maple syrup", "to taste")
        ));
        Instruct oatmealInstruct = new Instruct();
        oatmealInstruct.setPrepTime(2);
        oatmealInstruct.setCookTime(8);
        oatmealInstruct.setSteps(List.of(
            new Instruct.InstructionStep(1, "Combine oats and milk (or water) in a small pot. Bring to a simmer over medium heat."),
            new Instruct.InstructionStep(2, "Slice the banana and add half to the pot. Stir in cinnamon. Cook 5–8 minutes, stirring occasionally, until creamy."),
            new Instruct.InstructionStep(3, "Serve in a bowl. Top with remaining banana slices and drizzle with honey or maple syrup.")
        ));
        oatmeal = recipeRepository.save(oatmeal);
        oatmealInstruct.setRecipe(oatmeal);
        oatmeal.setInstruction(oatmealInstruct);
        recipeRepository.save(oatmeal);

        log.info("Seeded {} sample recipes.", recipeRepository.count());
    }
}
