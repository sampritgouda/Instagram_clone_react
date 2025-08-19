package com.insta.controller;

import com.insta.dto.AuthRequest;
import com.insta.dto.AuthResponse;
import com.insta.dto.RegisterRequest;
import com.insta.model.User;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Registered");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // authenticate (will throw if invalid)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtUtil.generateToken(request.getEmail());
         User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return ResponseEntity.ok(new AuthResponse(token,user.getProfilePicUrl(),user.getId()));
    }
}
