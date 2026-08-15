package com.insta.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.model.Notification;
import com.insta.model.User;
import com.insta.service.NotificationService;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class NotificationController {

	private final UserService userService;
	private final NotificationService notificationService;
	
	@GetMapping("/allnotifications")
	public List<Notification> getAllNotifications(@RequestHeader("Authorization") String auth) {
		User user = userService.getUserByToken(auth);
		return notificationService.getUserNotifications(user);
	}

	@GetMapping("/notifications/unread-count")
	public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String auth) {
		User user = userService.getUserByToken(auth);
		if (user == null) return ResponseEntity.status(401).build();
		long count = notificationService.getUnreadCount(user);
		return ResponseEntity.ok(Map.of("count", count));
	}

	@PutMapping("/notifications/read-all")
	public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String auth) {
		User user = userService.getUserByToken(auth);
		notificationService.markAllAsRead(user);
		return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
	}
}
