package com.yeschef.api.seed;

public record RecipeImportSummary(
        int totalFilesScanned,
        int recipesImported,
        int duplicatesSkipped,
        int failures) {
}
