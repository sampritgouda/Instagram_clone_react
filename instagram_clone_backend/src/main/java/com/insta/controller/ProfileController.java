package com.insta.controller;

import com.insta.dto.FeedItemDTO;
import com.insta.dto.UserResponse;

import com.insta.model.FollowRequest;


import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.Save;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.FollowerRepository;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.SaveRepository;
import com.insta.repository.UserRepository;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profile")
public class ProfileController {
	private final UserService userService;
	private final UserRepository userRepository;
	private final PostRepository postRepository;
	private final ReelRepository reelRepository;
	private final FollowRequestRepository followRequestRepository;
	private final FollowerRepository followerRepository;
	private final SaveRepository saveRepository;

	@GetMapping("/user")
	public UserResponse goProfile(@RequestParam("userId")Long userId,@RequestHeader("Authorization") String authrization)
	{
		User logeduser = userService.getUserByToken(authrization);
		 User user = userRepository.findById(userId).orElseThrow();
		  UserResponse userResponse = UserResponse.builder()
		 .bio(user.getBio())
		 .isPrivate(user.getIsPrivate())
		 .id(user.getId()).username(user.getUsername()).profilePicUrl(user.getProfilePicUrl())
		 .isFollowed(followerRepository.existsByFollowingAndFollower(user, logeduser))
		 .requested(followRequestRepository.existsByRequesterAndTargetAndStatus(logeduser, user,FollowRequest.RequestStatus.PENDING))
		 .isOwn(user.getId().equals(logeduser.getId()))
		 .followerCount(user.getFollowers().size())
		 .followingCount(user.getFollowing().size())
		 .postCount(user.getPosts().size()).build();
				 
	
		 return userResponse;
	}
	
	@GetMapping("/posts")
	public List<FeedItemDTO> getPostsByUser(@RequestParam("id") Long id,
	                                        @RequestHeader("Authorization") String author) {
	    User user = userService.getUserByToken(author);

	    List<Post> posts = postRepository.findPostsUserId(id);
	    		
	    	return 	posts.stream()
	        .map(post -> {
	            boolean isLiked = post.getLikes().stream()
	                    .anyMatch(like -> like.getUser().getId().equals(user.getId()));
	            boolean isSaved = post.getSaves().stream()
	                    .anyMatch(save -> save.getUser().getId().equals(user.getId()));

	            // ✅ return the built DTO
	            return FeedItemDTO.builder()
	                    .id(post.getId())
	                    .user(post.getUser())
	                    .caption(post.getCaption())
	                    .likeCount(post.getLikes().size())
	                    .liked(isLiked)
	                    .mediaType(post.getMediaType())
	                    .type("post")  
	                    .mediaUrl(post.getImageUrl())
	                    .saved(isSaved)
	                    .createdAt(post.getCreatedAt())
	                    .build();
	        })
	        .collect(Collectors.toList());

	   
	}
	
	
	@GetMapping("/reels")
	public List<FeedItemDTO> getReelsByUser(@RequestParam("id") Long id,
			@RequestHeader("Authorization") String author) {
		User user = userService.getUserByToken(author);
		User reeluser = userRepository.findById(id).orElse(user);
		List<Reel> reels = reelRepository.findByUser(reeluser);
		
		return 	reels.stream()
				.map(reel -> {
					boolean isLiked = reel.getLikes().stream()
							.anyMatch(like -> like.getUser().getId().equals(user.getId()));
					boolean isSaved = reel.getSaves().stream()
							.anyMatch(save -> save.getUser().getId().equals(user.getId()));
					
					// ✅ return the built DTO
							return FeedItemDTO.builder()
									.id(reel.getId())
									.user(reel.getUser())
									.caption(reel.getCaption())
									.likeCount(reel.getLikes().size())
									.liked(isLiked)
									.mediaType("video")
									.type("reel")  
									.mediaUrl(reel.getVideoUrl())
									.saved(isSaved)
									.createdAt(reel.getCreatedAt())
									.build();
				})
				.collect(Collectors.toList());
		
		
	}
	
	@GetMapping("/saved")
	public List<FeedItemDTO> getSavedByUser(
	        @RequestParam("id") Long id,
	        @RequestHeader("Authorization") String author) {

	    User currentUser = userService.getUserByToken(author);
	    User targetUser = userRepository.findById(id).orElse(currentUser);

	    List<Save> saves = targetUser.getSaves();

	    return saves.stream()
	            .map(save -> {
	                // 🔹 Extract either post or reel from save
	                if (save.getPost() != null) {
	                    Post post = save.getPost();

	                    boolean isLiked = post.getLikes().stream()
	                            .anyMatch(like -> like.getUser().getId().equals(currentUser.getId()));
	                    boolean isSaved = post.getSaves().stream()
	                            .anyMatch(s -> s.getUser().getId().equals(currentUser.getId()));

	                    return FeedItemDTO.builder()
	                            .id(post.getId())
	                            .user(post.getUser())   // ✅ user comes from post
	                            .caption(post.getCaption())
	                            .likeCount(post.getLikes().size())
	                            .liked(isLiked)
	                            .mediaType(post.getMediaType())
	                            .type("post")
	                            .mediaUrl(post.getImageUrl())
	                            .saved(isSaved)
	                            .createdAt(post.getCreatedAt())
	                            .build();

	                } else if (save.getReel() != null) {
	                    Reel reel = save.getReel();

	                    boolean isLiked = reel.getLikes().stream()
	                            .anyMatch(like -> like.getUser().getId().equals(currentUser.getId()));
	                    boolean isSaved = reel.getSaves().stream()
	                            .anyMatch(s -> s.getUser().getId().equals(currentUser.getId()));

	                    return FeedItemDTO.builder()
	                            .id(reel.getId())
	                            .user(reel.getUser())   // ✅ user comes from reel
	                            .caption(reel.getCaption())
	                            .likeCount(reel.getLikes().size())
	                            .liked(isLiked)
	                            .mediaType("video")
	                            .type("reel")
	                            .mediaUrl(reel.getVideoUrl())
	                            .saved(isSaved)
	                            .createdAt(reel.getCreatedAt())
	                            .build();
	                }
	                return null; // in case save has neither post nor reel
	            })
	            .filter(Objects::nonNull) // remove nulls
	            .collect(Collectors.toList());
	}

	
}
