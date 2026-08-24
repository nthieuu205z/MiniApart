package com.prj1.ccm.shared.health;

import java.time.Instant;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tracer-bullet endpoint proving the full stack is wired: browser to API to database.
 *
 * <p>Infrastructure, not a functional requirement. It deliberately performs real queries
 * instead of returning a constant, so a green response means the database connection
 * genuinely works rather than merely that the web layer started.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

	private static final String FLYWAY_HISTORY_TABLE = "public.flyway_schema_history";

	private final JdbcTemplate jdbcTemplate;

	HealthController(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@GetMapping
	Map<String, Object> health() {
		return Map.of(
				"trangThai", "SAN_SANG",
				"phienBanCoSoDuLieu", databaseVersion(),
				"soMigrationDaChay", migrationsApplied(),
				"thoiDiem", Instant.now().toString());
	}

	/** PostgreSQL's version() is a long banner; the first two words identify it well enough. */
	private String databaseVersion() {
		String banner = jdbcTemplate.queryForObject("select version()", String.class);
		if (banner == null) {
			return "khong xac dinh";
		}
		String[] parts = banner.split(" ");
		return parts.length >= 2 ? parts[0] + " " + parts[1] : banner;
	}

	/**
	 * Counts applied migrations. Reports zero rather than failing while the project has no
	 * migrations yet: Flyway only creates its history table once it has something to run,
	 * and an empty schema is a healthy state, not a broken one.
	 */
	private long migrationsApplied() {
		Boolean historyExists = jdbcTemplate.queryForObject(
				"select to_regclass(?) is not null", Boolean.class, FLYWAY_HISTORY_TABLE);
		if (!Boolean.TRUE.equals(historyExists)) {
			return 0L;
		}
		Long applied = jdbcTemplate.queryForObject(
				"select count(*) from flyway_schema_history where success", Long.class);
		return applied == null ? 0L : applied;
	}
}
