package com.insta.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.insta.model.FollowRequest;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.FollowerRepository;
import com.insta.repository.ReelRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReelsService {
	
	private final ReelRepository reelRepository;
	private final FollowRequestRepository followRequestRepository;
	private final FollowerRepository followerRepository;

	public List<Reel> getAllReels(int page,int limit,User user)
	{
		Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
		return reelRepository.findAll(pageable).stream()
	            .peek(reel -> {
	                boolean liked = reel.getLikes().stream()
	                    .anyMatch(like -> like.getUser().getId().equals(user.getId()));
	                boolean saved = reel.getSaves().stream()
	                    .anyMatch(save -> save.getUser().getId().equals(user.getId()));
	               boolean followed = followerRepository.existsByFollowingAndFollower(reel.getUser(), user);
	               boolean requested = followRequestRepository.existsByRequesterAndTargetAndStatus(user, reel.getUser(), FollowRequest.RequestStatus.PENDING);
	               boolean own = reel.getUser().getId().equals(user.getId());
	               reel.getUser().setFollowed(followed);
	               reel.getUser().setRequested(requested);
	               reel.getUser().setOwn(own);
	                reel.setLiked(liked);
	                reel.setLikeCount(reel.getLikes().size());
	                reel.setSaved(saved);
	                reel.setSaveCount(reel.getSaves().size());
	            })
	            .collect(Collectors.toList());
	}
}
