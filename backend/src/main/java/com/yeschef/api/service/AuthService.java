package com.yeschef.api.service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = createRestTemplate();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private static RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        return new RestTemplate(factory);
    }

    public void signup(AuthRequest request) {
        String requestedUsername = normalizedUsername(request.getUsername());
        if (requestedUsername == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
        }
        if (userRepository.findByUsername(requestedUsername).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use.");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("email", request.getEmail());
        body.put("password", request.getPassword());
        body.put("data", Map.of("username", requestedUsername));

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/signup",
                    HttpMethod.POST,
                    new HttpEntity<>(body, buildHeaders()),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Supabase returned null response body");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> userNode = (Map<String, Object>) responseBody.get("user");
            UUID supabaseId = extractSupabaseId(userNode, responseBody);
            ensureLocalUser(supabaseId, userNode, request.getEmail(), requestedUsername, false);

        } catch (HttpClientErrorException e) {
            log.error("Supabase signup error: {}", e.getResponseBodyAsString());
            String errorBody = e.getResponseBodyAsString();
            if (errorBody.contains("User already registered") || errorBody.contains("already been registered")) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use.");
            }
            if (e.getStatusCode().value() == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many signup attempts. Please wait before trying again.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Signup failed. Please try again.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected signup error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Signup failed. Please try again.");
        }
    }

    public AuthResponse login(AuthRequest request) {
        Map<String, String> body = new HashMap<>();
        body.put("email", request.getEmail());
        body.put("password", request.getPassword());

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/token?grant_type=password",
                    HttpMethod.POST,
                    new HttpEntity<>(body, buildHeaders()),
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {});

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Supabase returned null response body");
            }

            String accessToken = (String) responseBody.get("access_token");
            String refreshToken = (String) responseBody.get("refresh_token");
            @SuppressWarnings("unchecked")
            Map<String, Object> userNode = (Map<String, Object>) responseBody.get("user");
            UUID supabaseId = extractSupabaseId(userNode, responseBody);
            User user = ensureLocalUser(supabaseId, userNode, request.getEmail(), request.getUsername(), true);

            return new AuthResponse(accessToken, refreshToken, user);

        } catch (HttpClientErrorException e) {
            log.error("Supabase login error: {}", e.getResponseBodyAsString());
            String errorBody = e.getResponseBodyAsString();
            if (errorBody.contains("email_not_confirmed") || errorBody.contains("Email not confirmed")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Email not confirmed. Please check your inbox.");
            }
            if (e.getStatusCode().value() == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many login attempts. Please wait before trying again.");
            }
            if (e.getStatusCode().value() >= 500) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Authentication provider unavailable. Please try again.");
            }
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected login error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Login failed. Please try again.");
        }
    }

    public AuthResponse refresh(String refreshToken) {
        Map<String, String> body = new HashMap<>();
        body.put("refresh_token", refreshToken);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    supabaseUrl + "/auth/v1/token?grant_type=refresh_token",
                    HttpMethod.POST,
                    new HttpEntity<>(body, buildHeaders()),
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
            UUID supabaseId = extractSupabaseId(userNode, responseBody);
            User user = ensureLocalUser(supabaseId, userNode, null, null, true);

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

    public void resendConfirmation(String email) {
        Map<String, String> body = new HashMap<>();
        body.put("type", "signup");
        body.put("email", email);

        try {
            restTemplate.exchange(
                    supabaseUrl + "/auth/v1/resend",
                    HttpMethod.POST,
                    new HttpEntity<>(body, buildHeaders()),
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

    private UUID extractSupabaseId(Map<String, Object> userNode, Map<String, Object> responseBody) {
        if (userNode != null && userNode.get("id") instanceof String userId) {
            return UUID.fromString(userId);
        }
        if (responseBody.get("id") instanceof String topLevelId) {
            return UUID.fromString(topLevelId);
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Could not extract user id from Supabase response");
    }

    private User ensureLocalUser(UUID supabaseId,
                                 Map<String, Object> userNode,
                                 String email,
                                 String requestedUsername,
                                 boolean allowGeneratedUsername) {
        return userRepository.findBySupabaseId(supabaseId).orElseGet(() -> {
            String preferredUsername = firstNonBlank(
                    normalizedUsername(requestedUsername),
                    normalizedUsername(extractUserMetadataUsername(userNode)),
                    usernameFromEmail(email));

            if (preferredUsername == null) {
                preferredUsername = "chef-" + supabaseId.toString().substring(0, 8);
            }

            User newUser = new User();
            newUser.setSupabaseId(supabaseId);
            newUser.setUsername(resolveAvailableUsername(preferredUsername, supabaseId, allowGeneratedUsername));
            try {
                return userRepository.save(newUser);
            } catch (DataIntegrityViolationException ex) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Username already in use. Please choose a different username.");
            }
        });
    }

    private String resolveAvailableUsername(String preferredUsername, UUID supabaseId, boolean allowGeneratedUsername) {
        if (userRepository.findByUsername(preferredUsername).isEmpty()) {
            return preferredUsername;
        }
        if (!allowGeneratedUsername) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use.");
        }

        String candidate = preferredUsername + "-" + supabaseId.toString().substring(0, 8);
        if (userRepository.findByUsername(candidate).isEmpty()) {
            return candidate;
        }

        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Could not create a local profile for this account.");
    }

    private String extractUserMetadataUsername(Map<String, Object> userNode) {
        if (userNode == null) {
            return null;
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> userMetadata = (Map<String, Object>) userNode.get("user_metadata");
        if (userMetadata == null) {
            return null;
        }
        Object username = userMetadata.get("username");
        return username instanceof String ? ((String) username).trim() : null;
    }

    private String usernameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return null;
        }
        return email.substring(0, email.indexOf('@')).trim().toLowerCase();
    }

    private String normalizedUsername(String username) {
        if (username == null) {
            return null;
        }
        String trimmed = username.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
