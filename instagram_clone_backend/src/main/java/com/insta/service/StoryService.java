package com.insta.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import com.insta.dto.UserStoriesResponse;
import com.insta.model.Story;
import com.insta.model.User;
import com.insta.repository.StoryRepository;
import com.insta.repository.StoryViewRepository;
import com.insta.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StoryService {
	
	private final StoryRepository storyRepository;
	private final UserRepository userRepository;
	private final StoryViewRepository storyViewRepository;
	
	public List<UserStoriesResponse> getAllStories(Long viewerId) {
	    User viewer = userRepository.findById(viewerId)
	            .orElseThrow(() -> new RuntimeException("User not found"));

	     List<Story> allStories = storyRepository.findAll().stream().peek(story ->{
	    	 boolean seen = story.getStoryViews().stream()
	    			 .anyMatch(storyview ->storyview.getViewer().getId().equals(viewerId));
	    	 story.setSeen(seen);
	    	 story.setSeenCount(story.getStoryViews().size());
	     }).toList();

	    // Group by user
	    Map<User, List<Story>> grouped = allStories.stream()
	            .collect(Collectors.groupingBy(Story::getUser));

	    // Convert to DTO list
	    List<UserStoriesResponse> responses = grouped.entrySet().stream()
	            .map(entry -> {
	                User owner = entry.getKey();
	                List<Story> stories = entry.getValue().stream()
	                        .sorted(Comparator.comparing(Story::getCreatedAt)) // oldest first
	                        .collect(Collectors.toList());

	                // Get viewed story IDs by this viewer for this owner
	                List<Long> viewedIds = storyViewRepository.findViewedStoryIds(viewer.getId(), owner.getId());

	                boolean hasUnseen = stories.stream()
	                        .anyMatch(s -> !viewedIds.contains(s.getId()));

	                LocalDateTime lastStoryTime = stories.get(stories.size() - 1).getCreatedAt();

	                return new UserStoriesResponse(
	                        owner.getId(),
	                        owner.getUsername(),
	                        owner.getProfilePicUrl(),
	                        stories,
	                        hasUnseen,
	                        lastStoryTime
	                );
	            })
	            // Sort: unseen first, then latest lastStoryTime
	            .sorted((a, b) -> {
	                if (a.isHasUnseen() && !b.isHasUnseen()) return -1;
	                if (!a.isHasUnseen() && b.isHasUnseen()) return 1;
	                return b.getLastStoryTime().compareTo(a.getLastStoryTime());
	            })
	            .collect(Collectors.toList());

	    // ---- Ensure logged-in user story is at index 0 ----
	    Optional<UserStoriesResponse> myStoryOpt = responses.stream()
	            .filter(r -> r.getUserId().equals(viewer.getId()))
	            .findFirst();

	    // Remove the logged-in user's story if it exists
	    responses.removeIf(r -> r.getUserId().equals(viewer.getId()));
	    
	    if (myStoryOpt.isPresent()) {
	        // Put it first
	        responses.add(0, myStoryOpt.get());
	        responses.get(0).setUsername("You");
	    } else {
	        // Insert null placeholder first if no story
	        responses.add(0, null);
	    }

	    return responses;
	}


	
}
