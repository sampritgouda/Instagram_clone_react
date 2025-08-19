package com.insta.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.Follower;
import com.insta.model.User;

@Repository
public interface FollowerRepository extends JpaRepository<Follower, Long>{

	boolean existsByFollowingAndFollower(User following,User follower);

	Optional<Follower> findByFollowerAndFollowing(User logedUser, User user);

}
