package com.insta.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Stores a browser's Web Push subscription for a user.
 * Each browser/device generates a unique subscription with:
 *   - endpoint: the push server URL (Google/Mozilla/Apple)
 *   - p256dh:   browser's public encryption key
 *   - auth:     browser's auth secret
 *
 * One user can have multiple subscriptions (phone, laptop, tablet, etc.)
 */
@Entity
@Table(name = "web_push_subscriptions",
        uniqueConstraints = @UniqueConstraint(columnNames = "endpoint"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebPushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * The push endpoint URL provided by the browser (Google/Mozilla push server).
     * Unique per browser instance.
     */
    @Column(nullable = false, length = 512)
    private String endpoint;

    /**
     * Browser's ECDH public key (base64url) for message encryption.
     */
    @Column(nullable = false, length = 256)
    private String p256dh;

    /**
     * Browser's auth secret (base64url) for message authentication.
     */
    @Column(nullable = false, length = 64)
    private String auth;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
