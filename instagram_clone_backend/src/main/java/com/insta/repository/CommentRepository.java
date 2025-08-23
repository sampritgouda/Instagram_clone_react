package com.insta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.Comment;
import com.insta.model.Post;
import com.insta.model.Reel;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>{

	List<Comment> findByReel(Reel reel);

	List<Comment> findByPost(Post post);

}
