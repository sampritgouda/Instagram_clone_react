package com.insta.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.Save;
import com.insta.model.User;

@Repository
public interface SaveRepository extends JpaRepository<Save, Long>{

	Optional<Save> findByUserAndReel(User user, Reel reel);

	Optional<Save> findByUserAndPost(User user, Post post);

}
