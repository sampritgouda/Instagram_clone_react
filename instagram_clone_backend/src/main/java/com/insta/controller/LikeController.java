package com.insta.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.insta.model.Like;
import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.LikeRepository;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/like")
public class LikeController {

	private final JwtUtil jwtUtil;
	private final UserRepository userRepository;
	private final LikeRepository likeRepository;
	private final ReelRepository reelRepository;
	private final PostRepository postRepository;

	@PostMapping()
	public ResponseEntity<?> setReelLike(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String,String> map)
	{

		try {
			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
			}

			String token = authHeader.substring(7);

			String email = jwtUtil.extractUsername(token);

			User user = userRepository.findByEmail(email).orElse(null);


			if (user == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
			}
			Long id =Long.parseLong(map.get("id"));
			String type = map.get("type");
			Like like =null;
			if(type.equals("post"))
			{
				Post post = postRepository.findById(id).orElseThrow();
				like = new Like();
				like.setPost(post);
				like.setUser(user);
			}
			else
			{
			Reel reel = reelRepository.findById(id).orElseThrow();
			 like = new Like();
			like.setReel(reel);
			like.setUser(user);
			}
			likeRepository.save(like);
			return ResponseEntity.ok("success");

		} catch (Exception e) {
			return ResponseEntity.badRequest().body("failed");
		}
	}
	@DeleteMapping()
	public ResponseEntity<?> rmoveReelLike(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String,String> map)
	{
		
		try {
			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
			}
			
			String token = authHeader.substring(7);
			
			String email = jwtUtil.extractUsername(token);
			
			User user = userRepository.findByEmail(email).orElse(null);
			
			
			if (user == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
			}
			Long id =Long.parseLong(map.get("id"));
			String type = map.get("type");
			Like like = null;
			if(type.equals("post"))
			{
				Post post = postRepository.findById(id).orElseThrow();
				like = likeRepository.findByUserAndPost(user,post).orElseThrow();
			}
			else
			{
			Reel reel = reelRepository.findById(id).orElseThrow();
			 like = likeRepository.findByUserAndReel(user,reel).orElseThrow();
			}
			likeRepository.delete(like);
			return ResponseEntity.ok("success");
			
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("failed");
		}
	}
}
