package com.yeschef.api.service;

import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    private final UserRepository userRepository;

    // RestTemplate is used to make HTTP calls to the Supabase Auth API
    private final RestTemplate restTemplate = new RestTemplate();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Registers a new user with Supabase Auth, then creates a matching local user row.
    // Returns the Supabase access token and the new local user.
    public AuthResponse signup(AuthRequest request) {
        HttpHeaders headers = buildHeaders();

        Map<String, String> body = new HashMap<>();
        body.put("email", request.getEmail());
        body.put("password", request.getPassword());

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/signup",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            Map<String, Object> responseBody = response.getBody();
            String accessToken = (String) responseBody.get("access_token");
            @SuppressWarnings("unchecked")
            String supabaseId = (String) ((Map<String, Object>) responseBody.get("user")).get("id");

            // Create the local user profile linked to the Supabase auth account
            User user = new User();
            user.setSupabaseId(supabaseId);
            user.setUsername(request.getUsername());
            User savedUser = userRepository.save(user);

            return new AuthResponse(accessToken, savedUser);

        } catch (HttpClientErrorException e) {
            // Forward any error from Supabase (e.g. email already in use) back to the client
            throw new ResponseStatusException(e.getStatusCode(), e.getResponseBodyAsString());
        }
    }

    // Authenticates an existing user with Supabase Auth and returns their local profile.
    public AuthResponse login(AuthRequest request) {
        HttpHeaders headers = buildHeaders();

        Map<String, String> body = new HashMap<>();
        body.put("email", request.getEmail());
        body.put("password", request.getPassword());

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/token?grant_type=password",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            Map<String, Object> responseBody = response.getBody();
            String accessToken = (String) responseBody.get("access_token");
            @SuppressWarnings("unchecked")
            String supabaseId = (String) ((Map<String, Object>) responseBody.get("user")).get("id");

            // Look up the local user by their Supabase UUID
            User user = userRepository.findBySupabaseId(supabaseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "No local user found for this Supabase account"));

            return new AuthResponse(accessToken, user);

        } catch (HttpClientErrorException e) {
            // Forward any error from Supabase (e.g. wrong password) back to the client
            throw new ResponseStatusException(e.getStatusCode(), e.getResponseBodyAsString());
        }
    }

    // Builds the headers required by the Supabase Auth API
    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseAnonKey);
        return headers;
    }
}
