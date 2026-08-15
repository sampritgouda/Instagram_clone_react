package com.insta.controller;

import com.insta.dto.AuthRequest;
import com.insta.dto.AuthResponse;
import com.insta.dto.RegisterRequest;
import com.insta.model.User;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.EmailService;

import java.util.Optional;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

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
    private final EmailService emailService;

    // Stores OTP details in-memory: email -> OtpData (otpCode, expireTimestamp)
    private static final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    private static class OtpData {
        String code;
        long expireTime;

        OtpData(String code, long expireTime) {
            this.code = code;
            this.expireTime = expireTime;
        }
    }

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }
        if (userRepository.findByUsername(req.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username is already taken"));
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setIsPrivate(false);
        user.setProfilePicUrl("https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg");
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getProfilePicUrl(), user.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // authenticate (will throw if invalid)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtUtil.generateToken(request.getEmail());
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        return ResponseEntity.ok(new AuthResponse(token, user.getProfilePicUrl(), user.getId()));
    }

    // ── OTP PASSWORD RESET ENDPOINTS ──

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No account found with this email address"));
        }

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", new Random().nextInt(900000) + 100000);
        long expireTime = System.currentTimeMillis() + (5 * 60 * 1000); // 5 minutes validity
        otpStorage.put(email.trim().toLowerCase(), new OtpData(otpCode, expireTime));

        // Send Email via Resend API (onboarding@resend.dev)
        boolean emailSent = emailService.sendOtpEmail(email.trim(), otpCode);

        return ResponseEntity.ok(Map.of(
            "message", "OTP sent successfully to " + email,
            "emailSent", emailSent
        ));

    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and OTP are required"));
        }

        OtpData data = otpStorage.get(email.trim().toLowerCase());
        if (data == null || System.currentTimeMillis() > data.expireTime) {
            return ResponseEntity.badRequest().body(Map.of("message", "OTP code expired or invalid. Please request a new code."));
        }

        if (!data.code.equals(otp.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid OTP verification code"));
        }

        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        if (email == null || otp == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "Valid email, OTP, and password (at least 6 chars) are required"));
        }

        OtpData data = otpStorage.get(email.trim().toLowerCase());
        if (data == null || !data.code.equals(otp.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired session. Please restart OTP verification."));
        }

        User user = userRepository.findByEmail(email.trim()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        // Update password & clear OTP storage
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpStorage.remove(email.trim().toLowerCase());

        return ResponseEntity.ok(Map.of("message", "Password reset successfully! You can now log in."));
    }
}

