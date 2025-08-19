package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.insta.model.Post;
import com.insta.model.User;
import com.insta.repository.PostRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.PostService;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/posts")

public class PostController {

    private final Cloudinary cloudinary;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
   private final  UserService userService;
   private final PostService postService;

    @PostMapping("/add")
    public ResponseEntity<?> createPost(
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
                    Map.of("resource_type", "auto") // handles image/video automatically
            );

            String url = uploadResult.get("secure_url").toString();
            String resourceType = uploadResult.get("resource_type").toString();

            // 3. Save post to DB
            Post post = new Post();
            post.setCaption(caption);
            post.setImageUrl(url);
            post.setMediaType(resourceType);
            post.setUser(user);
            post.setCreatedAt(LocalDateTime.now());

            postRepository.save(post);

            return ResponseEntity.ok(Map.of(
                    "message", "Post created successfully",
                    "mediaType", resourceType,
                    "url", url
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error while uploading post", "details", e.getMessage()));
        }
    }
    
    @GetMapping
    public List<Post> getAllPosts(
    		 @RequestParam(defaultValue = "0") int page,
             @RequestParam(defaultValue = "2") int limit,
             @RequestHeader("Authorization") String authHeader)
    {
    	return postService.getAllPosts(page, limit, authHeader);
    }
}
