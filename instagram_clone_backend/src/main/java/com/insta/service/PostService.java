package com.insta.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
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
   
   public List<Post> getAllPosts(int page, int limit, String authHeader) {
	    User user = userService.getUserByToken(authHeader);
	    Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

	    return postRepository.findAll(pageable).stream()
	        .filter(post -> {
	            // Hide posts if account is private and not followed
	            if (post.getUser().getIsPrivate()) {
	                boolean isOwn = post.getUser().getId().equals(user.getId());
	                boolean isFollowed = followerRepository.existsByFollowingAndFollower(post.getUser(), user);

	                if (!isOwn && !isFollowed) {
	                    return false; // skip this post
	                }
	            }
	            return true; // public account or own/followed private account
	        })
	        .peek(post -> {
	            boolean liked = post.getLikes().stream()
	                .anyMatch(like -> like.getUser().getId().equals(user.getId()));
	            boolean saved = post.getSaves().stream()
	                .anyMatch(save -> save.getUser().getId().equals(user.getId()));
	            boolean isRequested = followRequestRepository.existsByRequesterAndTargetAndStatus(
	                    user, post.getUser(), FollowRequest.RequestStatus.PENDING);
	            boolean isFollowed = followerRepository.existsByFollowingAndFollower(post.getUser(), user);
	            boolean isOwn = post.getUser().getId().equals(user.getId());

	            post.getUser().setFollowed(isFollowed);
	            post.getUser().setRequested(isRequested);
	            post.getUser().setOwn(isOwn);
	            post.setLiked(liked);
	            post.setSaved(saved);
	            post.setLikeCount(post.getLikes().size());
	        })
	        .collect(Collectors.toList());
	}

   
   public String[] UploadPost(MultipartFile mediaFile, String caption ,User user) throws IOException
   {
	   // 2. Upload to Cloudinary
       Map uploadResult = cloudinary.uploader().upload(
               mediaFile.getBytes(),
               Map.of("resource_type", "auto") // handles image/video automatically
       );

       String url = uploadResult.get("secure_url").toString();
       String public_id = uploadResult.get("public_id").toString();
       String resourceType = uploadResult.get("resource_type").toString();

       // 3. Save post to DB
       Post post = new Post();
       post.setCaption(caption);
       post.setImageUrl(url);
       post.setMediaType(resourceType);
       post.setUser(user);
       post.setPostPublicId(public_id);
       post.setCreatedAt(LocalDateTime.now());

       postRepository.save(post);
       return new String[] {resourceType,url};
   }
   
   
   
   public void deletePost(Long postId) {
	 
	    Post post = postRepository.findById(postId)
	            .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

	    String publicId = post.getPostPublicId();

	    try {
	        // Delete from Cloudinary
	        Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());

	        
	        if ("ok".equals(result.get("result"))) {
	            
	            postRepository.delete(post);
	          
	        } else {
	            throw new RuntimeException("Failed to delete post");
	        }
	    } catch (Exception e) {
	        throw new RuntimeException("Error deleting post: " + e.getMessage(), e);
	    }
	}

}
