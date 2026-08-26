package com.prj1.ccm.auth;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

@Testcontainers
class AuthMigrationRegressionTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Test
    void FR_AUT_02_existingNguoiDungLockRemainsActiveAfterTrackerMigrationBackfill() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-27T08:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        Instant lanSaiDauTien = clock.instant().minus(Duration.ofMinutes(5));
        Instant khoaDen = clock.instant().plus(Duration.ofMinutes(10));
        String runtimePassword = "runtime-" + UUID.randomUUID();

        Flyway migrateToV3 = Flyway.configure()
                .cleanDisabled(false)
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .target("3")
                .load();
        migrateToV3.clean();
        migrateToV3.migrate();

        JdbcTemplate jdbcTemplate = taoJdbcTemplate();
        PasswordHasher passwordHasher = new PasswordHasher();
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET mat_khau_hash = ?,
                            so_lan_sai = ?,
                            lan_sai_dau_tien = ?,
                            khoa_den = ?
                        WHERE id = ?
                        """,
                passwordHasher.hash(runtimePassword),
                5,
                Timestamp.from(lanSaiDauTien),
                Timestamp.from(khoaDen),
                3L
        );

        Flyway migrateLatest = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();
        migrateLatest.migrate();

        Timestamp trackerKhoaDen = jdbcTemplate.queryForObject(
                "SELECT khoa_den FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?",
                Timestamp.class,
                "0900000003"
        );

        assertThat(trackerKhoaDen).isNotNull();
        assertThat(trackerKhoaDen.toInstant()).isEqualTo(khoaDen);

        XacThucService xacThucService = new XacThucService(
                new NguoiDungRepository(jdbcTemplate),
                passwordHasher,
                mock(JwtTokenService.class),
                clock
        );

        assertThatThrownBy(() -> xacThucService.dangNhap(new DangNhapRequest("0900000003", runtimePassword)))
                .isInstanceOf(DangNhapTamKhoaException.class)
                .hasMessageStartingWith("Đăng nhập tạm thời bị khoá. Vui lòng thử lại sau ");
    }

    private JdbcTemplate taoJdbcTemplate() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(POSTGRES.getJdbcUrl());
        dataSource.setUsername(POSTGRES.getUsername());
        dataSource.setPassword(POSTGRES.getPassword());
        return new JdbcTemplate(dataSource);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zoneId;

        private MutableClock(Instant instant, ZoneId zoneId) {
            this.instant = instant;
            this.zoneId = zoneId;
        }

        @Override
        public ZoneId getZone() {
            return zoneId;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
