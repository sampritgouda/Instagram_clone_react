package com.insta.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insta.model.User;
import com.insta.model.WebPushSubscription;
import com.insta.repository.WebPushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Sends Web Push notifications (VAPID) to browsers — even when the browser is closed.
 *
 * Flow:
 *  1. Frontend registers a Service Worker and subscribes to push via browser PushManager
 *  2. Frontend POSTs the subscription (endpoint + keys) to /api/push/subscribe
 *  3. When a notification event occurs, WebPushService sends an HTTP push to the
 *     browser's push server (Google FCM, Mozilla, Apple) — no account needed.
 *  4. Browser push server delivers it to the device.
 *  5. Service Worker wakes up and shows a native OS notification.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushService {

    private final WebPushSubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    @Value("${vapid.public.key}")
    private String vapidPublicKey;

    @Value("${vapid.private.key}")
    private String vapidPrivateKey;

    @Value("${vapid.subject}")
    private String vapidSubject;

    private PushService pushService;

    @PostConstruct
    public void init() {
        // Enable SNI extension for TLS connections to Google FCM / Apple push servers
        System.setProperty("jsse.enableSNIExtension", "true");

        // Register BouncyCastle as security provider for EC key operations
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        try {
            this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("✅ WebPushService initialized with VAPID keys");
        } catch (Exception e) {
            log.error("❌ Failed to initialize WebPushService: {}", e.getMessage());
        }
    }

    /**
     * Save or update a browser's push subscription for a user.
     * Called when the frontend registers the Service Worker and calls PushManager.subscribe().
     */
    @Transactional
    public void saveSubscription(User user, String endpoint, String p256dh, String auth) {
        Optional<WebPushSubscription> existing = subscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
            // Update user association if needed (e.g., user switched accounts)
            WebPushSubscription sub = existing.get();
            sub.setUser(user);
            sub.setP256dh(p256dh);
            sub.setAuth(auth);
            subscriptionRepository.save(sub);
        } else {
            WebPushSubscription sub = WebPushSubscription.builder()
                    .user(user)
                    .endpoint(endpoint)
                    .p256dh(p256dh)
                    .auth(auth)
                    .build();
            subscriptionRepository.save(sub);
        }
        log.debug("Push subscription saved for user: {}", user.getUsername());
    }

    /**
     * Remove a specific browser's push subscription (called on device logout/unsubscribe).
     */
    @Transactional
    public void removeSubscription(String endpoint) {
        subscriptionRepository.deleteByEndpoint(endpoint);
    }

    /**
     * Remove ALL push subscriptions for a user (called on full logout).
     */
    @Transactional
    public void removeAllSubscriptions(User user) {
        subscriptionRepository.deleteByUser(user);
    }

    /**
     * Send a push notification to all of a user's subscribed browsers/devices.
     * Runs asynchronously so it never blocks the main request thread.
     *
     * @param recipient The user to notify
     * @param type      Notification type (LIKE, COMMENT, FOLLOW, MESSAGE, etc.)
     * @param title     Title shown on the notification (e.g., username)
     * @param body      Body text (e.g., "liked your post")
     * @param icon      URL to the sender's profile pic (or app logo)
     * @param clickUrl  Where to navigate when user taps the notification
     */
    @Async
    public void sendPushToUser(User recipient, String type, String title, String body, String icon, String clickUrl) {
        if (pushService == null) return;

        List<WebPushSubscription> subscriptions = subscriptionRepository.findByUser(recipient);
        if (subscriptions.isEmpty()) return;

        // Build the JSON payload that the Service Worker will receive
        Map<String, String> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("title", title);
        payload.put("body", body);
        payload.put("icon", icon != null && !icon.isBlank() ? icon : "/logo.jpg");
        payload.put("badge", "/logo.jpg");
        payload.put("url", clickUrl != null ? clickUrl : "/notifications");

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            log.error("Failed to serialize push payload: {}", e.getMessage());
            return;
        }

        for (WebPushSubscription sub : subscriptions) {
            try {
                Subscription subscription = new Subscription(
                        sub.getEndpoint(),
                        new Subscription.Keys(sub.getP256dh(), sub.getAuth())
                );
                Notification notification = new Notification(subscription, payloadJson);
                pushService.send(notification);
                log.debug("Push sent to {} (endpoint: {}...)", recipient.getUsername(),
                        sub.getEndpoint().substring(0, Math.min(40, sub.getEndpoint().length())));
            } catch (Exception e) {
                // Subscription may have expired (browser uninstalled, etc.) — remove it
                log.warn("Push failed for endpoint, removing stale subscription: {}", e.getMessage());
                try {
                    subscriptionRepository.deleteByEndpoint(sub.getEndpoint());
                } catch (Exception ignored) {}
            }
        }
    }

    /** Returns the VAPID public key so the frontend can subscribe. */
    public String getVapidPublicKey() {
        return vapidPublicKey;
    }
}
