package com.insta.service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
