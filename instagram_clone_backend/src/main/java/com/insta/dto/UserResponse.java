package com.insta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
	private Long id;
	private String username;
	private boolean isPrivate;
	private boolean isOwn;
	private boolean isFollowed;
	private boolean requested;
	private String profilePicUrl; 
    private String bio;
    private int postCount;
    private int followerCount;
    private int followingCount;
}
