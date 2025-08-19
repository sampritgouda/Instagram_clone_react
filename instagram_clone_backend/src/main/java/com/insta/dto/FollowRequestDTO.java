package com.insta.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.insta.model.User;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class FollowRequestDTO {
    private Long id;
    
    private User requester;
    private String status;
}
