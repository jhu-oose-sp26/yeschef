package com.yeschef.api.seed;

import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class RecipeSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RecipeSeedRunner.class);

    private final RecipeImportService recipeImportService;
    private final Environment environment;

    public RecipeSeedRunner(RecipeImportService recipeImportService, Environment environment) {
        this.recipeImportService = recipeImportService;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean seedFlag = args.containsOption("seed-recipes")
                || Arrays.stream(args.getSourceArgs()).anyMatch("--seed-recipes"::equalsIgnoreCase);
        boolean seedProfile = Arrays.stream(environment.getActiveProfiles())
                .anyMatch("seed"::equalsIgnoreCase);

        if (!seedFlag && !seedProfile) {
            return;
        }

        log.info("Recipe seed importer started");
        RecipeImportSummary summary = recipeImportService.importAllRecipes();
        log.info("Recipe seed importer finished");
        log.info("Summary: total files scanned={}", summary.totalFilesScanned());
        log.info("Summary: recipes imported={}", summary.recipesImported());
        log.info("Summary: duplicates skipped={}", summary.duplicatesSkipped());
        log.info("Summary: failures={}", summary.failures());
    }
}
