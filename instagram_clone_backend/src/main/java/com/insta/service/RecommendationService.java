package com.insta.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.model.UserInteraction;
import com.insta.model.UserInteraction.InteractionType;
import com.insta.repository.FollowerRepository;
import com.insta.repository.UserInteractionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final UserInteractionRepository userInteractionRepository;
    private final FollowerRepository followerRepository;

    /**
     * Extracts hashtags (e.g. #fitness) and key words (length > 3) from text.
     */
    private Set<String> extractHashtagsAndKeywords(String text) {
        if (text == null || text.isBlank()) return Set.of();
        Set<String> result = new HashSet<>();
        String[] words = text.toLowerCase().split("\\s+");
        for (String w : words) {
            String cleaned = w.replaceAll("[^#a-zA-Z0-9]", "");
            if (cleaned.startsWith("#") && cleaned.length() > 1) {
                result.add(cleaned);
            } else if (cleaned.length() > 3) {
                result.add(cleaned);
            }
        }
        return result;
    }

    /**
     * Scores and ranks candidate posts based on user's interaction history, hashtags, and captions.
     */
    public List<Post> rankPostsForUser(User user, List<Post> candidatePosts) {
        if (candidatePosts == null || candidatePosts.isEmpty() || user == null) {
            return candidatePosts;
        }

        // Fetch past interactions for this user
        List<UserInteraction> interactions = userInteractionRepository.findByUserOrderByCreatedAtDesc(user);

        // Affinity maps
        Map<Long, Integer> authorAffinity = new HashMap<>();
        Map<String, Integer> moodAffinity = new HashMap<>();
        Map<String, Integer> tagAffinity = new HashMap<>();

        for (UserInteraction ui : interactions) {
            int weight = getWeight(ui.getType(), ui.getWatchTime());

            if (ui.getPost() != null) {
                Post post = ui.getPost();
                if (post.getUser() != null) {
                    Long authorId = post.getUser().getId();
                    authorAffinity.put(authorId, authorAffinity.getOrDefault(authorId, 0) + weight);
                }
                if (post.getMood() != null && !post.getMood().isBlank()) {
                    String mood = post.getMood().toLowerCase();
                    moodAffinity.put(mood, moodAffinity.getOrDefault(mood, 0) + weight);
                }
                // Extract hashtags and keywords from post caption
                Set<String> tags = extractHashtagsAndKeywords(post.getCaption());
                for (String t : tags) {
                    tagAffinity.put(t, tagAffinity.getOrDefault(t, 0) + weight);
                }
            }
        }

        // Followed authors set
        Set<Long> followedUserIds = followerRepository.findAll().stream()
                .filter(f -> f.getFollower().getId().equals(user.getId()))
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toSet());

        // Score each candidate post
        Map<Post, Double> postScores = new HashMap<>();
        for (Post p : candidatePosts) {
            double score = 0.0;
            Long authorId = p.getUser() != null ? p.getUser().getId() : null;

            // 1. Followed Author (+20)
            if (authorId != null && followedUserIds.contains(authorId)) {
                score += 20.0;
            }

            // 2. Author Interaction Affinity (+15 max)
            if (authorId != null && authorAffinity.containsKey(authorId)) {
                score += Math.min(15.0, authorAffinity.get(authorId) * 2.0);
            }

            // 3. Mood Affinity (+15 max)
            if (p.getMood() != null && !p.getMood().isBlank()) {
                String mood = p.getMood().toLowerCase();
                if (moodAffinity.containsKey(mood)) {
                    score += Math.min(15.0, moodAffinity.get(mood) * 3.0);
                }
            }

            // 4. Hashtag & Caption Keyword Match (+15 max)
            Set<String> candidateTags = extractHashtagsAndKeywords(p.getCaption());
            for (String tag : candidateTags) {
                if (tagAffinity.containsKey(tag)) {
                    score += Math.min(15.0, tagAffinity.get(tag) * 2.5);
                }
            }

            // 5. Overall Engagement (Likes count)
            if (p.getLikes() != null) {
                score += p.getLikes().size() * 0.5;
            }

            // 6. Recency boost (+8 if created in last 24h)
            if (p.getCreatedAt() != null && p.getCreatedAt().isAfter(LocalDateTime.now().minusDays(1))) {
                score += 8.0;
            } else if (p.getCreatedAt() != null && p.getCreatedAt().isAfter(LocalDateTime.now().minusDays(7))) {
                score += 4.0;
            }

            postScores.put(p, score);
        }

        // Sort candidates in descending order of recommendation score
        candidatePosts.sort((p1, p2) -> Double.compare(postScores.getOrDefault(p2, 0.0), postScores.getOrDefault(p1, 0.0)));
        return candidatePosts;
    }

    /**
     * Scores and ranks candidate reels based on watch time, hashtags, and captions.
     */
    public List<Reel> rankReelsForUser(User user, List<Reel> candidateReels) {
        if (candidateReels == null || candidateReels.isEmpty() || user == null) {
            return candidateReels;
        }

        List<UserInteraction> interactions = userInteractionRepository.findByUserOrderByCreatedAtDesc(user);
        Map<Long, Double> authorWatchTime = new HashMap<>();
        Map<String, Double> reelTagAffinity = new HashMap<>();

        for (UserInteraction ui : interactions) {
            if (ui.getReel() != null) {
                Reel reel = ui.getReel();
                if (reel.getUser() != null) {
                    Long authorId = reel.getUser().getId();
                    double watchSec = ui.getWatchTime() != null ? ui.getWatchTime() : 1.0;
                    authorWatchTime.put(authorId, authorWatchTime.getOrDefault(authorId, 0.0) + watchSec);
                }
                Set<String> tags = extractHashtagsAndKeywords(reel.getCaption());
                double scoreGain = getWeight(ui.getType(), ui.getWatchTime());
                for (String t : tags) {
                    reelTagAffinity.put(t, reelTagAffinity.getOrDefault(t, 0.0) + scoreGain);
                }
            }
        }

        Set<Long> followedUserIds = followerRepository.findAll().stream()
                .filter(f -> f.getFollower().getId().equals(user.getId()))
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toSet());

        Map<Reel, Double> reelScores = new HashMap<>();
        for (Reel r : candidateReels) {
            double score = 0.0;
            Long authorId = r.getUser() != null ? r.getUser().getId() : null;

            if (authorId != null && followedUserIds.contains(authorId)) {
                score += 20.0;
            }

            if (authorId != null && authorWatchTime.containsKey(authorId)) {
                score += Math.min(25.0, authorWatchTime.get(authorId) * 1.5);
            }

            // Hashtag & Caption Keyword matching for Reels
            Set<String> reelTags = extractHashtagsAndKeywords(r.getCaption());
            for (String tag : reelTags) {
                if (reelTagAffinity.containsKey(tag)) {
                    score += Math.min(15.0, reelTagAffinity.get(tag) * 2.0);
                }
            }

            if (r.getLikes() != null) {
                score += r.getLikes().size() * 0.5;
            }

            if (r.getCreatedAt() != null && r.getCreatedAt().isAfter(LocalDateTime.now().minusDays(2))) {
                score += 5.0;
            }

            reelScores.put(r, score);
        }

        candidateReels.sort((r1, r2) -> Double.compare(reelScores.getOrDefault(r2, 0.0), reelScores.getOrDefault(r1, 0.0)));
        return candidateReels;
    }

    private int getWeight(InteractionType type, Double watchTime) {
        if (type == null) return 1;
        switch (type) {
            case LIKE: return 5;
            case COMMENT: return 8;
            case SAVE: return 10;
            case SHARE: return 10;
            case VIEW: return watchTime != null && watchTime > 10.0 ? 4 : 2;
            case SKIP: return -2;
            default: return 1;
        }
    }
}
