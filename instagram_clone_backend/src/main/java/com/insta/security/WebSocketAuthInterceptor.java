package com.insta.security;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            String token = null;

            if (authorization != null && !authorization.isEmpty()) {
                String authHeader = authorization.get(0);
                if (authHeader.startsWith("Bearer ")) {
                    token = authHeader.substring(7);
                } else {
                    token = authHeader;
                }
            }

            if (token == null) {
                // Fallback to query parameter token if provided
                List<String> tokenParam = accessor.getNativeHeader("token");
                if (tokenParam != null && !tokenParam.isEmpty()) {
                    token = tokenParam.get(0);
                }
            }

            if (token != null && jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                accessor.setUser(auth);
            }
        }
        return message;
    }
}
