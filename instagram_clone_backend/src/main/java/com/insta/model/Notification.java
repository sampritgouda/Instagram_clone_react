package com.insta.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notifications")
public class Notification {

    public enum NotificationType {
        LIKE,
        COMMENT,
        MENTION,
        FOLLOW,
        FOLLOW_REQUEST,
        STORY_LIKE,
        MESSAGE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_id", nullable = false)
    @JsonIgnoreProperties({"password", "email", "posts", "savedPosts", "followers", "following"})
    private User recipient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "actor_id", nullable = false)
    @JsonIgnoreProperties({"password", "email", "posts", "savedPosts", "followers", "following"})
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, columnDefinition = "VARCHAR(50)")
    private NotificationType type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "post_id")
    @JsonIgnoreProperties({"comments", "likes", "user"})
    private Post post;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reel_id")
    @JsonIgnoreProperties({"comments", "likes", "user"})
    private Reel reel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "story_id")
    @JsonIgnoreProperties({"storyViews", "user"})
    private Story story;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Builder.Default
    private boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
