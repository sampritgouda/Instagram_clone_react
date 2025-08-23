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
import com.cloudinary.utils.ObjectUtils;
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
           User user = userService.getUserByToken(authHeader);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }

           String[] uploadPost = postService.UploadPost(mediaFile, caption, user);
           String resourceType = uploadPost[0];
           String url = uploadPost[1];

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
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable("id") Long id)
    {
    	try {
    		Post post = postRepository.findById(id).orElseThrow();
        	cloudinary.uploader().destroy(
                    post.getPostPublicId(),
                    ObjectUtils.asMap("resource_type", post.getMediaType()) 
                );
        	postRepository.delete(post);
        	return ResponseEntity.ok().build();
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
    }
    

}
