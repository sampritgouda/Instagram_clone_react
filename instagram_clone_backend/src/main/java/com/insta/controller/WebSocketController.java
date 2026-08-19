package com.insta.controller;

import com.insta.model.Message;
import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.MessageRepository;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.UserRepository;
import com.insta.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ReelRepository reelRepository;
    private final PostRepository postRepository;
    private final PresenceService presenceService;

    /**
     * Sanitizes string content to prevent XSS & Script Injections
     */
    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll("(?i)<script.*?>.*?</script>", "");
    }

    /**
     * Helper to serialize Message for WebSocket payload
     */
    private Map<String, Object> formatMessage(Message m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("senderId", m.getSender().getId());
        if (m.getSender() != null) {
            map.put("senderUsername", m.getSender().getUsername());
            map.put("senderProfilePicUrl", m.getSender().getProfilePicUrl());
        }
        map.put("content", m.getContent());
        map.put("createdAt", m.getCreatedAt().toString());
        map.put("isRead", m.getIsRead() != null ? m.getIsRead() : false);

        if (m.getRepliedTo() != null) {
            Message r = m.getRepliedTo();
            Map<String, Object> repliedMap = new HashMap<>();
            repliedMap.put("id", r.getId());
            repliedMap.put("senderId", r.getSender() != null ? r.getSender().getId() : null);
            if (r.getSender() != null) {
                repliedMap.put("senderUsername", r.getSender().getUsername());
                repliedMap.put("senderProfilePicUrl", r.getSender().getProfilePicUrl());
            }
            repliedMap.put("content", r.getContent());
            map.put("repliedTo", repliedMap);
        }

        if (m.getReel() != null) {
            Map<String, Object> reelMap = new HashMap<>();
            reelMap.put("id", m.getReel().getId());
            reelMap.put("videoUrl", m.getReel().getVideoUrl());
            reelMap.put("caption", m.getReel().getCaption() != null ? m.getReel().getCaption() : "");
            Reel reelObj = reelRepository.findById(m.getReel().getId()).orElse(null);
            if (reelObj != null) {
                reelMap.put("likeCount", reelObj.getLikes() != null ? reelObj.getLikes().size() : 0);
                if (reelObj.getUser() != null) {
                    reelMap.put("userId", reelObj.getUser().getId());
                    reelMap.put("username", reelObj.getUser().getUsername());
                    reelMap.put("profilePicUrl", reelObj.getUser().getProfilePicUrl());
                }
            }
            map.put("reel", reelMap);
        }

        if (m.getPost() != null) {
            Map<String, Object> postMap = new HashMap<>();
            postMap.put("id", m.getPost().getId());
            postMap.put("imageUrl", m.getPost().getImageUrl());
            postMap.put("caption", m.getPost().getCaption() != null ? m.getPost().getCaption() : "");
            Post postObj = postRepository.findById(m.getPost().getId()).orElse(null);
            if (postObj != null) {
                postMap.put("mediaType", postObj.getMediaType() != null ? postObj.getMediaType() : "image");
                postMap.put("likeCount", postObj.getLikes() != null ? postObj.getLikes().size() : 0);
                if (postObj.getUser() != null) {
                    postMap.put("userId", postObj.getUser().getId());
                    postMap.put("username", postObj.getUser().getUsername());
                    postMap.put("profilePicUrl", postObj.getUser().getProfilePicUrl());
                }
            }
            map.put("post", postMap);
        }
        return map;
    }

    /**
     * STOMP Message Handler: /app/chat.sendMessage
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
        if (principal == null) return;
        String senderUsername = principal.getName();
        User sender = userRepository.findByUsername(senderUsername).orElse(null);
        if (sender == null) return;

        Object recipientObj = payload.get("recipientId");
        if (recipientObj == null) return;
        Long recipientId = Long.parseLong(recipientObj.toString());

        User recipient = userRepository.findById(recipientId).orElse(null);
        if (recipient == null) return;

        String rawContent = payload.get("content") != null ? payload.get("content").toString().trim() : "";
        String cleanContent = sanitize(rawContent);

        Long reelId = payload.get("reelId") != null ? Long.parseLong(payload.get("reelId").toString()) : null;
        Long postId = payload.get("postId") != null ? Long.parseLong(payload.get("postId").toString()) : null;
        Long repliedToId = payload.get("repliedToMessageId") != null ? Long.parseLong(payload.get("repliedToMessageId").toString()) : null;

        if (cleanContent.isEmpty() && reelId == null && postId == null) return;

        Message msg = new Message();
        msg.setSender(sender);
        msg.setRecipient(recipient);
        msg.setContent(cleanContent);
        msg.setCreatedAt(LocalDateTime.now());
        msg.setIsRead(false);

        if (reelId != null) {
            Reel reel = reelRepository.findById(reelId).orElse(null);
            msg.setReel(reel);
        }
        if (postId != null) {
            Post post = postRepository.findById(postId).orElse(null);
            msg.setPost(post);
        }
        if (repliedToId != null) {
            Message replied = messageRepository.findById(repliedToId).orElse(null);
            msg.setRepliedTo(replied);
        }

        Message saved = messageRepository.save(msg);
        Map<String, Object> formatted = formatMessage(saved);

        // Send to recipient's private topic & sender's topic
        messagingTemplate.convertAndSend("/topic/messages." + recipientId, formatted);
        messagingTemplate.convertAndSend("/topic/messages." + sender.getId(), formatted);

        // Also push notification event to recipient
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "MESSAGE");
        notification.put("title", sender.getUsername());
        notification.put("body", cleanContent.isEmpty() ? "Sent a media attachment" : cleanContent);
        notification.put("senderId", sender.getId());
        notification.put("senderProfilePicUrl", sender.getProfilePicUrl());
        notification.put("createdAt", LocalDateTime.now().toString());
        messagingTemplate.convertAndSend("/topic/notifications." + recipientId, notification);
    }

    /**
     * STOMP Message Handler: /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload Map<String, Object> payload, Principal principal) {
        if (principal == null) return;
        String senderUsername = principal.getName();
        User sender = userRepository.findByUsername(senderUsername).orElse(null);
        if (sender == null) return;

        Object recipientObj = payload.get("recipientId");
        if (recipientObj == null) return;
        Long recipientId = Long.parseLong(recipientObj.toString());
        Boolean isTyping = payload.get("isTyping") != null && Boolean.parseBoolean(payload.get("isTyping").toString());

        Map<String, Object> typingEvent = Map.of(
                "senderId", sender.getId(),
                "senderUsername", sender.getUsername(),
                "recipientId", recipientId,
                "isTyping", isTyping
        );

        messagingTemplate.convertAndSend("/topic/typing." + recipientId, typingEvent);
    }

    /**
     * STOMP Message Handler: /app/chat.markSeen
     */
    @MessageMapping("/chat.markSeen")
    public void markSeen(@Payload Map<String, Object> payload, Principal principal) {
        if (principal == null) return;
        String username = principal.getName();
        User me = userRepository.findByUsername(username).orElse(null);
        if (me == null) return;

        Object partnerObj = payload.get("senderId");
        if (partnerObj == null) return;
        Long partnerId = Long.parseLong(partnerObj.toString());

        try {
            messageRepository.markMessagesAsRead(me.getId(), partnerId);
        } catch (Exception ignored) {}

        Map<String, Object> seenEvent = Map.of(
                "readerId", me.getId(),
                "senderId", partnerId
        );

        // Broadcast to partner so partner's UI updates message to "Seen"
        messagingTemplate.convertAndSend("/topic/seen." + partnerId, seenEvent);
    }

    /**
     * REST Endpoint to get list of online user IDs
     */
    @GetMapping("/api/presence/online-users")
    public ResponseEntity<Set<Long>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }
}
