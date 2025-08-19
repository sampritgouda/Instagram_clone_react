package com.insta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.insta.model.StoryView;

@Repository
public interface StoryViewRepository extends JpaRepository<StoryView, Long>{

    @Query("SELECT sv.story.id FROM StoryView sv WHERE sv.viewer.id = :viewerId AND sv.story.user.id = :ownerId")
    List<Long> findViewedStoryIds(@Param("viewerId") Long viewerId, @Param("ownerId") Long ownerId);

}
