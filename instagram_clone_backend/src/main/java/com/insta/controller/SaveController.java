package com.insta.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.Save;
import com.insta.model.User;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.SaveRepository;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/save")
public class SaveController {

	private final SaveRepository saveRepository;
	private final UserService userService;
	private final ReelRepository reelRepository;
	private final PostRepository postRepository;
	
	@PostMapping()
	public ResponseEntity<?> setReelLike(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String,String> map)
	{

		try {
			User user = userService.getUserByToken(authHeader);
			if (user == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
			}
			Long id =Long.parseLong(map.get("id"));
			String type = map.get("type");
			Save save = new Save();
			if(type.equals("post"))
			{
				Post post = postRepository.findById(id).orElseThrow();
				save.setPost(post);
			}
			else {
			Reel reel = reelRepository.findById(id).orElseThrow();
			save.setReel(reel);
			}
			save.setUser(user);

			saveRepository.save(save);
			return ResponseEntity.ok("success");

		} catch (Exception e) {
			return ResponseEntity.badRequest().body("failed");
		}
	}
	@DeleteMapping()
	public ResponseEntity<?> rmoveReelLike(@RequestHeader("Authorization") String authHeader,@RequestBody Map<String,String> map)
	{
		
		try {
			User user = userService.getUserByToken(authHeader);
			
			if (user == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
			}
			Long id =Long.parseLong(map.get("id"));
			String type = map.get("type");
			Save save = null;
			if(type.equals("post"))
			{
				Post post = postRepository.findById(id).orElseThrow();
				save = saveRepository.findByUserAndPost(user,post).orElseThrow();
			}
			else {
			Reel reel = reelRepository.findById(id).orElseThrow();
			 save = saveRepository.findByUserAndReel(user,reel).orElseThrow();
			}
			saveRepository.delete(save);
			return ResponseEntity.ok("success");
			
			
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("failed");
		}
	}
	 
}
