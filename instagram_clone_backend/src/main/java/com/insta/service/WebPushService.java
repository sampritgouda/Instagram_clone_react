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
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.impl.nio.client.CloseableHttpAsyncClient;
import org.apache.http.impl.nio.client.HttpAsyncClients;
import org.apache.http.ssl.SSLContexts;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import javax.net.ssl.SSLContext;
import java.security.Security;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private CloseableHttpAsyncClient customHttpClient;

    @PostConstruct
    public void init() {
        System.setProperty("jsse.enableSNIExtension", "true");

        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        try {
            SSLContext sslContext = SSLContexts.custom()
                    .loadTrustMaterial(null, new TrustSelfSignedStrategy())
                    .build();

            this.customHttpClient = HttpAsyncClients.custom()
                    .setSSLContext(sslContext)
                    .setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                    .build();
            this.customHttpClient.start();

            this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
            log.info("✅ WebPushService initialized with custom SSL async client");
        } catch (Exception e) {
            log.error("❌ Failed to initialize WebPushService: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void destroy() {
        if (customHttpClient != null) {
            try {
                customHttpClient.close();
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public void saveSubscription(User user, String endpoint, String p256dh, String auth) {
        Optional<WebPushSubscription> existing = subscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
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

    @Transactional
    public void removeSubscription(String endpoint) {
        subscriptionRepository.deleteByEndpoint(endpoint);
    }

    @Transactional
    public void removeAllSubscriptions(User user) {
        subscriptionRepository.deleteByUser(user);
    }

    @Async
    public void sendPushToUser(User recipient, String type, String title, String body, String icon, String clickUrl) {
        if (pushService == null || customHttpClient == null) return;

        List<WebPushSubscription> subscriptions = subscriptionRepository.findByUser(recipient);
        if (subscriptions.isEmpty()) return;

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
                
                HttpPost httpPost = pushService.preparePost(notification);
                HttpResponse response = customHttpClient.execute(httpPost, null).get();
                int statusCode = response.getStatusLine().getStatusCode();

                if (statusCode == 201 || statusCode == 200) {
                    log.info("✅ Push notification sent successfully to {}", recipient.getUsername());
                } else if (statusCode == 404 || statusCode == 410) {
                    log.warn("Subscription expired/invalid (status {}), removing sub for user {}", statusCode, recipient.getUsername());
                    subscriptionRepository.deleteByEndpoint(sub.getEndpoint());
                } else {
                    log.warn("Push server returned status {} for user {}", statusCode, recipient.getUsername());
                }
            } catch (Exception e) {
                log.warn("Push failed for endpoint: {}", e.getMessage());
                try {
                    subscriptionRepository.deleteByEndpoint(sub.getEndpoint());
                } catch (Exception ignored) {}
            }
        }
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }
}

