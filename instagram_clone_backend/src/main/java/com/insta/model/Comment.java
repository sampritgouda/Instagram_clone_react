package com.insta.model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "comments")
public class Comment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Many comments belong to one user
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    // Comment can be for a post or reel
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reel_id")
    private Reel reel;

    private String text;
    private LocalDateTime createdAt;
}
