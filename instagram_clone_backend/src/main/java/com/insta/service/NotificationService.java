package com.insta.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insta.model.Notification;
import com.insta.model.Notification.NotificationType;
import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.NotificationRepository;
import com.insta.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebPushService webPushService;

    /**
     * Builds and sends a real-time WebSocket notification payload to the recipient.
     */
    private void pushWebSocketNotification(User recipient, User actor, String type, String body, String imageUrl) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", type);
            payload.put("title", actor.getUsername());
            payload.put("body", body != null ? body : type.toLowerCase());
            payload.put("senderId", actor.getId());
            payload.put("senderUsername", actor.getUsername());
            payload.put("senderProfilePicUrl", imageUrl != null ? imageUrl : actor.getProfilePicUrl());
            payload.put("createdAt", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/notifications." + recipient.getId(), payload);
        } catch (Exception ignored) {
            // Never fail the main transaction due to WebSocket errors
        }
    }

    @Transactional
    public void createNotification(User recipient, User actor, NotificationType type, Post post, Reel reel, String text) {
        // Do not send notification to oneself
        if (recipient == null || actor == null || recipient.getId().equals(actor.getId())) {
            return;
        }

        // Avoid creating duplicate like notifications
        if (type == NotificationType.LIKE && post != null) {
            if (notificationRepository.existsByRecipientAndActorAndTypeAndPost(recipient, actor, type, post)) {
                return;
            }
        }

        Notification notif = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .post(post)
                .reel(reel)
                .text(text)
                .isRead(false)
                .build();

        notificationRepository.save(notif);

        // 1. Push real-time WebSocket notification (works while browser tab is open)
        String body = buildNotificationBody(type, text);
        pushWebSocketNotification(recipient, actor, type.name(), body, actor.getProfilePicUrl());

        // 2. Send Web Push via VAPID (works even when browser is completely closed ✅)
        String clickUrl = (type == NotificationType.MESSAGE) ? "/messages" : "/notifications";
        webPushService.sendPushToUser(recipient, type.name(), actor.getUsername(), body,
                actor.getProfilePicUrl(), clickUrl);
    }

    private String buildNotificationBody(NotificationType type, String text) {
        switch (type) {
            case LIKE:          return "liked your post";
            case COMMENT:       return text != null && !text.isBlank() ? "commented: " + truncate(text, 60) : "commented on your post";
            case FOLLOW:        return "started following you";
            case FOLLOW_REQUEST:return "sent you a follow request";
            case MENTION:       return text != null && !text.isBlank() ? "mentioned you: " + truncate(text, 60) : "mentioned you in a comment";
            default:            return text != null ? text : type.name().toLowerCase();
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }

    @Transactional
    public void createStoryNotification(User recipient, User actor, com.insta.model.Story story) {
        if (recipient == null || actor == null || recipient.getId().equals(actor.getId())) {
            return;
        }
        Notification notif = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.STORY_LIKE)
                .story(story)
                .text("liked your story")
                .isRead(false)
                .build();

        notificationRepository.save(notif);

        // 1. Push real-time WebSocket notification (works while browser tab is open)
        pushWebSocketNotification(recipient, actor, "STORY_LIKE", "liked your story", actor.getProfilePicUrl());

        // 2. Send Web Push via VAPID (works even when browser is completely closed ✅)
        webPushService.sendPushToUser(recipient, "STORY_LIKE", actor.getUsername(),
                "liked your story", actor.getProfilePicUrl(), "/notifications");
    }

    @Transactional
    public void removeNotification(User recipient, User actor, NotificationType type) {
        if (recipient != null && actor != null) {
            notificationRepository.deleteByRecipientAndActorAndType(recipient, actor, type);
        }
    }

    @Transactional
    public void processMentions(User actor, String text, Post post) {
        if (text == null || text.isBlank()) return;

        // Match @username pattern
        Pattern pattern = Pattern.compile("@([a-zA-Z0-9_.]+)");
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            String username = matcher.group(1);
            Optional<User> mentionedUserOpt = userRepository.findByUsername(username);
            if (mentionedUserOpt.isPresent()) {
                User mentionedUser = mentionedUserOpt.get();
                if (!mentionedUser.getId().equals(actor.getId())) {
                    createNotification(mentionedUser, actor, NotificationType.MENTION, post, null, text);
                }
            }
        }
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> notifs = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        for (Notification n : notifs) {
            if (!n.isRead()) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        }
    }
}
