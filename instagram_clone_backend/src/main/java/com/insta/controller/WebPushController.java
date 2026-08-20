package com.insta.controller;

import com.insta.model.User;
import com.insta.service.UserService;
import com.insta.service.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST endpoints for managing Web Push subscriptions.
 *
 * Frontend flow:
 *  1. GET /api/push/vapid-public-key  → get VAPID public key
 *  2. Browser registers Service Worker + calls PushManager.subscribe(vapidPublicKey)
 *  3. POST /api/push/subscribe        → save the subscription to DB
 *  4. On unsubscribe: DELETE /api/push/unsubscribe
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/push")
public class WebPushController {

    private final WebPushService webPushService;
    private final UserService userService;

    /**
     * Returns VAPID public key — needed by frontend to call PushManager.subscribe().
     * Public endpoint — no auth required.
     */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", webPushService.getVapidPublicKey()));
    }

    /**
     * Save a browser's push subscription.
     * Called by the frontend after PushManager.subscribe() succeeds.
     *
     * Expected body:
     * {
     *   "endpoint": "https://fcm.googleapis.com/fcm/send/...",
     *   "p256dh": "base64url...",
     *   "auth": "base64url..."
     * }
     */
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {

        User user = userService.getUserByToken(auth);
        if (user == null) return ResponseEntity.status(401).build();

        String endpoint = body.get("endpoint");
        String p256dh   = body.get("p256dh");
        String authKey  = body.get("auth");

        if (endpoint == null || p256dh == null || authKey == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing endpoint, p256dh, or auth"));
        }

        webPushService.saveSubscription(user, endpoint, p256dh, authKey);
        return ResponseEntity.ok(Map.of("message", "Push subscription saved"));
    }

    /**
     * Remove a browser's push subscription (called when user disables notifications).
     *
     * Expected body: { "endpoint": "https://fcm.googleapis.com/..." }
     */
    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {

        User user = userService.getUserByToken(auth);
        if (user == null) return ResponseEntity.status(401).build();

        String endpoint = body.get("endpoint");
        if (endpoint != null) {
            webPushService.removeSubscription(endpoint);
        }
        return ResponseEntity.ok(Map.of("message", "Unsubscribed"));
    }
}
