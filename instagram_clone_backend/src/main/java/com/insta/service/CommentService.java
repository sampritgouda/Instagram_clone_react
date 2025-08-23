package com.insta.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.insta.dto.CommentDTO;
import com.insta.model.Comment;
import com.insta.model.Post;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.CommentRepository;
import com.insta.repository.PostRepository;
import com.insta.repository.ReelRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {
	
	private final ReelRepository reelRepository;
	private final PostRepository postRepository;
	private final CommentRepository commentRepository;
	
	
	public List<CommentDTO> getCommnetsByType(Long id,String type)
	{
		List<Comment> comments = null;
		if(type.equals("reel"))
		{
		Reel reel = reelRepository.findById(id).orElseThrow();
		 comments = commentRepository.findByReel(reel);
		}
		else
		{
			Post post = postRepository.findById(id).orElseThrow();
			comments = commentRepository.findByPost(post);
		}
		List<CommentDTO> commentsdto = comments.stream().map(comment -> {
			return CommentDTO.builder().id(comment.getId())
					.username(comment.getUser().getUsername())
					.userId(comment.getUser().getId())
					.text(comment.getText())
					.userprofile(comment.getUser().getProfilePicUrl())
					.build();
		}).toList();
		return commentsdto;
	}

	
	public CommentDTO addComments(Long id,User user,String type,String commentVal)
	{
		Comment save = null;
		if(type.equals("reel"))
		{
			Reel reel = reelRepository.findById(id).orElseThrow();
			Comment comment = new Comment();
			comment.setReel(reel);
			comment.setUser(user);
			comment.setText(commentVal);
			comment.setCreatedAt(LocalDateTime.now());
			 save = commentRepository.save(comment);
		}
		else
		{
			Post post = postRepository.findById(id).orElseThrow();
			Comment comment = new Comment();
			comment.setPost(post);
			comment.setUser(user);
			comment.setText(commentVal);
			comment.setCreatedAt(LocalDateTime.now());
			save = commentRepository.save(comment);
		}
		CommentDTO newcomment = CommentDTO.builder().id(save.getId())
		.userId(save.getUser().getId())
		.username(save.getUser().getUsername())
		.userprofile(save.getUser().getProfilePicUrl())
		.text(save.getText())
		.build();
		return newcomment;
	}
}
