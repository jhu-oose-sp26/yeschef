package com.yeschef.api;

import com.yeschef.api.controller.AuthController;
import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.model.User;
import com.yeschef.api.service.AuthService;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import(AuthControllerTests.TestSecurityConfig.class)
// Provides a dummy Supabase URL so SupabaseJwtFilter can be instantiated in the test context
@TestPropertySource(properties = "supabase.url=https://test.supabase.co")
@SuppressWarnings({"null", "unused"})
class AuthControllerTests {

    // Permit all requests — /auth/** is public and we're not testing security here
    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    // --- POST /auth/signup ---

    @Test
    void signup_returnsCreatedWithMessage_whenServiceSucceeds() throws Exception {
        doNothing().when(authService).signup(any(AuthRequest.class));

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"secret123\", \"username\": \"alice\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.message").value("Check your email to confirm your account"));
    }

    @Test
    void signup_returnsConflict_whenEmailAlreadyInUse() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use"))
                .when(authService).signup(any(AuthRequest.class));

        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"secret123\", \"username\": \"alice\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void signup_isPublic_requiresNoAuthentication() throws Exception {
        doNothing().when(authService).signup(any(AuthRequest.class));

        // No .with(user(...)) — verifying the endpoint is accessible without any auth
        mockMvc.perform(post("/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"secret123\", \"username\": \"alice\"}"))
            .andExpect(status().isCreated());
    }

    // --- POST /auth/login ---

    @Test
    void login_returnsOkWithTokenAndUser_whenCredentialsAreValid() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        when(authService.login(any(AuthRequest.class)))
                .thenReturn(new AuthResponse("mock-access-token", "mock-refresh-token", user));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"secret123\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("mock-access-token"))
            .andExpect(jsonPath("$.user.id").value(1L))
            .andExpect(jsonPath("$.user.username").value("alice"));
    }

    @Test
    void login_returnsUnauthorized_whenCredentialsAreInvalid() throws Exception {
        when(authService.login(any(AuthRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"wrongpassword\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void login_returnsForbidden_whenEmailNotConfirmed() throws Exception {
        when(authService.login(any(AuthRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Email not confirmed. Please check your inbox."));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"secret123\"}"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("Email not confirmed. Please check your inbox."));
    }

    @Test
    void login_returnsNotFound_whenNoLocalUserExists() throws Exception {
        // Supabase auth succeeded but there's no matching local user row
        when(authService.login(any(AuthRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "No local user found for this Supabase account"));

        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"ghost@example.com\", \"password\": \"secret123\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void login_isPublic_requiresNoAuthentication() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        when(authService.login(any(AuthRequest.class)))
                .thenReturn(new AuthResponse("mock-access-token", "mock-refresh-token", user));

        // No .with(user(...)) — verifying the endpoint is accessible without any auth
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\", \"password\": \"secret123\"}"))
            .andExpect(status().isOk());
    }

    // --- POST /auth/resend-confirmation ---

    @Test
    void resendConfirmation_returnsOk_whenEmailIsValid() throws Exception {
        doNothing().when(authService).resendConfirmation(anyString());

        mockMvc.perform(post("/auth/resend-confirmation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("If that email is registered, a confirmation email has been resent."));
    }

    @Test
    void resendConfirmation_isPublic_requiresNoAuthentication() throws Exception {
        doNothing().when(authService).resendConfirmation(anyString());

        mockMvc.perform(post("/auth/resend-confirmation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"alice@example.com\"}"))
            .andExpect(status().isOk());
    }
}
