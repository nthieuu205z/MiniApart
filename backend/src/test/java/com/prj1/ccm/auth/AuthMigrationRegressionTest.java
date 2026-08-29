package com.prj1.ccm.auth;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
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
    void FR_AUT_06_CR_001_nguoiDungNguoiThueIdLaKhoaNgoaiDuyNhatVaChoPhepRong() {
        Flyway flyway = Flyway.configure()
                .cleanDisabled(false)
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();
        flyway.clean();
        flyway.migrate();

        JdbcTemplate jdbcTemplate = taoJdbcTemplate();
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den, nguoi_thue_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                "Thợ không gắn hồ sơ thuê",
                "0901777001",
                "pbkdf2$test",
                "THO",
                "HOAT_DONG",
                0,
                0,
                null,
                null,
                null
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES ('Người thuê ràng buộc', DATE '1995-01-01', '0901777002', '001234567899', 'Hà Nội', 'DANG_THUE')
                        """
        );
        Long nguoiThueId = jdbcTemplate.queryForObject(
                "SELECT id FROM NGUOI_THUE WHERE so_giay_to = '001234567899'",
                Long.class
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den, nguoi_thue_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                "Người thuê có liên kết",
                "0901777003",
                "pbkdf2$test",
                "NGUOI_THUE",
                "HOAT_DONG",
                0,
                0,
                null,
                null,
                nguoiThueId
        );

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den, nguoi_thue_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                "Người thuê trùng liên kết",
                "0901777004",
                "pbkdf2$test",
                "NGUOI_THUE",
                "HOAT_DONG",
                0,
                0,
                null,
                null,
                nguoiThueId
        )).isInstanceOf(DataIntegrityViolationException.class);

        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den, nguoi_thue_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                "Người thuê sai liên kết",
                "0901777005",
                "pbkdf2$test",
                "NGUOI_THUE",
                "HOAT_DONG",
                0,
                0,
                null,
                null,
                999999L
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void FR_AUT_02_existingNguoiDungLockRemainsActiveAfterTrackerMigrationBackfill() {
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
                            lan_sai_dau_tien = CURRENT_TIMESTAMP - INTERVAL '5 minutes',
                            khoa_den = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
                        WHERE id = ?
                        """,
                passwordHasher.hash(runtimePassword),
                5,
                3L
        );
        Timestamp legacyLanSaiDauTien = jdbcTemplate.queryForObject(
                "SELECT lan_sai_dau_tien FROM NGUOI_DUNG WHERE id = ?",
                Timestamp.class,
                3L
        );
        Timestamp legacyKhoaDen = jdbcTemplate.queryForObject(
                "SELECT khoa_den FROM NGUOI_DUNG WHERE id = ?",
                Timestamp.class,
                3L
        );
        MutableClock clock = new MutableClock(legacyKhoaDen.toInstant().minus(Duration.ofMinutes(1)), ZoneId.of("Asia/Ho_Chi_Minh"));

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
        assertThat(trackerKhoaDen.toInstant()).isEqualTo(legacyKhoaDen.toInstant());
        Timestamp trackerLanSaiDauTien = jdbcTemplate.queryForObject(
                "SELECT lan_sai_dau_tien FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?",
                Timestamp.class,
                "0900000003"
        );
        Integer trackerSoLanSai = jdbcTemplate.queryForObject(
                "SELECT so_lan_sai FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?",
                Integer.class,
                "0900000003"
        );
        assertThat(trackerLanSaiDauTien).isEqualTo(legacyLanSaiDauTien);
        assertThat(trackerSoLanSai).isEqualTo(5);

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
