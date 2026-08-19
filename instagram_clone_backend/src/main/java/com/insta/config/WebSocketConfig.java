package com.insta.config;

import com.insta.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5175",
                    "https://instagram-clone-react.onrender.com",
                    "https://instagram-clone-react-1.onrender.com"
                )
                .withSockJS();

        registry.addEndpoint("/ws-raw")
                .setAllowedOriginPatterns(
                    "http://localhost:5173",
                    "http://localhost:5174",
                    "http://localhost:5175",
                    "https://instagram-clone-react.onrender.com",
                    "https://instagram-clone-react-1.onrender.com"
                );
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
