package com.insta.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // Use a long random secret in production. Keep in application.properties or env var.
    private final Key key = Keys.hmacShaKeyFor("rhgjgiuggk5ugg5g5uu5gjt5gj5gjh6yg5gy6ghg5655yu6u5kkhk5k5th".getBytes());
    private final long validityInMs = 1000 * 60 * 60 * 24; // 24h

    public String generateToken(String subject) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + validityInMs);

        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
