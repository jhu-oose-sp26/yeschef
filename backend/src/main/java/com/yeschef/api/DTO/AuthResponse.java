package com.yeschef.api.DTO;

import com.yeschef.api.model.User;

// Returned after a successful signup or login.
// The frontend should store the accessToken and attach it to future requests
// as: Authorization: Bearer <accessToken>
public class AuthResponse {

    private String accessToken;
    private AuthUserDTO user;

    public AuthResponse(String accessToken, User user) {
        this.accessToken = accessToken;
        this.user = new AuthUserDTO(user);
    }

    public String getAccessToken() { return accessToken; }
    public AuthUserDTO getUser() { return user; }
}
