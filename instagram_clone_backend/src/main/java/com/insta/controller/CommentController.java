package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
public class CommentController {

	private final CommentRepository commentRepository;
	private final ReelRepository reelRepository;
	private final UserService userService;
	private final CommentService commentService;
	
	@GetMapping("/{id}/{type}")
	public List<CommentDTO> getAllComments(@PathVariable("id")Long id,@PathVariable("type")String type)
	{
		return commentService.getCommnetsByType(id, type);
	}
	
	@PostMapping("/add")
	public ResponseEntity<?> addComment(@RequestHeader("Authorization")String auth,@RequestBody Map<String,String> map)
	{
		try {
			User user = userService.getUserByToken(auth);
			String commentVal = map.get("commentvalue");
			Long id = Long.parseLong(map.get("id"));
			String type = map.get("type");
			CommentDTO newcomment = commentService.addComments(id, user, type, commentVal);
			return ResponseEntity.ok(newcomment);
		} catch (Exception e) {
			return ResponseEntity.badRequest().build();
		}
	}
	
	
}
