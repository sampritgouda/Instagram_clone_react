package com.insta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.Notification;
import com.insta.model.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    // Check if notification already exists to avoid duplicates
    boolean existsByRecipientAndActorAndTypeAndPost(User recipient, User actor, Notification.NotificationType type, com.insta.model.Post post);
    
    void deleteByRecipientAndActorAndType(User recipient, User actor, Notification.NotificationType type);

    long countByRecipientAndIsReadFalse(User recipient);
}
