package com.insta.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insta.dto.SearchDTO;
import com.insta.model.User;
import com.insta.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search")
public class SearchController {

	private final UserRepository userRepository;
	
	@GetMapping("/{searchval}")
	public List<SearchDTO> getSearchUsers(@PathVariable("searchval") String searchval)
	{
		List<User> users = userRepository.findByUsernameContainingIgnoreCase(searchval);
	return	users.stream().map((user)->{
			return SearchDTO.builder().id(user.getId())
					.username(user.getUsername())
					.userprofile(user.getProfilePicUrl())
					.build();
		}).toList();
	}
}
