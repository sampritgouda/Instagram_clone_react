package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.insta.dto.UserStoriesResponse;
import com.insta.model.Post;
import com.insta.model.Story;
import com.insta.model.StoryView;
import com.insta.model.User;
import com.insta.repository.PostRepository;
import com.insta.repository.StoryRepository;
import com.insta.repository.StoryViewRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.StoryService;
import com.insta.service.UserService;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/stories")

public class StoryController {

    private final UserService userService;

    private final Cloudinary cloudinary;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
   private final StoryRepository storyRepository;
   private final StoryService storyService;
   private final StoryViewRepository storyViewRepository;
  

    @PostMapping("/add")
    public ResponseEntity<?> createStory(
            
            @RequestPart("media") MultipartFile mediaFile,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            // 1. Extract token & get user
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            String email = jwtUtil.extractUsername(token);
            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            // 2. Upload to Cloudinary
            Map uploadResult = cloudinary.uploader().upload(
                    mediaFile.getBytes(),
                    Map.of("resource_type", "auto") 
            );

            String url = uploadResult.get("secure_url").toString();
            String resourceType = uploadResult.get("resource_type").toString();

            // 3. Save post to DB
            Story story = new Story();
            
           story.setMediaType(resourceType);
           story.setMediaUrl(url);
           story.setUser(user);
           story.setCreatedAt(LocalDateTime.now());
           story.setExpiresAt(LocalDateTime.now().plusHours(24));

           storyRepository.save(story);

            return ResponseEntity.ok(Map.of(
                    "message", "Story Added successfully",
                    "mediaType", resourceType,
                    "url", url
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error while uploading Story", "details", e.getMessage()));
        }
    }
    
    @GetMapping
    public List<UserStoriesResponse> getAllStrories(@RequestHeader("Authorization") String authrization)
    {
    	User viewer = userService.getUserByToken(authrization);
    	 return storyService.getAllStories(viewer.getId());
    }
    
    @PostMapping("/{storyId}/seen")
    public ResponseEntity<?> markStoryAsSeen(@RequestHeader("Authorization") String authrization,@PathVariable("storyId") Long id)
    {
    	try {
			User user = userService.getUserByToken(authrization);
			Story story = storyRepository.findById(id).orElseThrow();
			StoryView storyView = new StoryView();
			storyView.setViewer(user);
			storyView.setStory(story);
			storyViewRepository.save(storyView);
			return ResponseEntity.ok().build();
			
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
    }
}
