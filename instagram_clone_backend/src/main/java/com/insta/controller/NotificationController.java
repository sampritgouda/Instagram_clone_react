package com.insta.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.dto.FollowRequestDTO;
import com.insta.model.FollowRequest;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class NotificationController {

	private final FollowRequestRepository followRequestRepository;
	private final UserService userService;
	
	@GetMapping("/allnotifications")
	public List<FollowRequestDTO> getAllRequests(@RequestHeader("Authorization") String auth)
	{
		User user = userService.getUserByToken(auth);
		 return followRequestRepository
		            .findByTargetAndStatus(user, FollowRequest.RequestStatus.PENDING)
		            .stream()
		            .map(r -> new FollowRequestDTO(
		                    r.getId(),
		                    r.getRequester(),
		                    r.getStatus().name()
		            ))
		            .toList();
	}
}
