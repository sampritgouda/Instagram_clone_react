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
import com.cloudinary.utils.ObjectUtils;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.ReelsService;
import com.insta.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/reels")

public class ReelController {

    private final UserService userService;

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
           User user = userService.getUserByToken(authHeader);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            String[] uploadreels = reelsService.uploadreels(mediaFile, caption, user);
            String resourceType = uploadreels[0];
            String url = uploadreels[1];

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
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReel(@PathVariable("id")Long id)
    {
    	try {
    		Reel reel = reelRepository.findById(id).orElseThrow();
        	cloudinary.uploader().destroy(
                    reel.getReelPublicId(),
                    ObjectUtils.asMap("resource_type", "video") 
                );
        	reelRepository.delete(reel);
        	return ResponseEntity.ok().build();
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
    }
    {
    	
    }


}
