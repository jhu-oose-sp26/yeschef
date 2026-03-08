package com.yeschef.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yeschef.api.model.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // Look up a user by their username (used to check if a user already exists)
    Optional<User> findByUsername(String username);
}
