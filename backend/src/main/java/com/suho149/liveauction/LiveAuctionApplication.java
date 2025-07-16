package com.suho149.liveauction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class LiveAuctionApplication {

	public static void main(String[] args) {
		SpringApplication.run(LiveAuctionApplication.class, args);
	}

}
