package com.insta.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.cloudinary.Cloudinary;
import com.insta.model.FollowRequest;
import com.insta.model.Post;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.FollowerRepository;
import com.insta.repository.PostRepository;
import com.insta.repository.UserRepository;
import com.insta.security.JwtUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {

    private final Cloudinary cloudinary;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
   private final  UserService userService;
   private final FollowerRepository followerRepository;
   private final FollowRequestRepository followRequestRepository;
   
   public List<Post> getAllPosts(int page,int limit,String authHeader)
   {
	   User user = userService.getUserByToken(authHeader);
  	 Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
  	return postRepository.findAll(pageable).stream().peek(post->{
  		boolean liked = post.getLikes().stream().anyMatch(like->
  			like.getUser().getId().equals(user.getId()));
  		boolean isRequested = followRequestRepository.existsByRequesterAndTargetAndStatus(user, post.getUser(),FollowRequest.RequestStatus.PENDING);
  		boolean isfollowed = followerRepository.existsByFollowingAndFollower(post.getUser(), user);
  		boolean saved = post.getSaves().stream().anyMatch(save->save.getUser().getId().equals(user.getId()));
  		boolean isOwn = post.getUser().getId().equals(user.getId());
  		post.getUser().setFollowed(isfollowed);
  		post.getUser().setRequested(isRequested);
  		post.getUser().setOwn(isOwn);
  		post.setLiked(liked);
  		post.setSaved(saved);
  		post.setLikeCount(post.getLikes().size());
  	}).collect(Collectors.toList());
   }
}
