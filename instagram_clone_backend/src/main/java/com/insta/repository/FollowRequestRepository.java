package com.insta.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.FollowRequest;
import com.insta.model.FollowRequest.RequestStatus;
import com.insta.model.User;
@Repository
public interface FollowRequestRepository extends JpaRepository<FollowRequest, Long> {

	boolean existsByRequesterAndTargetAndStatus(User follower, User target, FollowRequest.RequestStatus  status);

	Optional<FollowRequest> findByRequesterAndTarget(User logedUser, User user);

	List<FollowRequest> findByTargetAndStatus(User target,FollowRequest.RequestStatus status);

}
