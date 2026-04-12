package com.yeschef.api.DTO;

import com.yeschef.api.model.User;

// Returned after a successful signup or login.
// The frontend should store the accessToken and attach it to future requests
// as: Authorization: Bearer <accessToken>
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private AuthUserDTO user;

    public AuthResponse(String accessToken, String refreshToken, User user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = new AuthUserDTO(user);
    }

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public AuthUserDTO getUser() { return user; }
}
