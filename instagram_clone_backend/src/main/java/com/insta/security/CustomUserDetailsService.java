package com.insta.security;


import com.insta.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // note: Spring's "username" is actually email in our app
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    	System.out.println(email);
        com.insta.model.User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return new User(u.getEmail(), u.getPassword(), Collections.emptyList());
    }
}
