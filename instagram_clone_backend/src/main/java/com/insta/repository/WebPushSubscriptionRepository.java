package com.insta.repository;

import com.insta.model.User;
import com.insta.model.WebPushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WebPushSubscriptionRepository extends JpaRepository<WebPushSubscription, Long> {

    /** Get all push subscriptions for a user (all their devices). */
    List<WebPushSubscription> findByUser(User user);

    /** Find by endpoint to avoid duplicate inserts. */
    Optional<WebPushSubscription> findByEndpoint(String endpoint);

    /** Delete by endpoint when user unsubscribes a specific device. */
    void deleteByEndpoint(String endpoint);

    /** Delete all subscriptions for a user (on logout). */
    void deleteByUser(User user);
}
