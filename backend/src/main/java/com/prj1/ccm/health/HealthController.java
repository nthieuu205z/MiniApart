package com.prj1.ccm.health;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Reports application readiness only after a real database query succeeds.
     * This infrastructure probe supports NFR-REL-03 and is intentionally not a
     * business endpoint mapped to an FR requirement.
     *
     * @return an operational status for the application and its database
     */
    @GetMapping
    public ResponseEntity<HealthResponse> getHealth() {
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (Integer.valueOf(1).equals(result)) {
                return ResponseEntity.ok(new HealthResponse("UP", "UP"));
            }
        } catch (DataAccessException ignored) {
            // Fall through to the unavailable response below.
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new HealthResponse("DOWN", "DOWN"));
    }

    public record HealthResponse(String status, String database) {
    }
}
