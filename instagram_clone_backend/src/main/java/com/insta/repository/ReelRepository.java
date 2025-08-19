package com.insta.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.Reel;
import com.insta.model.User;

@Repository
public interface ReelRepository extends JpaRepository<Reel, Long>{

	List<Reel> findByUser(User reeluser);

}
