package com.yeschef.api.service;

import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    private final UserRepository userRepository;

    private final RestTemplate restTemplate = createRestTemplate();

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        return new RestTemplate(factory);
    }

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Registers a new user with Supabase Auth and creates a matching local user row.
    // Always returns without a session — email confirmation is required before the user can log in.
    public void signup(AuthRequest request) {
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

            if (responseBody == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Supabase returned null response body");
            }

            UUID supabaseId = null;

            // Try to extract id from "user" node
            @SuppressWarnings("unchecked")
            Map<String, Object> userNode = (Map<String, Object>) responseBody.get("user");
            if (userNode != null && userNode.get("id") instanceof String) {
                supabaseId = UUID.fromString((String) userNode.get("id"));
            }

            // If not found, try top-level "id"
            if (supabaseId == null && responseBody.get("id") instanceof String) {
                supabaseId = UUID.fromString((String) responseBody.get("id"));
            }

            if (supabaseId == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Could not extract user id from Supabase response");
            }

            // Create the local user profile immediately via JPA.
            // Do not rely on a Supabase JWT/session here, because confirm-email mode
            // returns user info without a session.
            if (!userRepository.existsBySupabaseId(supabaseId)) {
                User newUser = new User();
                newUser.setSupabaseId(supabaseId);
                newUser.setUsername(request.getUsername());
                userRepository.save(newUser);
            }

        } catch (HttpClientErrorException e) {
            log.error("Supabase signup error: {}", e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many signup attempts. Please wait before trying again.");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Signup failed. Please try again.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected signup error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Signup failed. Please try again.");
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
            String refreshToken = (String) responseBody.get("refresh_token");
            @SuppressWarnings("unchecked")
            UUID supabaseId = UUID.fromString((String) ((Map<String, Object>) responseBody.get("user")).get("id"));

            User user = userRepository.findBySupabaseId(supabaseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "No local user found for this Supabase account"));

            return new AuthResponse(accessToken, refreshToken, user);

        } catch (HttpClientErrorException e) {
            log.error("Supabase login error: {}", e.getResponseBodyAsString());
            String errorBody = e.getResponseBodyAsString();
            // Supabase returns 400 with error_code "email_not_confirmed" for unconfirmed accounts
            if (errorBody.contains("email_not_confirmed") || errorBody.contains("Email not confirmed")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Email not confirmed. Please check your inbox.");
            }
            if (e.getStatusCode().value() == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many login attempts. Please wait before trying again.");
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid email or password.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected login error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Login failed. Please try again.");
        }
    }

    // Exchanges a Supabase refresh token for a new access + refresh token pair.
    public AuthResponse refresh(String refreshToken) {
        HttpHeaders headers = buildHeaders();

        Map<String, String> body = new HashMap<>();
        body.put("refresh_token", refreshToken);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/token?grant_type=refresh_token",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Supabase returned null response body");
            }
            String newAccessToken = (String) responseBody.get("access_token");
            String newRefreshToken = (String) responseBody.get("refresh_token");
            @SuppressWarnings("unchecked")
            Map<String, Object> userNode = (Map<String, Object>) responseBody.get("user");
            if (userNode == null || !(userNode.get("id") instanceof String)) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Could not extract user id from Supabase refresh response");
            }
            UUID supabaseId = UUID.fromString((String) userNode.get("id"));

            User user = userRepository.findBySupabaseId(supabaseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "No local user found for this Supabase account"));

            return new AuthResponse(newAccessToken, newRefreshToken, user);

        } catch (HttpClientErrorException e) {
            log.error("Supabase token refresh error: {}", e.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Session expired. Please log in again.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected token refresh error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Token refresh failed. Please try again.");
        }
    }

    // Asks Supabase to resend the signup confirmation email.
    public void resendConfirmation(String email) {
        HttpHeaders headers = buildHeaders();

        Map<String, String> body = new HashMap<>();
        body.put("type", "signup");
        body.put("email", email);

        try {
            restTemplate.exchange(
                    supabaseUrl + "/auth/v1/resend",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (HttpClientErrorException e) {
            log.error("Supabase resend confirmation error: {}", e.getResponseBodyAsString());
            if (e.getStatusCode().value() == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many resend attempts. Please wait before trying again.");
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to resend confirmation email. Please try again.");
        } catch (Exception e) {
            log.error("Unexpected resend confirmation error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to resend confirmation email. Please try again.");
        }
    }

    private HttpHeaders buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", supabaseAnonKey);
        headers.setBearerAuth(supabaseAnonKey);
        return headers;
    }
}
