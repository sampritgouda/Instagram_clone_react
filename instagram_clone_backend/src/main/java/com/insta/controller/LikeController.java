package com.insta.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.insta.model.Like;
import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.LikeRepository;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;
import com.insta.service.NotificationService;
import com.insta.service.UserInteractionService;

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
    private final NotificationService notificationService;
    private final UserInteractionService userInteractionService;

    @PostMapping()
    public ResponseEntity<?> setReelLike(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> map) {
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
            Long id = Long.parseLong(map.get("id"));
            String type = map.get("type");
            Like like = null;
            if ("post".equalsIgnoreCase(type)) {
                Post post = postRepository.findById(id).orElseThrow();
                like = new Like();
                like.setPost(post);
                like.setUser(user);
                notificationService.createNotification(post.getUser(), user, com.insta.model.Notification.NotificationType.LIKE, post, null, null);
                userInteractionService.logInteraction(user, post, null, com.insta.model.UserInteraction.InteractionType.LIKE, null);
            } else {
                Reel reel = reelRepository.findById(id).orElseThrow();
                like = new Like();
                like.setReel(reel);
                like.setUser(user);
                notificationService.createNotification(reel.getUser(), user, com.insta.model.Notification.NotificationType.LIKE, null, reel, null);
                userInteractionService.logInteraction(user, null, reel, com.insta.model.UserInteraction.InteractionType.LIKE, null);
            }
            likeRepository.save(like);
            return ResponseEntity.ok("success");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("failed");
        }
    }

    @DeleteMapping()
    public ResponseEntity<?> rmoveReelLike(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> map) {
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
            Long id = Long.parseLong(map.get("id"));
            String type = map.get("type");
            Like like = null;
            if ("post".equalsIgnoreCase(type)) {
                Post post = postRepository.findById(id).orElseThrow();
                like = likeRepository.findByUserAndPost(user, post).orElseThrow();
            } else {
                Reel reel = reelRepository.findById(id).orElseThrow();
                like = likeRepository.findByUserAndReel(user, reel).orElseThrow();
            }
            likeRepository.delete(like);
            return ResponseEntity.ok("success");

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("failed");
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getLikeStatus(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("id") Long id,
            @RequestParam("type") String type) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("liked", false, "likeCount", 0));
            }
            String token = authHeader.substring(7);
            String email = jwtUtil.extractUsername(token);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("liked", false, "likeCount", 0));
            }
            boolean liked = false;
            long count = 0;
            if ("post".equalsIgnoreCase(type)) {
                Post post = postRepository.findById(id).orElse(null);
                if (post != null) {
                    count = post.getLikes() != null ? post.getLikes().size() : 0;
                    liked = post.getLikes() != null && post.getLikes().stream()
                            .anyMatch(l -> l.getUser() != null && l.getUser().getId().equals(user.getId()));
                }
            } else {
                Reel reel = reelRepository.findById(id).orElse(null);
                if (reel != null) {
                    count = reel.getLikes() != null ? reel.getLikes().size() : 0;
                    liked = reel.getLikes() != null && reel.getLikes().stream()
                            .anyMatch(l -> l.getUser() != null && l.getUser().getId().equals(user.getId()));
                }
            }
            return ResponseEntity.ok(Map.of("liked", liked, "likeCount", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("liked", false, "likeCount", 0));
        }
    }
}
