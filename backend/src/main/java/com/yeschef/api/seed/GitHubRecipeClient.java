package com.yeschef.api.seed;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class GitHubRecipeClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubRecipeClient.class);

    private static final String CONTENTS_API_BASE = "https://api.github.com/repos/dpapathanasiou/recipes/contents/";
    private static final String RAW_BASE = "https://raw.githubusercontent.com/dpapathanasiou/recipes/master/";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GitHubRecipeClient(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
        this.objectMapper = objectMapper;
    }

    public List<RecipeRemoteFile> discoverRecipeFiles() {
        List<RecipeRemoteFile> files = new ArrayList<>();
        Deque<String> stack = new ArrayDeque<>();
        stack.push("index");

        while (!stack.isEmpty()) {
            String currentPath = stack.pop();
            List<GitHubContentEntry> entries = listContents(currentPath);
            for (GitHubContentEntry entry : entries) {
                if ("dir".equalsIgnoreCase(entry.type())) {
                    stack.push(entry.path());
                } else if ("file".equalsIgnoreCase(entry.type()) && entry.name().endsWith(".json")) {
                    files.add(new RecipeRemoteFile(entry.path(), rawUrl(entry.path())));
                }
            }
        }

        files.sort(Comparator.comparing(RecipeRemoteFile::path));
        log.info("Discovered {} candidate recipe JSON files from GitHub", files.size());
        return files;
    }

    public String downloadRecipeJson(String path) {
        return getText(rawUrl(path));
    }

    public String rawUrl(String path) {
        return RAW_BASE + path;
    }

    private List<GitHubContentEntry> listContents(String path) {
        String response = getText(CONTENTS_API_BASE + path);
        try {
            List<Map<String, Object>> rawEntries = objectMapper.readValue(
                    response, new TypeReference<List<Map<String, Object>>>() {
                    });

            List<GitHubContentEntry> entries = new ArrayList<>();
            for (Map<String, Object> row : rawEntries) {
                String name = asString(row.get("name"));
                String rowPath = asString(row.get("path"));
                String type = asString(row.get("type"));
                if (name == null || rowPath == null || type == null) {
                    continue;
                }
                entries.add(new GitHubContentEntry(name, rowPath, type));
            }
            return entries;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to parse GitHub contents response for path: " + path, e);
        }
    }

    private String getText(String url) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));
            headers.set("User-Agent", "yeschef-recipe-seeder");
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            return response.getBody();
        } catch (RestClientException e) {
            throw new IllegalStateException("Request failed for URL: " + url, e);
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    public record RecipeRemoteFile(String path, String rawUrl) {
    }

    private record GitHubContentEntry(String name, String path, String type) {
    }
}
