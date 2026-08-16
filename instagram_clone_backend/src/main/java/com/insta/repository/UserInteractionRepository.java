package com.insta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.User;
import com.insta.model.UserInteraction;
import com.insta.model.UserInteraction.InteractionType;

@Repository
public interface UserInteractionRepository extends JpaRepository<UserInteraction, Long> {

    List<UserInteraction> findByUserOrderByCreatedAtDesc(User user);

    List<UserInteraction> findByUserIdAndType(Long userId, InteractionType type);

    long countByUserIdAndType(Long userId, InteractionType type);
}
