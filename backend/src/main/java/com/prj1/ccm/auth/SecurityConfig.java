package com.prj1.ccm.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Convention 3: deny by default.
 *
 * <p>The allow-list below is short and is meant to stay short. Everything not named here
 * requires authentication, so a new endpoint added without a thought about permissions is
 * closed rather than open. That is the opposite of the usual accident, where a forgotten
 * annotation leaves a door ajar.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
		return http
				// No cookies are used for authentication, so there is no cookie for an
				// attacker's page to ride on, and CSRF protection has nothing to protect.
				.csrf(csrf -> csrf.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/health", "/api/auth/login").permitAll()
						.anyRequest().authenticated())
				// Return 401 rather than redirecting to a login page: this server talks JSON
				// to a single-page application, and a redirect would arrive as a confusing 200.
				.exceptionHandling(e -> e
						.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
				.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
				.build();
	}

	/**
	 * bcrypt with the default strength. Deliberately slow: an attacker holding a stolen
	 * database can only try passwords as fast as this runs.
	 */
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
