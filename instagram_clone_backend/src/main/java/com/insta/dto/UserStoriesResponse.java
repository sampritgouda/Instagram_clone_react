package com.insta.dto;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.insta.model.Story;

public class UserStoriesResponse {

    private Long userId;
    private String username;
    private String profileImage;
    @JsonIgnoreProperties("user")
    private List<Story> stories;
    private boolean hasUnseen;
    private LocalDateTime lastStoryTime;

    // Constructor
    public UserStoriesResponse(Long userId, String username, String profileImage,
                               List<Story> stories, boolean hasUnseen, LocalDateTime lastStoryTime) {
        this.userId = userId;
        this.username = username;
        this.profileImage = profileImage;
        this.stories = stories;
        this.hasUnseen = hasUnseen;
        this.lastStoryTime = lastStoryTime;
    }

    // Getters and setters
    public Long getUserId() {
        return userId;
    }
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getProfileImage() {
        return profileImage;
    }
    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
    public List<Story> getStories() {
        return stories;
    }
    public void setStories(List<Story> stories) {
        this.stories = stories;
    }
    public boolean isHasUnseen() {
        return hasUnseen;
    }
    public void setHasUnseen(boolean hasUnseen) {
        this.hasUnseen = hasUnseen;
    }
    public LocalDateTime getLastStoryTime() {
        return lastStoryTime;
    }
    public void setLastStoryTime(LocalDateTime lastStoryTime) {
        this.lastStoryTime = lastStoryTime;
    }
}
