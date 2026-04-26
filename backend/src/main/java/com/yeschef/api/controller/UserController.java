package com.yeschef.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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

import com.yeschef.api.model.HasLiked;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.model.Friendship;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.repository.FriendshipRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.service.AuthenticatedUserService;
import com.yeschef.api.service.NotificationService;
import com.yeschef.api.model.Notification;

// This controller exposes REST endpoints related to users.
@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final RecipeRepository recipeRepository;
    private final AuthenticatedUserService authenticatedUserService;
    private final NotificationService notificationService;

    public UserController(UserRepository userRepository,
                          FriendshipRepository friendshipRepository,
                          RecipeRepository recipeRepository,
                          AuthenticatedUserService authenticatedUserService,
                          NotificationService notificationService) {
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.recipeRepository = recipeRepository;
        this.authenticatedUserService = authenticatedUserService;
        this.notificationService = notificationService;
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
        authenticatedUserService.requireCurrentUser(id);
        Optional<User> userMaybe = userRepository.findById(id);
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Optional<User> usernameTaken = userRepository.findByUsername(updatedUser.getUsername());
        if (usernameTaken.isPresent() && !usernameTaken.get().getId().equals(id)) {
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
        authenticatedUserService.requireCurrentUser(id);
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
                List<String> friends = user.getFriendshipsSent().stream()
                    .map(f -> f.getFriend().getUsername())
                    .collect(Collectors.toList());
                return ResponseEntity.ok(friends);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // POST: make a new friendship
    @PostMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> addFriend(@PathVariable Long id, @PathVariable Long friendId) {
        authenticatedUserService.requireCurrentUser(id);
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

        // Create both directions so the friendship is automatically mutual
        Friendship friendship = new Friendship();
        friendship.setSelf(self);
        friendship.setFriend(friend);
        friendshipRepository.save(friendship);

        if (friendshipRepository.findBySelfAndFriend(friend, self).isEmpty()) {
            Friendship reverse = new Friendship();
            reverse.setSelf(friend);
            reverse.setFriend(self);
            friendshipRepository.save(reverse);
        }

        // notify
        notificationService.createNotification(
            friend,
            self, 
            Notification.Type.FRIEND_REQUEST,
            null // not necessary
        );

        return ResponseEntity.ok().build();
    }

    // DELETE: delete a friendship
    @DeleteMapping("/{id}/friends/{friendId}")
    public ResponseEntity<Void> removeFriend(@PathVariable Long id, @PathVariable Long friendId) {
        authenticatedUserService.requireCurrentUser(id);
        Optional<User> selfMaybe = userRepository.findById(id);
        Optional<User> friendMaybe = userRepository.findById(friendId);

        if (selfMaybe.isEmpty() || friendMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Delete both directions to fully remove the mutual friendship
        Optional<Friendship> forward = friendshipRepository.findBySelfAndFriend(selfMaybe.get(), friendMaybe.get());
        forward.ifPresent(friendshipRepository::delete);

        Optional<Friendship> reverse = friendshipRepository.findBySelfAndFriend(friendMaybe.get(), selfMaybe.get());
        reverse.ifPresent(friendshipRepository::delete);

        return ResponseEntity.noContent().build();
    }

    // GET: get all recipes created by a user
    @GetMapping("/{id}/recipes")
    public ResponseEntity<List<Recipe>> getUserRecipes(@PathVariable Long id) {
        Optional<User> userMaybe = userRepository.findById(id);
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        List<RecipeSource> userSources = userMaybe.get().getRecipeSources();
        if (userSources == null || userSources.isEmpty()) {
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
        return ResponseEntity.ok(recipeRepository.findBySourceIn(userSources));
    }

    // GET: get all recipes liked by a user's friends
    @GetMapping("/{id}/friends/liked")
    public ResponseEntity<List<Recipe>> getFriendsLikedRecipes(@PathVariable Long id) {
        Optional<User> userMaybe = userRepository.findById(id);
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userMaybe.get();

        List<Recipe> likedByFriends = user.getFriendshipsSent().stream()
                .map(Friendship::getFriend)
                .flatMap(friend -> friend.getLikes().stream())
                .map(HasLiked::getRecipe)
                .distinct()
                .collect(Collectors.toList());

        return ResponseEntity.ok(likedByFriends);
    }

    // GET: get a user's friend's recipes
    // Returns list of recipes from all users this user is friends w/
    @GetMapping("/{id}/friends/recipes")
    public ResponseEntity<List<Recipe>> getFriendsRecipes(@PathVariable Long id) {
        Optional<User> userMaybe = userRepository.findById(id); // find user
        if (userMaybe.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userMaybe.get();

        List<RecipeSource> friendsSources = user.getFriendshipsSent().stream()
                .map(Friendship::getFriend) // get user's friend
                .flatMap(friend -> friend.getRecipeSources().stream()) // get recipe sources for friend
                .collect(Collectors.toList());

        // if friend has no recipes
        if (friendsSources.isEmpty()) {
            List<Recipe> emptyList = new java.util.ArrayList<>();
            return ResponseEntity.ok(emptyList);
        }

        // get all the recipes friends made
        List<Recipe> allFriendsRecipes = recipeRepository.findBySourceIn(friendsSources);
        return ResponseEntity.ok(allFriendsRecipes);
    }
}
