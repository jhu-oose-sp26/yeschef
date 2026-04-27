package com.yeschef.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import com.yeschef.api.controller.UserController;
import com.yeschef.api.model.Friendship;
import com.yeschef.api.model.HasLiked;
import com.yeschef.api.model.Recipe;
import com.yeschef.api.model.RecipeSource;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.FriendshipRepository;
import com.yeschef.api.repository.RecipeRepository;
import com.yeschef.api.repository.UserRepository;
import com.yeschef.api.service.AuthenticatedUserService;
import com.yeschef.api.service.NotificationService;
import com.yeschef.api.model.Notification;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.any;

@WebMvcTest(controllers = UserController.class)
@Import(UserControllerTests.TestSecurityConfig.class)
@TestPropertySource(properties = "supabase.url=https://test.supabase.co")
@SuppressWarnings({"null", "unused"})
class UserControllerTests {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                .csrf(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .formLogin(AbstractHttpConfigurer::disable);
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private FriendshipRepository friendshipRepository;

    @MockitoBean
    private RecipeRepository recipeRepository;

    @MockitoBean
    private AuthenticatedUserService authenticatedUserService;
    
    @MockitoBean
    private NotificationService notificationService;

    @BeforeEach
    void resetMocks() {
        reset(userRepository, friendshipRepository, recipeRepository,
            authenticatedUserService, notificationService);
    }

    @Test
    void getAllUsers_returnsAllUsers() throws Exception {
        User user1 = new User();
        user1.setId(1L);
        user1.setUsername("alice");

        User user2 = new User();
        user2.setId(2L);
        user2.setUsername("bob");

        when(userRepository.findAll()).thenReturn(Arrays.asList(user1, user2));

        mockMvc.perform(get("/users").with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].username").value("alice"))
            .andExpect(jsonPath("$[1].username").value("bob"));
    }

    @Test
    void updateUser_returnsOk_whenUserOwnsAccount() throws Exception {
        User existing = new User();
        existing.setId(1L);
        existing.setUsername("alice");

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(existing);
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("alice_updated")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/users/{id}", 1L)
                .with(user("testuser").roles("USER"))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\": \"alice_updated\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("alice_updated"));
    }

    @Test
    void updateUser_returnsForbidden_whenUserTargetsDifferentAccount() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(1L);

        mockMvc.perform(put("/users/{id}", 1L)
                .with(authentication(new UsernamePasswordAuthenticationToken("different-user", null)))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\": \"newname\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void deleteUser_returnsNoContent_whenUserOwnsAccount() throws Exception {
        User existing = new User();
        existing.setId(1L);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(existing);
        when(userRepository.existsById(1L)).thenReturn(true);
        doNothing().when(userRepository).deleteById(1L);

        mockMvc.perform(delete("/users/{id}", 1L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());
    }

    @Test
    void addFriend_returnsOk_whenUsersExist() throws Exception {
        User alice = new User();
        alice.setId(1L);

        User bob = new User();
        bob.setId(2L);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(alice);
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));
        when(friendshipRepository.findBySelfAndFriend(alice, bob)).thenReturn(Optional.empty());

        mockMvc.perform(post("/users/{id}/friends/{friendId}", 1L, 2L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(friendshipRepository, times(2)).save(any(Friendship.class));
    }

    @Test
    void addFriend_returnsForbidden_whenUserTargetsDifferentAccount() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "You may only modify your own account"))
            .when(authenticatedUserService).requireCurrentUser(1L);

        mockMvc.perform(post("/users/{id}/friends/{friendId}", 1L, 2L)
                .with(authentication(new UsernamePasswordAuthenticationToken("different-user", null)))
                .with(csrf()))
            .andExpect(status().isForbidden());
    }

    @Test
    void getUserRecipes_returnsRecipesCreatedByUser() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(42L);
        recipe.setTitle("Alice Soup");

        when(userRepository.existsById(1L)).thenReturn(true);
        when(recipeRepository.findByUserId(1L)).thenReturn(java.util.Collections.singletonList(recipe));

        mockMvc.perform(get("/users/{id}/recipes", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(42L));
    }

    @Test
    void getFriendsLikedRecipes_returnsRecipesLikedByFriend() throws Exception {
        Recipe recipe = new Recipe();
        recipe.setId(100L);
        recipe.setTitle("Tacos");

        when(userRepository.existsById(1L)).thenReturn(true);
        when(recipeRepository.findLikedByFriendsOf(1L)).thenReturn(java.util.Collections.singletonList(recipe));

        mockMvc.perform(get("/users/{id}/friends/liked", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("Tacos"));
    }

    // test notification for friendship
    @Test
    void addFriend_createsFriendshipAndSendsNotification() throws Exception {
        User alice = new User();
        alice.setId(1L);

        User bob = new User();
        bob.setId(2L);

        when(authenticatedUserService.requireCurrentUser(1L)).thenReturn(alice);
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        when(friendshipRepository.findBySelfAndFriend(alice, bob))
                .thenReturn(Optional.empty());
        when(friendshipRepository.findBySelfAndFriend(bob, alice))
                .thenReturn(Optional.empty());

        when(friendshipRepository.save(any(Friendship.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(post("/users/{id}/friends/{friendId}", 1L, 2L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNoContent());

        verify(friendshipRepository, times(2)).save(any(Friendship.class));

        verify(notificationService, times(1)).createNotification(
                eq(bob),
                eq(alice),
                eq(Notification.Type.FRIEND_REQUEST),
                isNull()
        );
    }

    // no notif on faillure
    @Test
    void addFriend_doesNotSendNotification_whenUsersNotFound() throws Exception {

        when(authenticatedUserService.requireCurrentUser(1L))
                .thenReturn(new User());

        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        mockMvc.perform(post("/users/{id}/friends/{friendId}", 1L, 2L)
                .with(user("testuser").roles("USER"))
                .with(csrf()))
            .andExpect(status().isNotFound());

        verify(notificationService, never())
                .createNotification(any(), any(), any(), any());
    }
}
