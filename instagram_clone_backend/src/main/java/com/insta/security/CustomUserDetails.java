package com.insta.security;

import com.insta.model.User;

public class CustomUserDetails {
    private Long id;
    private String email;
    private String password;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }
}
