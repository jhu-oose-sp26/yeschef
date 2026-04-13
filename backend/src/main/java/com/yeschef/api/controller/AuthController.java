package com.yeschef.api.controller;

import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.service.AuthService;
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

}
