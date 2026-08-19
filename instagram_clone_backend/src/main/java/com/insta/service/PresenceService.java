package com.insta.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    // Map userId -> count of active connections
    private final ConcurrentHashMap<Long, Integer> activeUserConnections = new ConcurrentHashMap<>();

    public void userConnected(Long userId) {
        if (userId == null) return;
        activeUserConnections.compute(userId, (key, count) -> {
            int updated = (count == null) ? 1 : count + 1;
            if (updated == 1) {
                // Broadcast online status
                messagingTemplate.convertAndSend("/topic/presence", Map.of(
                        "userId", userId,
                        "status", "ONLINE"
                ));
            }
            return updated;
        });
    }

    public void userDisconnected(Long userId) {
        if (userId == null) return;
        activeUserConnections.computeIfPresent(userId, (key, count) -> {
            int updated = count - 1;
            if (updated <= 0) {
                // Broadcast offline status
                messagingTemplate.convertAndSend("/topic/presence", Map.of(
                        "userId", userId,
                        "status", "OFFLINE"
                ));
                return null;
            }
            return updated;
        });
    }

    public boolean isUserOnline(Long userId) {
        return userId != null && activeUserConnections.containsKey(userId);
    }

    public Set<Long> getOnlineUsers() {
        return activeUserConnections.keySet();
    }
}
