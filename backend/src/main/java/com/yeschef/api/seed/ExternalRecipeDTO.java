package com.yeschef.api.seed;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ExternalRecipeDTO {

    private String title;
    private String source;
    private String url;
    private List<String> ingredients;
    private List<String> directions;

    public String getTitle() {
        return title;
    }

    public String getSource() {
        return source;
    }

    public String getUrl() {
        return url;
    }

    public List<String> getIngredients() {
        return ingredients;
    }

    public List<String> getDirections() {
        return directions;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public void setIngredients(List<String> ingredients) {
        this.ingredients = ingredients;
    }

    public void setDirections(List<String> directions) {
        this.directions = directions;
    }
}
