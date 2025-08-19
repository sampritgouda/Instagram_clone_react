package com.insta.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insta.model.FollowRequest;
import com.insta.model.Follower;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.FollowerRepository;
import com.insta.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FollowService {
    private final UserRepository userRepo;
    private final FollowerRepository followRepo;
    private final FollowRequestRepository requestRepo;

    @Transactional
    public void handleFollow(User follower, User target) {
        

        // Check if already following
        if (followRepo.existsByFollowingAndFollower(target, follower)) {
            return ;
        }

        // Public profile → follow directly
        if (!target.getIsPrivate()) {
            Follower follow = Follower.builder()
                    .follower(follower)
                    .following(target)
                    .followedAt(LocalDateTime.now())
                    .build();
            followRepo.save(follow);
            return ;
        }

        // Private profile → send request
        if (!requestRepo.existsByRequesterAndTargetAndStatus(follower, target, FollowRequest.RequestStatus.PENDING)) {
            FollowRequest request = FollowRequest.builder()
                    .requester(follower)
                    .target(target)
                    .status(FollowRequest.RequestStatus.PENDING)
                    .build();
            requestRepo.save(request);
            return;
        }

        return;
    }

    @Transactional
    public String respondToFollowRequest(Long requestId, boolean accept) {
        FollowRequest request = requestRepo.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (accept) {
            request.setStatus(FollowRequest.RequestStatus.ACCEPTED);
            requestRepo.save(request);

            Follower follow = Follower.builder()
                    .follower(request.getRequester())
                    .following(request.getTarget())
                    .followedAt(LocalDateTime.now())
                    .build();
            followRepo.save(follow);

            return "Request accepted";
        } else {
            request.setStatus(FollowRequest.RequestStatus.REJECTED);
            requestRepo.save(request);
            return "Request rejected";
        }
    }

	public void hanndleUnfollowAndRequest(User user, User logedUser) {
		boolean requested = requestRepo.existsByRequesterAndTargetAndStatus(logedUser, user, FollowRequest.RequestStatus.PENDING);
		if(requested)
		{
			FollowRequest req = requestRepo.findByRequesterAndTarget(logedUser,user).orElseThrow();
			requestRepo.delete(req);
			return ;
		}
		Follower follwer = followRepo.findByFollowerAndFollowing(logedUser,user).orElseThrow();

		followRepo.delete(follwer);
		
	}
}
