package com.insta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommentDTO {

	private Long id;
	private String username;
	private Long userId;
	private String text;
	private String userprofile;
}
