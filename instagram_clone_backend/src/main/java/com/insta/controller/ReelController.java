package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;

import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.ReelsService;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/reels")

public class ReelController {

    private final Cloudinary cloudinary;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final ReelRepository reelRepository;
    private final ReelsService reelsService;
    

    @PostMapping("/add")
    public ResponseEntity<?> createReel(
            @RequestPart("caption") String caption,
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
                    Map.of("resource_type", "video") // handles image/video automatically
            );

            String url = uploadResult.get("secure_url").toString();
            String resourceType = uploadResult.get("resource_type").toString();

           Reel reel = new Reel();
           reel.setCaption(caption);
           reel.setCreatedAt(LocalDateTime.now());
           reel.setVideoUrl(url);
           reel.setUser(user);
           
           reelRepository.save(reel);

            return ResponseEntity.ok(Map.of(
                    "message", "Reel Uploaded successfully",
                    "mediaType", resourceType,
                    "url", url
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error while uploading Reel", "details", e.getMessage()));
        }
    }
    
    
    
    @GetMapping("")
    public List<Reel> getReels(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
		         @RequestParam(defaultValue = "2") int limit) {
	

	    	System.out.println(page);
	    	System.out.println(limit);
	        String token = authHeader.substring(7);
	        String email = jwtUtil.extractUsername(token);
	        User currentUser = userRepository.findByEmail(email).orElseThrow();
	        return reelsService.getAllReels(page, limit, currentUser);
		

        

    }


}
