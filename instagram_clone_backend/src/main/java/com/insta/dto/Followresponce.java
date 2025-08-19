package com.insta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Followresponce {

	private Long id;
	private String username;
	private String profileurl;
	private boolean isFollowing;
	private boolean isRequested;
	private boolean isPrivate;
}
