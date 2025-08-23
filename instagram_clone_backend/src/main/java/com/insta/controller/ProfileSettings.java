package com.insta.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.model.User;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/profile/setting")
@RequiredArgsConstructor
public class ProfileSettings {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    // ✅ Get details
    @GetMapping("/details")
    public ResponseEntity<?> getDetails(@RequestHeader("Authorization") String authHeader) {
        User user = userService.getUserByToken(authHeader);
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail()
        ));
    }

    // ✅ Update details
    @PutMapping("/details")
    public ResponseEntity<?> updateDetails(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
       User user = userService.getUserByToken(authHeader);

        user.setUsername(body.getOrDefault("username", user.getUsername()));
        user.setEmail(body.getOrDefault("email", user.getEmail()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Details updated successfully"));
    }

    // ✅ Change password
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body) {
        User user = userService.getUserByToken(authHeader);

        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Old password is incorrect"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    
}
