package com.insta.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${resend.api.key:re_123456789}")
    private String resendApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean sendOtpEmail(String toEmail, String otpCode) {
        try {
            String url = "https://api.resend.com/emails";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + resendApiKey);

            Map<String, Object> body = Map.of(
                "from", "Trend <onboarding@resend.dev>",
                "to", List.of(toEmail),
                "subject", "Your Trend App - Reset Password OTP Code",
                "html", "<div style='font-family: Arial, sans-serif; padding: 20px; background-color: #121212; color: #ffffff; border-radius: 10px; max-width: 450px; margin: auto;'>" +
                        "<h2 style='color: #ff9900; text-align: center;'>Trend App</h2>" +
                        "<p>You requested a password reset. Use the following 6-digit OTP code to reset your password:</p>" +
                        "<div style='background-color: #1e1e1e; padding: 15px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #0095f6; margin: 20px 0;'>" + otpCode + "</div>" +
                        "<p style='color: #888; font-size: 12px; text-align: center;'>This OTP code is valid for 5 minutes. If you did not request this, please ignore this email.</p>" +
                        "</div>"
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            System.err.println("Failed to send email via Resend API: " + e.getMessage());
            return false;
        }
    }
}
