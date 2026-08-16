package com.insta.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.model.UserInteraction.InteractionType;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;
import com.insta.service.UserInteractionService;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/interactions")
public class UserInteractionController {

    private final UserInteractionService userInteractionService;
    private final UserService userService;
    private final PostRepository postRepository;
    private final ReelRepository reelRepository;

    /**
     * POST /api/interactions
     * Body: { "postId": 101, "reelId": 200, "type": "VIEW", "watchTime": 12.5 }
     */
    @PostMapping
    public ResponseEntity<?> recordInteraction(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, Object> body) {
        try {
            User user = userService.getUserByToken(auth);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            String typeStr = body.get("type") != null ? body.get("type").toString() : "VIEW";
            InteractionType type = InteractionType.valueOf(typeStr.toUpperCase());

            Post post = null;
            if (body.get("postId") != null) {
                Long postId = Long.parseLong(body.get("postId").toString());
                post = postRepository.findById(postId).orElse(null);
            }

            Reel reel = null;
            if (body.get("reelId") != null) {
                Long reelId = Long.parseLong(body.get("reelId").toString());
                reel = reelRepository.findById(reelId).orElse(null);
            }

            Double watchTime = null;
            if (body.get("watchTime") != null) {
                watchTime = Double.parseDouble(body.get("watchTime").toString());
            }

            userInteractionService.logInteraction(user, post, reel, type, watchTime);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/interactions/export
     * Exports all user interactions as a CSV file for ML training dataset
     */
    @GetMapping("/export")
    public ResponseEntity<String> exportDataset() {
        String csvData = userInteractionService.generateTrainingCSV();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"user_interactions_training.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
