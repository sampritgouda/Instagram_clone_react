package com.insta.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class CheckController {

	private final JwtUtil jwtUtil;
	@PostMapping("/code")
	public ResponseEntity<?> testing(@RequestHeader("Authorization") String authHeader)
	{
		String token = authHeader.substring(7);
        System.out.println(token);
        System.out.println("hiiiiiiiiiiiiiii");
        String email = jwtUtil.extractUsername(token);
		return ResponseEntity.ok().body(email);
	}
}
