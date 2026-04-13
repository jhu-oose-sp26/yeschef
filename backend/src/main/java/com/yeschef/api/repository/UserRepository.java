package com.yeschef.api.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // Look up a user by their Supabase UUID (used to resolve the local user from a JWT)
    Optional<User> findBySupabaseId(UUID supabaseId);

    // Returns true if a local user profile already exists for the given Supabase UUID.
    boolean existsBySupabaseId(UUID supabaseId);

    // Look up a user by their username (used to check if a user already exists)
    Optional<User> findByUsername(String username);
}
