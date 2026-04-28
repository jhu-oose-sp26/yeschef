package com.yeschef.api.seed;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yeschef.api.model.Instruct;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.RecipeSourceRepository;
import com.yeschef.api.seed.GitHubRecipeClient.RecipeRemoteFile;

@Service
public class RecipeImportService {

    private static final Logger log = LoggerFactory.getLogger(RecipeImportService.class);

    // Matches "X minutes", "X hours", and "X to Y minutes/hours" in directions text.
    // Group 1: optional range lower bound (ignored — we take the upper bound).
    // Group 2: the value to use (upper bound of a range, or the single value).
    // Group 3: the time unit (hours? or minutes?/mins?).
    private static final Pattern TIME_PATTERN = Pattern.compile(
            "(?:(\\d+)\\s+to\\s+)?(\\d+)\\s+(hours?|minutes?|mins?)",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern LEADING_QUANTITY_PATTERN = Pattern.compile(
            "^\\s*((?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+(?:\\.\\d+)?)"
                    + "(?:\\s*(?:-|to)\\s*(?:\\d+/\\d+|\\d+(?:\\.\\d+)?))?"
                    + "(?:\\s+(?:cups?|tbsp\\.?|tablespoons?|tsp\\.?|teaspoons?|ounces?|oz\\.?|"
                    + "pounds?|lbs?\\.?|cloves?|cans?|packages?|pkgs?\\.?|pinch|dash|grams?|g|kg|ml|l))?)\\s+(.+)$",
            Pattern.CASE_INSENSITIVE);

    private final GitHubRecipeClient gitHubRecipeClient;
    private final RecipeRepository recipeRepository;
    private final RecipeSourceRepository recipeSourceRepository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public RecipeImportService(
            GitHubRecipeClient gitHubRecipeClient,
            RecipeRepository recipeRepository,
            RecipeSourceRepository recipeSourceRepository,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager) {
        this.gitHubRecipeClient = gitHubRecipeClient;
        this.recipeRepository = recipeRepository;
        this.recipeSourceRepository = recipeSourceRepository;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public RecipeImportSummary importAllRecipes() {
        List<RecipeRemoteFile> files = new ArrayList<>(gitHubRecipeClient.discoverRecipeFiles());
        Collections.shuffle(files);
        int scanned = 0;
        int imported = 0;
        int duplicates = 0;
        int failures = 0;

        for (RecipeRemoteFile file : files) {
            scanned++;
            if (scanned % 250 == 0) {
                log.info("Import progress: scanned={} imported={} duplicates={} failures={}",
                        scanned, imported, duplicates, failures);
            }

            ImportOutcome outcome;
            try {
                outcome = transactionTemplate.execute(status -> importSingleRecipe(file));
            } catch (Exception e) {
                log.warn("Failed to import {}: {}", file.path(), e.getMessage());
                failures++;
                continue;
            }

            if (outcome == ImportOutcome.IMPORTED) {
                imported++;
            } else if (outcome == ImportOutcome.DUPLICATE) {
                duplicates++;
            } else {
                failures++;
            }
        }

        return new RecipeImportSummary(scanned, imported, duplicates, failures);
    }

    private ImportOutcome importSingleRecipe(RecipeRemoteFile file) {
        ExternalRecipeDTO external;
        try {
            String json = gitHubRecipeClient.downloadRecipeJson(file.path());
            external = objectMapper.readValue(json, ExternalRecipeDTO.class);
        } catch (Exception e) {
            log.warn("Malformed JSON in {}: {}", file.path(), e.getMessage());
            return ImportOutcome.FAILED;
        }

        String title = normalize(external.getTitle());
        List<String> ingredientLines = normalizeList(external.getIngredients());
        List<String> directions = normalizeList(external.getDirections());

        if (title == null || ingredientLines.isEmpty() || directions.isEmpty()) {
            log.warn("Skipping malformed recipe {} (title/ingredients/directions missing)", file.path());
            return ImportOutcome.FAILED;
        }

        String sourceUrl = firstNonBlank(normalize(external.getUrl()), file.rawUrl());
        if (recipeRepository.existsByTitleAndSourceApiUrl(title, sourceUrl)) {
            return ImportOutcome.DUPLICATE;
        }

        RecipeSource source = new RecipeSource();
        source.setSourceType(RecipeSource.SourceType.API);
        source.setApi_url(sourceUrl);
        source.setUser(null);
        source = recipeSourceRepository.save(source);

        Recipe recipe = new Recipe();
        recipe.setTitle(title);
        recipe.setSource(source);
        recipe.setIngredients(mapIngredients(ingredientLines));

        Instruct instruct = new Instruct();
        instruct.setRecipe(recipe);
        instruct.setPrepTime(0);
        Integer extractedMinutes = extractTotalMinutes(directions);
        instruct.setCookTime(extractedMinutes != null ? extractedMinutes : 0);
        instruct.setSteps(mapDirections(directions));
        recipe.setInstruction(instruct);

        recipeRepository.save(recipe);
        return ImportOutcome.IMPORTED;
    }

    private List<Recipe.Ingredient> mapIngredients(List<String> lines) {
        List<Recipe.Ingredient> ingredients = new ArrayList<>();
        for (String line : lines) {
            ParsedIngredient parsed = parseIngredientLine(line);
            ingredients.add(new Recipe.Ingredient(parsed.ingredientText(), parsed.quantity()));
        }
        return ingredients;
    }

    private List<Instruct.InstructionStep> mapDirections(List<String> directions) {
        List<Instruct.InstructionStep> steps = new ArrayList<>();
        int stepNumber = 1;
        for (String direction : directions) {
            steps.add(new Instruct.InstructionStep(stepNumber, direction));
            stepNumber++;
        }
        return steps;
    }

    private static Integer extractTotalMinutes(List<String> directions) {
        int total = 0;
        for (String step : directions) {
            Matcher m = TIME_PATTERN.matcher(step);
            while (m.find()) {
                int value = Integer.parseInt(m.group(2));
                String unit = m.group(3).toLowerCase();
                total += unit.startsWith("hour") ? value * 60 : value;
            }
        }
        return total > 0 ? total : null;
    }

    private ParsedIngredient parseIngredientLine(String line) {
        Matcher matcher = LEADING_QUANTITY_PATTERN.matcher(line);
        if (matcher.matches()) {
            String quantity = normalize(matcher.group(1));
            String ingredientText = normalize(matcher.group(2));
            if (ingredientText != null) {
                return new ParsedIngredient(ingredientText, quantity);
            }
        }
        return new ParsedIngredient(line, null);
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        List<String> cleaned = new ArrayList<>();
        for (String value : values) {
            String normalized = normalize(value);
            if (normalized != null) {
                cleaned.add(normalized);
            }
        }
        return cleaned;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    private enum ImportOutcome {
        IMPORTED,
        DUPLICATE,
        FAILED
    }

    private record ParsedIngredient(String ingredientText, String quantity) {
    }
}
