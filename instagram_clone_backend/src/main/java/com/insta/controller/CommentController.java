package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.insta.dto.CommentDTO;
import com.insta.model.Comment;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.CommentRepository;
import com.insta.repository.ReelRepository;
import com.insta.service.CommentService;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/comment")
@CrossOrigin(origins = { "http://localhost:5173", "https://instagram-clone-react.onrender.com",
		"https://instagram-clone-react-1.onrender.com" }, allowedHeaders = { "Authorization", "Content-Type",
				"Accept" }, methods = { org.springframework.web.bind.annotation.RequestMethod.GET,
						org.springframework.web.bind.annotation.RequestMethod.POST,
						org.springframework.web.bind.annotation.RequestMethod.PUT,
						org.springframework.web.bind.annotation.RequestMethod.DELETE,
						org.springframework.web.bind.annotation.RequestMethod.OPTIONS }, allowCredentials = "true")
public class CommentController {

	private final CommentRepository commentRepository;
	private final ReelRepository reelRepository;
	private final UserService userService;
	private final CommentService commentService;

	@GetMapping("/{id}/{type}")
	public List<CommentDTO> getAllComments(@PathVariable("id") Long id, @PathVariable("type") String type) {
		return commentService.getCommnetsByType(id, type);
	}

	@PostMapping("/add")
	public ResponseEntity<?> addComment(@RequestHeader("Authorization") String auth,
			@RequestBody Map<String, String> map) {
		try {
			User user = userService.getUserByToken(auth);
			String commentVal = map.get("commentvalue");
			Long id = Long.parseLong(map.get("id"));
			String type = map.get("type");
			Long repliedToId = null;
			if (map.containsKey("repliedToCommentId") && map.get("repliedToCommentId") != null
					&& !map.get("repliedToCommentId").isEmpty()) {
				repliedToId = Long.parseLong(map.get("repliedToCommentId"));
			}
			CommentDTO newcomment = commentService.addComments(id, user, type, commentVal, repliedToId);
			return ResponseEntity.ok(newcomment);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}

	@PostMapping("/add-voice")
	public ResponseEntity<?> addVoiceComment(
			@RequestHeader("Authorization") String auth,
			@RequestParam("audio") MultipartFile audioFile,
			@RequestParam("id") Long id,
			@RequestParam("type") String type,
			@RequestParam(value = "repliedToCommentId", required = false) Long repliedToId) {
		try {
			User user = userService.getUserByToken(auth);
			CommentDTO newcomment = commentService.addVoiceComment(id, user, type, audioFile, repliedToId);
			return ResponseEntity.ok(newcomment);
		} catch (Exception e) {
			return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
		}
	}

	@DeleteMapping("/delete/{commentId}")
	public ResponseEntity<?> deleteComment(@RequestHeader("Authorization") String auth, @PathVariable Long commentId) {
		try {
			User user = userService.getUserByToken(auth);
			if (user == null) {
				return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
			}
			commentService.deleteComment(commentId, user);
			return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
		} catch (Exception e) {
			return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
		}
	}

	@PutMapping("/edit/{commentId}")
	public ResponseEntity<?> editComment(
			@RequestHeader("Authorization") String auth,
			@PathVariable Long commentId,
			@RequestBody Map<String, String> map) {
		System.out.println("[COMMENT EDIT] auth header: " + auth);
		try {
			User user = userService.getUserByToken(auth);
			System.out.println("[COMMENT EDIT] user resolved: " + (user != null ? user.getEmail() : "NULL"));
			if (user == null) {
				return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
			}
			String newText = map.get("text");
			CommentDTO updatedComment = commentService.editComment(commentId, newText, user);
			return ResponseEntity.ok(updatedComment);
		} catch (Exception e) {
			System.out.println("[COMMENT EDIT] exception: " + e.getMessage());
			return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
		}
	}

	@GetMapping("/replies/{commentId}")
	public List<CommentDTO> getReplies(@PathVariable Long commentId) {
		return commentService.getRepliesForComment(commentId);
	}
}
