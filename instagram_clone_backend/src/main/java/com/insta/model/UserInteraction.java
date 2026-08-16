package com.insta.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "user_interactions")
public class UserInteraction {

    public enum InteractionType {
        VIEW,
        LIKE,
        COMMENT,
        SAVE,
        SHARE,
        SKIP,
        FOLLOW
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"password", "email", "posts", "savedPosts", "followers", "following"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "post_id")
    @JsonIgnoreProperties({"comments", "likes", "user"})
    private Post post;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reel_id")
    @JsonIgnoreProperties({"comments", "likes", "user"})
    private Reel reel;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private InteractionType type;

    @Column(name = "watch_time")
    private Double watchTime;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
