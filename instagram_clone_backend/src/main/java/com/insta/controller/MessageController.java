package com.insta.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.dto.SearchDTO;
import com.insta.model.Message;
import com.insta.model.Reel;
import com.insta.model.Post;
import com.insta.model.User;
import com.insta.repository.MessageRepository;
import com.insta.repository.UserRepository;
import com.insta.repository.ReelRepository;
import com.insta.repository.PostRepository;
import com.insta.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final ReelRepository reelRepository;
    private final PostRepository postRepository;

    /**
     * GET /api/messages/conversations
     * Returns a list of users the current user has chatted with.
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(@RequestHeader("Authorization") String auth) {
        try {
            User me = userService.getUserByToken(auth);
            if (me == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }

            List<Message> allMessages = messageRepository.findAllUserMessages(me.getId());
            java.util.Map<Long, Message> latestMessageMap = new java.util.LinkedHashMap<>();

            if (allMessages != null) {
                for (Message m : allMessages) {
                    User partner = m.getSender().getId().equals(me.getId()) ? m.getRecipient() : m.getSender();
                    if (partner != null && !latestMessageMap.containsKey(partner.getId())) {
                        latestMessageMap.put(partner.getId(), m);
                    }
                }
            }

            List<SearchDTO> result = new java.util.ArrayList<>();
            for (java.util.Map.Entry<Long, Message> entry : latestMessageMap.entrySet()) {
                Message latestMsg = entry.getValue();
                User partner = latestMsg.getSender().getId().equals(me.getId()) ? latestMsg.getRecipient() : latestMsg.getSender();
                if (partner == null) continue;

                long unread = 0;
                try {
                    unread = messageRepository.countByRecipientIdAndSenderIdAndIsReadFalse(me.getId(), partner.getId());
                } catch (Exception ignored) {
                }

                String lastMsgText = latestMsg.getContent();
                if ((lastMsgText == null || lastMsgText.isBlank()) && latestMsg.getReel() != null) {
                    lastMsgText = "Shared a reel";
                } else if ((lastMsgText == null || lastMsgText.isBlank()) && latestMsg.getPost() != null) {
                    lastMsgText = "Shared a post";
                }

                result.add(SearchDTO.builder()
                        .id(partner.getId())
                        .username(partner.getUsername())
                        .userprofile(partner.getProfilePicUrl())
                        .lastMessage(lastMsgText)
                        .lastMessageTime(latestMsg.getCreatedAt() != null ? latestMsg.getCreatedAt().toString() : null)
                        .unreadCount(unread)
                        .build());
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Helper to serialize Message containing optional Reel or Post
     */
    private Map<String, Object> formatMessage(Message m) {
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("id", m.getId());
        map.put("senderId", m.getSender().getId());
        try {
            if (m.getSender() != null) {
                map.put("senderUsername", m.getSender().getUsername());
                map.put("senderProfilePicUrl", m.getSender().getProfilePicUrl());
            }
        } catch (Exception ignored) {
        }
        map.put("content", m.getContent());
        map.put("createdAt", m.getCreatedAt().toString());
        // replied-to message (minimal)
        if (m.getRepliedTo() != null) {
            try {
                Message r = m.getRepliedTo();
                Map<String, Object> repliedMap = new java.util.HashMap<>();
                repliedMap.put("id", r.getId());
                repliedMap.put("senderId", r.getSender() != null ? r.getSender().getId() : null);
                try {
                    if (r.getSender() != null) {
                        repliedMap.put("senderUsername", r.getSender().getUsername());
                        repliedMap.put("senderProfilePicUrl", r.getSender().getProfilePicUrl());
                    }
                } catch (Exception ignored) {
                }
                repliedMap.put("content", r.getContent());
                map.put("repliedTo", repliedMap);
            } catch (Exception ignored) {
            }
        }
        if (m.getReel() != null) {
            Map<String, Object> reelMap = new java.util.HashMap<>();
            reelMap.put("id", m.getReel().getId());
            reelMap.put("videoUrl", m.getReel().getVideoUrl());
            reelMap.put("caption", m.getReel().getCaption() != null ? m.getReel().getCaption() : "");
            try {
                Reel reelObj = reelRepository.findById(m.getReel().getId()).orElse(null);
                if (reelObj != null && reelObj.getUser() != null) {
                    reelMap.put("username", reelObj.getUser().getUsername());
                    reelMap.put("profilePicUrl", reelObj.getUser().getProfilePicUrl());
                }
            } catch (Exception ignored) {
            }
            map.put("reel", reelMap);
        }
        if (m.getPost() != null) {
            // Build post payload, try to load full Post from repository when possible
            Map<String, Object> postMap = new java.util.HashMap<>();
            try {
                Post postObj = null;
                if (m.getPost() != null && m.getPost().getId() != null) {
                    postObj = postRepository.findById(m.getPost().getId()).orElse(null);
                }
                if (postObj == null && m.getPost() != null) {
                    // fallback to the attached post reference
                    postObj = m.getPost();
                }
                if (postObj != null) {
                    postMap.put("id", postObj.getId());
                    postMap.put("imageUrl", postObj.getImageUrl());
                    postMap.put("caption", postObj.getCaption() != null ? postObj.getCaption() : "");
                    postMap.put("mediaType", postObj.getMediaType() != null ? postObj.getMediaType() : "image");
                    if (postObj.getUser() != null) {
                        postMap.put("username", postObj.getUser().getUsername());
                        postMap.put("profilePicUrl", postObj.getUser().getProfilePicUrl());
                    }
                    map.put("post", postMap);
                }
            } catch (Exception ignored) {
            }
        }
        return map;
    }

    /**
     * GET /api/messages/unread-count
     * Returns total unread messages count for the current user.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadMessageCount(@RequestHeader("Authorization") String auth) {
        try {
            User me = userService.getUserByToken(auth);
            if (me == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            long count = 0;
            try {
                count = messageRepository.countByRecipientIdAndIsReadFalse(me.getId());
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }

    /**
     * GET /api/messages/history/{recipientId}
     * Returns the full chronological chat history between the current user and the
     * given user.
     */
    @GetMapping("/history/{recipientId}")
    public ResponseEntity<?> getChatHistory(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long recipientId) {
        try {
            User me = userService.getUserByToken(auth);
            if (me == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            // Safely mark incoming messages from this user as read
            try {
                messageRepository.markMessagesAsRead(me.getId(), recipientId);
            } catch (Exception ignored) {
            }

            List<Message> messages = messageRepository.findChatHistory(me.getId(), recipientId);
            List<Map<String, Object>> result = messages.stream().map(this::formatMessage).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/messages/send
     * Body: { "recipientId": 42, "content": "Hello!", "reelId": 123 }
     * Sends a message from the current user to the specified recipient.
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, Object> body) {
        try {
            User sender = userService.getUserByToken(auth);
            if (sender == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            Long recipientId = Long.parseLong(body.get("recipientId").toString());
            String content = body.get("content") != null ? body.get("content").toString().trim() : "";

            Long reelId = null;
            if (body.get("reelId") != null) {
                try {
                    reelId = Long.parseLong(body.get("reelId").toString());
                } catch (Exception ignored) {
                }
            }

            Long postId = null;
            if (body.get("postId") != null) {
                try {
                    postId = Long.parseLong(body.get("postId").toString());
                } catch (Exception ignored) {
                }
            }

            if (content.isEmpty() && reelId == null && postId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message content cannot be empty"));
            }

            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Message msg = new Message();
            msg.setSender(sender);
            msg.setRecipient(recipient);
            msg.setContent(content);
            msg.setCreatedAt(LocalDateTime.now());

            if (reelId != null) {
                Reel reel = reelRepository.findById(reelId).orElse(null);
                msg.setReel(reel);
            }
            if (postId != null) {
                Post post = postRepository.findById(postId).orElse(null);
                msg.setPost(post);
            }

            // repliedTo handling
            Long repliedToId = null;
            if (body.get("repliedToMessageId") != null) {
                try {
                    repliedToId = Long.parseLong(body.get("repliedToMessageId").toString());
                } catch (Exception ignored) {
                }
            }
            if (repliedToId != null) {
                Message replied = messageRepository.findById(repliedToId).orElse(null);
                msg.setRepliedTo(replied);
            }

            Message saved = messageRepository.save(msg);

            return ResponseEntity.ok(formatMessage(saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{messageId}")
    public ResponseEntity<?> deleteMessage(@RequestHeader("Authorization") String auth, @PathVariable Long messageId) {
        try {
            User user = userService.getUserByToken(auth);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("Message not found"));
            if (!message.getSender().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized to delete this message"));
            }
            messageRepository.delete(message);
            return ResponseEntity.ok(Map.of("message", "Message deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/edit/{messageId}")
    public ResponseEntity<?> editMessage(
            @RequestHeader("Authorization") String auth,
            @PathVariable Long messageId,
            @RequestBody Map<String, Object> body) {
        try {
            User user = userService.getUserByToken(auth);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new RuntimeException("Message not found"));
            if (!message.getSender().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized to edit this message"));
            }
            String content = body.get("content").toString().trim();
            if (content.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message content cannot be empty"));
            }
            message.setContent(content);
            Message saved = messageRepository.save(message);
            return ResponseEntity.ok(formatMessage(saved));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
