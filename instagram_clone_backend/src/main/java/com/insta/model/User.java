package com.insta.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class User {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private Boolean isPrivate;

    private String profilePicUrl; 
    private String bio;
    private String profilePicPublicId;
    
    private String gender;
    @Transient
    private boolean isOwn;
    
    @Transient
    private boolean isFollowed;
    
    @Transient
    private boolean requested;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // Prevent back-reference loop
    private List<Reel> reels;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
   
    private List<Like> likes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("user")
    private List<Comment> comments;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("user-posts")
    @JsonIgnoreProperties("user")
    private List<Post> posts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("user-stories")
    @JsonIgnoreProperties("user")
    private List<Story> stories;
    
    @OneToMany(mappedBy = "following", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Follower> followers;

    @OneToMany(mappedBy = "target" ,cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<FollowRequest> followrequests;
    @OneToMany(mappedBy = "requester" ,cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<FollowRequest> requestedfollows;
    
    @OneToMany(mappedBy = "user" ,cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("user")
    private List<Save> saves;
    
    @OneToMany(mappedBy = "follower", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Follower> following;

}
