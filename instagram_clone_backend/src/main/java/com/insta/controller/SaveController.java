package com.insta.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
	private final com.insta.service.UserInteractionService userInteractionService;
	
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
				userInteractionService.logInteraction(user, post, null, com.insta.model.UserInteraction.InteractionType.SAVE, null);
			}
			else {
			Reel reel = reelRepository.findById(id).orElseThrow();
			save.setReel(reel);
			userInteractionService.logInteraction(user, null, reel, com.insta.model.UserInteraction.InteractionType.SAVE, null);
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

	@GetMapping("/status")
	public ResponseEntity<?> getSaveStatus(
			@RequestHeader("Authorization") String authHeader,
			@org.springframework.web.bind.annotation.RequestParam("id") Long id,
			@org.springframework.web.bind.annotation.RequestParam("type") String type) {
		try {
			User user = userService.getUserByToken(authHeader);
			if (user == null) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("saved", false));
			}
			boolean saved = false;
			if ("post".equalsIgnoreCase(type)) {
				Post post = postRepository.findById(id).orElse(null);
				if (post != null) {
					saved = saveRepository.findByUserAndPost(user, post).isPresent();
				}
			} else {
				Reel reel = reelRepository.findById(id).orElse(null);
				if (reel != null) {
					saved = saveRepository.findByUserAndReel(user, reel).isPresent();
				}
			}
			return ResponseEntity.ok(Map.of("saved", saved));
		} catch (Exception e) {
			return ResponseEntity.ok(Map.of("saved", false));
		}
	}
}
