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
import java.util.stream.Collectors;

import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.model.Friendship;
import com.yeschef.api.repository.FriendshipRepository;

// This controller exposes REST endpoints related to users.
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    public UserController(UserRepository userRepository, FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
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

    // FRIENDSHIP CONTROLLER
    // GET: get list of the ids of all of a user's friends from a user's id
    @GetMapping("/{id}/friends")
    public ResponseEntity<List<String>> getFriends(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(user -> {
                List<String> friends = user.getFriendships().stream()
                    .map(f -> f.getFriend().getId().equals(id) ? f.getSelf().getUsername() : f.getFriend().getUsername())
                    .distinct()
                    .collect(Collectors.toList());
                return ResponseEntity.ok(friends);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // POST: make a new friendship
    @PostMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> addFriend(@PathVariable Long id, @PathVariable Long friendId) {
        if (id.equals(friendId)) return ResponseEntity.badRequest().build();

        Optional<User> selfMaybe = userRepository.findById(id);
        Optional<User> friendMaybe = userRepository.findById(friendId);

        if (selfMaybe.isEmpty() || friendMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User self = selfMaybe.get();
        User friend = friendMaybe.get();

        // Check if already exists
        if (friendshipRepository.findBySelfAndFriend(self, friend).isPresent()) {
            return ResponseEntity.status(409).build();
        }

        Friendship friendship = new Friendship();
        friendship.setSelf(self);
        friendship.setFriend(friend);
        friendshipRepository.save(friendship);

        return ResponseEntity.ok().build();
    }

    // DELETE: delete a friendship
    @DeleteMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> removeFriend(@PathVariable Long id, @PathVariable Long friendId) {
        Optional<User> selfMaybe = userRepository.findById(id);
        Optional<User> friendMaybe = userRepository.findById(friendId);

        if (selfMaybe.isEmpty() || friendMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<Friendship> connection = friendshipRepository.findBySelfAndFriend(selfMaybe.get(), friendMaybe.get());
        
        if (connection.isPresent()) {
            friendshipRepository.delete(connection.get());
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.notFound().build();
    }
}
