package com.insta.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insta.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{

	Optional<User> findByEmail(String email);

	Optional<User> findByUsername(String name);

}
