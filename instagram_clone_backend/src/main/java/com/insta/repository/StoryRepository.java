package com.insta.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.Story;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

}
