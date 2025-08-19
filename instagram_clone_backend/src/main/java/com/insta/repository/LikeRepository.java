package com.insta.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import com.insta.model.Like;
import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {

	Optional<Like> findByUserAndReel(User user,Reel reel);

	Optional<Like> findByUserAndPost(User user, Post post);

}
