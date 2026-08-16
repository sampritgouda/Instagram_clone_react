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

import java.io.IOException;
import java.util.Map;
import com.cloudinary.Cloudinary;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CommentService {

	private final ReelRepository reelRepository;
	private final PostRepository postRepository;
	private final CommentRepository commentRepository;
	private final Cloudinary cloudinary;
	private final NotificationService notificationService;
	private final UserInteractionService userInteractionService;

	public List<CommentDTO> getCommnetsByType(Long id, String type) {
		List<Comment> comments = null;
		if (type.equals("reel")) {
			Reel reel = reelRepository.findById(id).orElseThrow();
			comments = commentRepository.findByReel(reel);
		} else {
			Post post = postRepository.findById(id).orElseThrow();
			comments = commentRepository.findByPost(post);
		}
		// Only return top-level comments (no repliedTo)
		List<Comment> topLevel = comments.stream().filter(c -> c.getRepliedTo() == null).toList();
		List<CommentDTO> commentsdto = topLevel.stream().map(comment -> {
			CommentDTO.CommentDTOBuilder builder = CommentDTO.builder()
					.id(comment.getId())
					.username(comment.getUser().getUsername())
					.userId(comment.getUser().getId())
					.text(comment.getText())
					.userprofile(comment.getUser().getProfilePicUrl())
					.audioUrl(comment.getAudioUrl())
					.isVoice(comment.getIsVoice());
			long rc = commentRepository.countByRepliedTo(comment);
			builder.replyCount((int) rc);
			return builder.build();
		}).toList();
		return commentsdto;

	}

	public List<CommentDTO> getRepliesForComment(Long commentId) {
		Comment parent = commentRepository.findById(commentId).orElseThrow();
		List<Comment> replies = commentRepository.findByRepliedTo(parent);
		List<CommentDTO> dto = replies.stream().map(comment -> {
			CommentDTO.CommentDTOBuilder builder = CommentDTO.builder()
					.id(comment.getId())
					.username(comment.getUser().getUsername())
					.userId(comment.getUser().getId())
					.text(comment.getText())
					.userprofile(comment.getUser().getProfilePicUrl())
					.audioUrl(comment.getAudioUrl())
					.isVoice(comment.getIsVoice());
			if (comment.getRepliedTo() != null) {
				builder.repliedToId(comment.getRepliedTo().getId())
						.repliedToUserId(comment.getRepliedTo().getUser().getId())
						.repliedToUsername(comment.getRepliedTo().getUser().getUsername())
						.repliedToText(comment.getRepliedTo().getText());
			}
			return builder.build();
		}).toList();
		return dto;
	}

	public CommentDTO addComments(Long id, User user, String type, String commentVal, Long repliedToId) {
		Comment save = null;
		if (type.equals("reel")) {
			Reel reel = reelRepository.findById(id).orElseThrow();
			Comment comment = new Comment();
			comment.setReel(reel);
			comment.setUser(user);
			comment.setText(commentVal);
			comment.setCreatedAt(LocalDateTime.now());
			if (repliedToId != null) {
				Comment replied = commentRepository.findById(repliedToId).orElse(null);
				if (replied != null)
					comment.setRepliedTo(replied);
			}
			save = commentRepository.save(comment);
			notificationService.createNotification(reel.getUser(), user, com.insta.model.Notification.NotificationType.COMMENT, null, reel, commentVal);
			userInteractionService.logInteraction(user, null, reel, com.insta.model.UserInteraction.InteractionType.COMMENT, null);
		} else {
			Post post = postRepository.findById(id).orElseThrow();
			Comment comment = new Comment();
			comment.setPost(post);
			comment.setUser(user);
			comment.setText(commentVal);
			comment.setCreatedAt(LocalDateTime.now());
			if (repliedToId != null) {
				Comment replied = commentRepository.findById(repliedToId).orElse(null);
				if (replied != null)
					comment.setRepliedTo(replied);
			}
			save = commentRepository.save(comment);
			notificationService.createNotification(post.getUser(), user, com.insta.model.Notification.NotificationType.COMMENT, post, null, commentVal);
			notificationService.processMentions(user, commentVal, post);
			userInteractionService.logInteraction(user, post, null, com.insta.model.UserInteraction.InteractionType.COMMENT, null);
		}
		CommentDTO newcomment = CommentDTO.builder().id(save.getId())
				.userId(save.getUser().getId())
				.username(save.getUser().getUsername())
				.userprofile(save.getUser().getProfilePicUrl())
				.text(save.getText())
				.isVoice(false)
				.build();
		if (save.getRepliedTo() != null) {
			newcomment.setRepliedToId(save.getRepliedTo().getId());
			newcomment.setRepliedToUserId(save.getRepliedTo().getUser().getId());
			newcomment.setRepliedToUsername(save.getRepliedTo().getUser().getUsername());
			newcomment.setRepliedToText(save.getRepliedTo().getText());
		}
		return newcomment;
	}

	public CommentDTO addVoiceComment(Long id, User user, String type, MultipartFile audioFile, Long repliedToId)
			throws IOException {
		Map uploadResult = cloudinary.uploader().upload(
				audioFile.getBytes(),
				Map.of("resource_type", "video") // WebM is treated as a video container by Cloudinary
		);
		String url = uploadResult.get("secure_url").toString();
		String publicId = uploadResult.get("public_id").toString();

		Comment comment = new Comment();
		comment.setUser(user);
		comment.setAudioUrl(url);
		comment.setAudioPublicId(publicId);
		comment.setIsVoice(true);
		comment.setCreatedAt(LocalDateTime.now());

		if (type.equals("reel")) {
			Reel reel = reelRepository.findById(id).orElseThrow();
			comment.setReel(reel);
		} else {
			Post post = postRepository.findById(id).orElseThrow();
			comment.setPost(post);
		}
		if (repliedToId != null) {
			Comment replied = commentRepository.findById(repliedToId).orElse(null);
			if (replied != null)
				comment.setRepliedTo(replied);
		}
		Comment save = commentRepository.save(comment);

		CommentDTO.CommentDTOBuilder builder = CommentDTO.builder().id(save.getId())
				.userId(save.getUser().getId())
				.username(save.getUser().getUsername())
				.userprofile(save.getUser().getProfilePicUrl())
				.audioUrl(save.getAudioUrl())
				.isVoice(true);
		if (save.getRepliedTo() != null) {
			builder.repliedToId(save.getRepliedTo().getId())
					.repliedToUserId(save.getRepliedTo().getUser().getId())
					.repliedToUsername(save.getRepliedTo().getUser().getUsername())
					.repliedToText(save.getRepliedTo().getText());
		}
		return builder.build();
	}

	public void deleteComment(Long commentId, User currentUser) {
		Comment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new RuntimeException("Comment not found"));

		boolean isCommentCreator = comment.getUser().getId().equals(currentUser.getId());
		boolean isPostOwner = (comment.getPost() != null
				&& comment.getPost().getUser().getId().equals(currentUser.getId()));
		boolean isReelOwner = (comment.getReel() != null
				&& comment.getReel().getUser().getId().equals(currentUser.getId()));

		if (isCommentCreator || isPostOwner || isReelOwner) {
			commentRepository.delete(comment);
		} else {
			throw new RuntimeException("Unauthorized to delete this comment");
		}
	}

	public CommentDTO editComment(Long commentId, String newText, User currentUser) {
		Comment comment = commentRepository.findById(commentId)
				.orElseThrow(() -> new RuntimeException("Comment not found"));

		if (!comment.getUser().getId().equals(currentUser.getId())) {
			throw new RuntimeException("Unauthorized to edit this comment");
		}

		comment.setText(newText);
		Comment saved = commentRepository.save(comment);

		return CommentDTO.builder()
				.id(saved.getId())
				.userId(saved.getUser().getId())
				.username(saved.getUser().getUsername())
				.userprofile(saved.getUser().getProfilePicUrl())
				.text(saved.getText())
				.audioUrl(saved.getAudioUrl())
				.isVoice(saved.getIsVoice())
				.build();
	}
}
