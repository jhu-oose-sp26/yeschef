package com.yeschef.api;

import com.yeschef.api.controller.UserController;
import com.yeschef.api.model.User;
import com.yeschef.api.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserController.class)
@Import(UserControllerTests.TestSecurityConfig.class)
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

    @MockBean
    private UserRepository userRepository;

    @BeforeEach
    void resetMocks() {
        Mockito.reset(userRepository);
    }

    // --- GET /users ---

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
            .andExpect(jsonPath("$[0].id").value(1L))
            .andExpect(jsonPath("$[0].username").value("alice"))
            .andExpect(jsonPath("$[1].id").value(2L))
            .andExpect(jsonPath("$[1].username").value("bob"));
    }

    @Test
    void getAllUsers_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/users"))
            .andExpect(status().isUnauthorized());
    }

    // --- GET /users/{id} ---

    @Test
    void getUser_returnsUser_whenUserExists() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("alice");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/users/{id}", 1L).with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void getUser_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/users/{id}", 999L).with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }

    @Test
    void getUser_requiresAuthentication() throws Exception {
        mockMvc.perform(get("/users/{id}", 1L))
            .andExpect(status().isUnauthorized());
    }

    // --- POST /users ---

    @Test
    void createUser_returnsOk_whenUsernameIsNew() throws Exception {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(1L);
            return u;
        });

        mockMvc.perform(
                post("/users")
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"alice\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void createUser_returnsConflict_whenUsernameAlreadyExists() throws Exception {
        User existing = new User();
        existing.setId(1L);
        existing.setUsername("alice");

        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(existing));

        mockMvc.perform(
                post("/users")
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"alice\"}"))
            .andExpect(status().isConflict());

        verify(userRepository, never()).save(any());
    }

    @Test
    void createUser_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                post("/users")
                    .with(user("testuser").roles("USER"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"alice\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void createUser_requiresAuthentication() throws Exception {
        mockMvc.perform(
                post("/users")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"alice\"}"))
            .andExpect(status().isUnauthorized());
    }

    // --- PUT /users/{id} ---

    @Test
    void updateUser_returnsOk_whenUserExistsAndUsernameIsFree() throws Exception {
        User existing = new User();
        existing.setId(1L);
        existing.setUsername("alice");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("alice_updated")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(
                put("/users/{id}", 1L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"alice_updated\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1L))
            .andExpect(jsonPath("$.username").value("alice_updated"));
    }

    @Test
    void updateUser_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(
                put("/users/{id}", 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"newname\"}"))
            .andExpect(status().isNotFound());

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_returnsConflict_whenNewUsernameAlreadyTaken() throws Exception {
        User existing = new User();
        existing.setId(1L);
        existing.setUsername("alice");

        User other = new User();
        other.setId(2L);
        other.setUsername("bob");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(other));

        mockMvc.perform(
                put("/users/{id}", 1L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"bob\"}"))
            .andExpect(status().isConflict());

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUser_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                put("/users/{id}", 1L)
                    .with(user("testuser").roles("USER"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"newname\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void updateUser_requiresAuthentication() throws Exception {
        mockMvc.perform(
                put("/users/{id}", 1L)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\": \"newname\"}"))
            .andExpect(status().isUnauthorized());
    }

    // --- DELETE /users/{id} ---

    @Test
    void deleteUser_returnsNoContent_whenUserExists() throws Exception {
        when(userRepository.existsById(1L)).thenReturn(true);
        doNothing().when(userRepository).deleteById(1L);

        mockMvc.perform(
                delete("/users/{id}", 1L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNoContent());

        verify(userRepository, times(1)).existsById(1L);
        verify(userRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteUser_returnsNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(
                delete("/users/{id}", 999L)
                    .with(user("testuser").roles("USER"))
                    .with(csrf()))
            .andExpect(status().isNotFound());

        verify(userRepository, times(1)).existsById(999L);
        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void deleteUser_returnsForbidden_withoutCsrf() throws Exception {
        mockMvc.perform(
                delete("/users/{id}", 1L)
                    .with(user("testuser").roles("USER")))
            .andExpect(status().isForbidden());
    }

    @Test
    void deleteUser_requiresAuthentication() throws Exception {
        mockMvc.perform(
                delete("/users/{id}", 1L)
                    .with(csrf()))
            .andExpect(status().isUnauthorized());
    }
}
