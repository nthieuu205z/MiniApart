package com.prj1.ccm.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class AuthClockConfig {

    @Bean
    public Clock authClock() {
        return Clock.system(ZoneId.of("Asia/Ho_Chi_Minh"));
    }
}
