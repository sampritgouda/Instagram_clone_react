package com.insta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Primary;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@SpringBootApplication
@ComponentScan(basePackages = "com.insta")
@EnableAsync
public class InstagramCloneApplication {

	public static void main(String[] args) {
		// Ensure SNI is enabled for SSL connections on Java 21 / cloud environments
		System.setProperty("jsse.enableSNIExtension", "true");
		SpringApplication.run(InstagramCloneApplication.class, args);
	}

	@Bean
	@Primary
	public TaskExecutor taskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(5);
		executor.setMaxPoolSize(10);
		executor.setQueueCapacity(25);
		executor.setThreadNamePrefix("WebPushExecutor-");
		executor.initialize();
		return executor;
	}

}

