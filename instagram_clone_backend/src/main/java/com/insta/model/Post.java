package com.insta.model;



import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "posts")
public class Post {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties("posts")
    private User user;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Like> likes;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Save> saves;
    @Transient
    private boolean isLiked;
    
    @Transient
    private int likeCount;
    
    @Transient
    private boolean isSaved;
    

     private String imageUrl;
    private String caption;
    private LocalDateTime createdAt;

    private String mediaType;
}
