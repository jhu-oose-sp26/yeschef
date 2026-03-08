package com.yeschef.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;

// This controller exposes REST endpoints related to users.
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Handle GET requests to /users
    // Returns all users
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // Handle GET requests to /users/{id}
    // Returns a single user by their ID
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        Optional<User> userMaybe = userRepository.findById(id);
        if (userMaybe.isPresent()) {
            return ResponseEntity.ok(userMaybe.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Handle POST requests to /users
    // Creates a new user. Returns 409 Conflict if the username already exists.
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        Optional<User> existing = userRepository.findByUsername(user.getUsername());
        if (existing.isPresent()) {
            return ResponseEntity.status(409).build();
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    // Handle PUT requests to /users/{id}
    // Updates a user's username. Returns 409 Conflict if the new username is already taken.
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        Optional<User> userMaybe = userRepository.findById(id);
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> usernameTaken = userRepository.findByUsername(updatedUser.getUsername());
        if (usernameTaken.isPresent()) {
            return ResponseEntity.status(409).build();
        }

        User existing = userMaybe.get();
        existing.setUsername(updatedUser.getUsername());
        return ResponseEntity.ok(userRepository.save(existing));
    }

    // Handle DELETE requests to /users/{id}
    // Deletes a user and all their associated likes, saves, and ratings (via cascade).
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
