package com.insta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "likes")
public class Like {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Many likes belong to one user
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Like can be for a post or reel
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    @JsonIgnore
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reel_id")
    @JsonIgnore
    private Reel reel;
}
