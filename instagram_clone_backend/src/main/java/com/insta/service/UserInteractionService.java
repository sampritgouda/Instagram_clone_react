package com.insta.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.model.UserInteraction;
import com.insta.model.UserInteraction.InteractionType;
import com.insta.repository.UserInteractionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserInteractionService {

    private final UserInteractionRepository userInteractionRepository;

    @Transactional
    public UserInteraction logInteraction(User user, Post post, Reel reel, InteractionType type, Double watchTime) {
        if (user == null || type == null) {
            return null;
        }

        UserInteraction interaction = UserInteraction.builder()
                .user(user)
                .post(post)
                .reel(reel)
                .type(type)
                .watchTime(watchTime)
                .build();

        return userInteractionRepository.save(interaction);
    }

    public List<UserInteraction> getUserInteractions(User user) {
        return userInteractionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public String generateTrainingCSV() {
        List<UserInteraction> list = userInteractionRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("id,user_id,post_id,reel_id,type,watch_time,created_at\n");

        for (UserInteraction ui : list) {
            csv.append(ui.getId()).append(",")
               .append(ui.getUser() != null ? ui.getUser().getId() : "").append(",")
               .append(ui.getPost() != null ? ui.getPost().getId() : "").append(",")
               .append(ui.getReel() != null ? ui.getReel().getId() : "").append(",")
               .append(ui.getType()).append(",")
               .append(ui.getWatchTime() != null ? ui.getWatchTime() : "").append(",")
               .append(ui.getCreatedAt() != null ? ui.getCreatedAt() : "").append("\n");
        }

        return csv.toString();
    }
}
