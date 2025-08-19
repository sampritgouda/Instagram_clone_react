package com.insta.service;


import org.springframework.stereotype.Service;

import com.insta.model.User;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
	
	private final JwtUtil jwtUtil;
	private final UserRepository userRepository;

	public User getUserByToken(String authHeader)
	{
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			return null;
		}

		String token = authHeader.substring(7);

		String email = jwtUtil.extractUsername(token);

		User user = userRepository.findByEmail(email).orElse(null);

		return user;

	}
}
