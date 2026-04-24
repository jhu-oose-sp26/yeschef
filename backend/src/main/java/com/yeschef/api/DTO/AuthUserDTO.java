package com.yeschef.api.DTO;

import com.yeschef.api.model.User;

/** Minimal user payload returned after login / signup — avoids serializing lazy JPA collections. */
public class AuthUserDTO {

    private Long id;
    private String username;
    private String supabaseId;

    public AuthUserDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.supabaseId = user.getSupabaseId() != null ? user.getSupabaseId().toString() : null;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getSupabaseId() { return supabaseId; }
}
