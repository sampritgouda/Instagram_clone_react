package com.insta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "story_views")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class StoryView {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
    @ManyToOne(fetch = FetchType.LAZY) // Many likes belong to one user
    @JoinColumn(name = "user_id", nullable = false)
   
	private User viewer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "story_id", nullable=false)
    @JsonIgnore
    private Story story;
	
}
