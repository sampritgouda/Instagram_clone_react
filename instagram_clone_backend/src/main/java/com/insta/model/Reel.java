package com.insta.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "reels")
public class Reel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // Many reels belong to one user
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"reels","comments"})
   
    private User user;

    private String videoUrl; // Cloudinary video URL
    private String caption;
    private LocalDateTime createdAt;

    private String reelPublicId;
    // Likes for this reel
    @OneToMany(mappedBy = "reel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Like> likes;
    
    @OneToMany(mappedBy = "reel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Save> saves;

    // Comments for this reel
    @OneToMany(mappedBy = "reel", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Comment> comments;
    
    @Transient
    private boolean isLiked;
    
    @Transient
    private int saveCount;
    
    @Transient
    private int likeCount;
    
    @Transient
    private boolean isSaved;
}
