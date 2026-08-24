package com.prj1.ccm.shared.health;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The tracer bullet: HTTP request enters the web layer, reaches a real PostgreSQL,
 * and comes back. A green run means all three tiers are connected.
 *
 * <p>Runs against a throwaway PostgreSQL container rather than an embedded database,
 * because the production database is PostgreSQL and testing against a different engine
 * would prove nothing about the one that actually runs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class HealthControllerIT {

	@Container
	@ServiceConnection
	static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

	@Autowired
	MockMvc mockMvc;

	@Test
	@DisplayName("health endpoint reaches a real database, not a hardcoded constant")
	void healthEndpointReachesTheDatabase() throws Exception {
		mockMvc.perform(get("/api/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.trangThai").value("SAN_SANG"))
				// Only a live connection can report the server banner...
				.andExpect(jsonPath("$.phienBanCoSoDuLieu").value(org.hamcrest.Matchers.startsWith("PostgreSQL")))
				// ...and only a live Flyway run creates the history table this counts.
				.andExpect(jsonPath("$.soMigrationDaChay").isNumber());
	}
}
