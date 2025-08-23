package com.insta.dto;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.insta.model.Story;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserStoriesResponse {

    private Long userId;
    private String username;
    private String profileImage;
    @JsonIgnoreProperties("user")
    private List<Story> stories;
    private boolean hasUnseen;
    private LocalDateTime lastStoryTime;
    private boolean own;
    
}
