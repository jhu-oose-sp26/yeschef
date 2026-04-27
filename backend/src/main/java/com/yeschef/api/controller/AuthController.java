package com.yeschef.api.controller;

import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Handles signup and login. These endpoints are public — no JWT required.
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /auth/signup — registers with Supabase and creates a local user profile.
    // Always returns 201 with a message — email confirmation is required before the user can log in.
    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(@RequestBody AuthRequest request) {
        authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Check your email to confirm your account"));
    }

    // POST /auth/login — authenticates with Supabase and returns the user's local profile.
    // Returns 403 if the user exists but hasn't confirmed their email yet.
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // POST /auth/refresh — exchanges a refresh token for a new access + refresh token pair.
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.refresh(body.get("refreshToken")));
    }

    // POST /auth/resend-confirmation — resends the Supabase signup confirmation email.
    @PostMapping("/resend-confirmation")
    public ResponseEntity<Map<String, String>> resendConfirmation(@RequestBody Map<String, String> body) {
        authService.resendConfirmation(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "If that email is registered, a confirmation email has been resent."));
    }

    // POST /auth/forgot-password — sends a Supabase password reset email. Always returns 200
    // regardless of whether the email is registered (prevents user enumeration).
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> body) {
        authService.forgotPassword(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "If that email is registered, a password reset link has been sent."));
    }

    // PUT /auth/update-password — updates the authenticated user's password via Supabase.
    // The SupabaseJwtFilter has already validated the bearer token; we forward it to Supabase
    // so it can perform the update on behalf of the authenticated user.
    @PutMapping("/update-password")
    public ResponseEntity<Map<String, String>> updatePassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "No authentication token provided."));
        }
        authService.updatePassword(body.get("newPassword"), authHeader.substring(7));
        return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
    }

}
