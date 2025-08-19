package com.insta.config;

import com.insta.security.CustomUserDetailsService;
import com.insta.security.JwtAuthenticationEntryPoint;
import com.insta.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint entryPoint;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter,
                          JwtAuthenticationEntryPoint entryPoint) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.entryPoint = entryPoint;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // explicitly link bean
            .exceptionHandling(ex -> ex.authenticationEntryPoint(entryPoint))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/h2-console/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // allow preflight
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions().disable());

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true); // works since we are specifying origins
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }


    // Password encoder bean
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager (used to authenticate credentials in controller)
    @Bean
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider daoAuth = new DaoAuthenticationProvider();
        daoAuth.setUserDetailsService(userDetailsService);
        daoAuth.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(daoAuth);
    }

   

}
