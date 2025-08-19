package com.insta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.insta")

public class InstagramCloneApplication {

	public static void main(String[] args) {
		SpringApplication.run(InstagramCloneApplication.class, args);
	}

}
