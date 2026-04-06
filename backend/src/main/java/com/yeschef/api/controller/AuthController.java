package com.yeschef.api.controller;

import com.yeschef.api.DTO.AuthRequest;
import com.yeschef.api.DTO.AuthResponse;
import com.yeschef.api.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Handles signup and login. These endpoints are public — no JWT required.
// On success, both return an access token the frontend should attach to future requests.
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /auth/signup — registers with Supabase and creates a local user profile
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    // POST /auth/login — authenticates with Supabase and returns the user's local profile
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
