package com.insta.controller;


import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
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
            User user = userService.getUserByToken(authHeader);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

            String[] uploadStory = storyService.uploadStory(mediaFile, user);
            String resourceType = uploadStory[0];
            String url = uploadStory[1];

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
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStory(@PathVariable("id")Long id)
    {
    	try {
    		
    		storyService.deleteStory(id);
    		ResponseEntity.ok().build();
		} catch (Exception e) {
			e.printStackTrace();
			ResponseEntity.badRequest().build();
		}
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
