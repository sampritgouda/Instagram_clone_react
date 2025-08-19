package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.insta.model.FollowRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.dto.Followresponce;
import com.insta.model.Follower;
import com.insta.model.User;
import com.insta.repository.FollowerRepository;
import com.insta.repository.UserRepository;
import com.insta.service.FollowService;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class FollowController {
	
	private final FollowerRepository followerRepository;
	private final UserRepository userRepository;
	private final UserService userService;
	private final FollowService followService;
	
	
	@PostMapping("/follow")
	public ResponseEntity<?> followUser(@RequestHeader("Authorization") String auth,@RequestBody Map<String, Long> map)
	{
		try {

			User logedUser = userService.getUserByToken(auth);
			User user = userRepository.findById(map.get("id")).orElseThrow();
			followService.handleFollow(logedUser, user);
			return ResponseEntity.ok().build();
		
	} catch (Exception e) {
		return ResponseEntity.badRequest().body("failed");
	}
	}
	
	
	@DeleteMapping("/follow")
	public ResponseEntity<?> unfollowUser(@RequestHeader("Authorization") String auth,@RequestBody Map<String, Long> map)
	{
		try {
			
			User logedUser = userService.getUserByToken(auth);
			User user = userRepository.findById(map.get("id")).orElseThrow();
			followService.hanndleUnfollowAndRequest(user,logedUser);
			return ResponseEntity.ok().build();
			
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("failed");
		}
	}
	
	@PostMapping("/confirm")
	public ResponseEntity<?> ConfirmFolllow(@RequestBody Map<String, String> map)
	{
		try {
			long id = Long.parseLong(map.get("id"));
			boolean isConfirm = Boolean.parseBoolean(map.get("isConfirm"));
			followService.respondToFollowRequest(id, isConfirm);
			return ResponseEntity.ok().build();
		
	} catch (Exception e) {
		return ResponseEntity.badRequest().body("failed");
	}
	}
	@PostMapping("/follower")
	public List<Followresponce> getFollowers(
	        @RequestBody Map<String, Long> map,
	        @RequestHeader("Authorization") String authorization
	) {
	    User logedUser = userService.getUserByToken(authorization);
	    Long userId = map.get("userId");
	    User user = userRepository.findById(userId).orElseThrow();

	    return user.getFollowers().stream().map(follower -> {
	        User followerUser = follower.getFollower();

	        boolean isFollowing = followerUser.getFollowers()
	            .stream()
	            .anyMatch(f -> f.getFollower().getId().equals(logedUser.getId()));
	        
	        boolean isRequested = followerUser.getFollowrequests().stream()
	        	    .anyMatch(r -> r.getRequester().getId().equals(logedUser.getId()) 
	        	                && r.getStatus() == FollowRequest.RequestStatus.PENDING);


	        return Followresponce.builder()
	            .id(followerUser.getId())
	            .username(followerUser.getUsername())
	            .profileurl(followerUser.getProfilePicUrl())
	            .isFollowing(isFollowing)
	            .isPrivate(followerUser.getIsPrivate())
	            .isRequested(isRequested)
	            .build();
	    }).toList();
	}

	

@PostMapping("/following")
public List<Followresponce> getFollowings(
		@RequestBody Map<String, Long> map,
		@RequestHeader("Authorization") String authorization
		) {
	User logedUser = userService.getUserByToken(authorization);
	Long userId = map.get("userId");
	User user = userRepository.findById(userId).orElseThrow();
	
	return user.getFollowing().stream().map(following -> {
		User followingUser = following.getFollower();
		
		boolean isFollowing = followingUser.getFollowers()
				.stream()
				.anyMatch(f -> f.getFollower().getId().equals(logedUser.getId()));
		
		boolean isRequested = followingUser.getFollowrequests().stream()
				.anyMatch(r -> r.getRequester().getId().equals(logedUser.getId()) 
						&& r.getStatus() == FollowRequest.RequestStatus.PENDING);
		
		
		return Followresponce.builder()
				.id(followingUser.getId())
				.username(followingUser.getUsername())
				.profileurl(followingUser.getProfilePicUrl())
				.isFollowing(isFollowing)
				.isPrivate(followingUser.getIsPrivate())
				.isRequested(isRequested)
				.build();
	}).toList();
}


	

}
