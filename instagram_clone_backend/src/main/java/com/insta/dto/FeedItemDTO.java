package com.insta.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.insta.model.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FeedItemDTO {

    private Long id;              // id of post/reel
    private String type;          // "POST" or "REEL"
    
    @JsonIgnoreProperties({"saves","likes","reels","posts","stories"})
    private User user;

    // Common content
    private String caption;
    private String mediaType;
    private String mediaUrl;      // image (for post) or video (for reel)
 

    // Engagement
    private int likeCount;
    private boolean liked;


    // Saved info
    private boolean saved;        // true if this item is saved by logged-in user

    // Extra info
    private LocalDateTime createdAt;
}
