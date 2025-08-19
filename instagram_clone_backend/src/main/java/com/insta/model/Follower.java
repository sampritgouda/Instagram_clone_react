package com.insta.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(
    name = "followers",
    uniqueConstraints = @UniqueConstraint(columnNames = {"follower_id", "following_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follower {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user who follows
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    @JsonIgnore
    private User follower;

    // The user being followed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    @JsonIgnore
    private User following;

    @Column(name = "followed_at", nullable = false)
    private LocalDateTime followedAt = LocalDateTime.now();
}