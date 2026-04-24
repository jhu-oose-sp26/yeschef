package com.yeschef.api.DTO;

// Incoming request body for both signup and login.
// Username is only used during signup to set the user's display name.
public class AuthRequest {

    private String email;
    private String password;
    private String username;

    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getUsername() { return username; }

    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setUsername(String username) { this.username = username; }
}
