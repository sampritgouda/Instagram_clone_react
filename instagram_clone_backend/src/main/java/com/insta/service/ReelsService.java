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
import com.insta.model.FollowRequest;
import com.insta.model.Reel;
import com.insta.model.User;
import com.insta.repository.FollowRequestRepository;
import com.insta.repository.FollowerRepository;
import com.insta.repository.ReelRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReelsService {
	
	private final Cloudinary cloudinary;
	private final ReelRepository reelRepository;
	private final FollowRequestRepository followRequestRepository;
	private final FollowerRepository followerRepository;

	public List<Reel> getAllReels(int page, int limit, User user) {
	    Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

	    return reelRepository.findAll(pageable).stream()
	        .filter(reel -> {
	            // if account is private and not followed -> exclude
	            if (reel.getUser().getIsPrivate()) {
	                boolean followed = followerRepository.existsByFollowingAndFollower(reel.getUser(), user);
	                if (!followed && !reel.getUser().getId().equals(user.getId())) {
	                    return false; // skip this reel
	                }
	            }
	            return true;
	        })
	        .peek(reel -> {
	            boolean liked = reel.getLikes().stream()
	                .anyMatch(like -> like.getUser().getId().equals(user.getId()));
	            boolean saved = reel.getSaves().stream()
	                .anyMatch(save -> save.getUser().getId().equals(user.getId()));
	            boolean followed = followerRepository.existsByFollowingAndFollower(reel.getUser(), user);
	            boolean requested = followRequestRepository.existsByRequesterAndTargetAndStatus(
	                    user, reel.getUser(), FollowRequest.RequestStatus.PENDING);
	            boolean own = reel.getUser().getId().equals(user.getId());

	            reel.getUser().setFollowed(followed);
	            reel.getUser().setRequested(requested);
	            reel.getUser().setOwn(own);
	            reel.setLiked(liked);
	            reel.setLikeCount(reel.getLikes().size());
	            reel.setSaved(saved);
	            reel.setSaveCount(reel.getSaves().size());
	        })
	        .collect(Collectors.toList());
	}

	
	
	public String[] uploadreels(MultipartFile mediaFile, String caption ,User user) throws IOException
	{

       
        Map uploadResult = cloudinary.uploader().upload(
                mediaFile.getBytes(),
                Map.of("resource_type", "video") // handles image/video automatically
        );

        String url = uploadResult.get("secure_url").toString();
        String public_id = uploadResult.get("public_id").toString();
        String resourceType = uploadResult.get("resource_type").toString();

       Reel reel = new Reel();
       reel.setCaption(caption);
       reel.setReelPublicId(public_id);
       reel.setCreatedAt(LocalDateTime.now());
       reel.setVideoUrl(url);
       reel.setUser(user);
       
       reelRepository.save(reel);
       return new String[] {resourceType,url};
	}
}
