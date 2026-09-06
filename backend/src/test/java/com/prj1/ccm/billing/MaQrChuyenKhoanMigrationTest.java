package com.prj1.ccm.billing;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
class MaQrChuyenKhoanMigrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Test
    void FR_INV_10_v28UsesStableBuildingBusinessKeysInsteadOfIdsForKnownSeeds() {
        JdbcTemplate jdbcTemplate = migrateToV27();
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA");
        jdbcTemplate.update("DELETE FROM TOA_NHA WHERE ma_toa IN ('TN-A', 'TN-B')");
        insertLegacyBuilding(jdbcTemplate, "TN-A", "9704-0000-0000-0101");
        insertLegacyBuilding(jdbcTemplate, "TN-B", "9704-0000-0000-0202");

        migrateLatest();

        Map<String, Map<String, Object>> buildings = Map.of(
                "TN-A", jdbcTemplate.queryForMap("SELECT ma_ngan_hang, tk_ngan_hang FROM TOA_NHA WHERE ma_toa = 'TN-A'"),
                "TN-B", jdbcTemplate.queryForMap("SELECT ma_ngan_hang, tk_ngan_hang FROM TOA_NHA WHERE ma_toa = 'TN-B'")
        );

        assertThat(buildings.get("TN-A")).containsEntry("ma_ngan_hang", "970405")
                .containsEntry("tk_ngan_hang", "000000000101");
        assertThat(buildings.get("TN-B")).containsEntry("ma_ngan_hang", "970422")
                .containsEntry("tk_ngan_hang", "000000000202");
        assertThat(jdbcTemplate.queryForObject("SELECT id FROM TOA_NHA WHERE ma_toa = 'TN-A'", Long.class))
                .isNotEqualTo(1L);
        assertThat(jdbcTemplate.queryForObject("SELECT id FROM TOA_NHA WHERE ma_toa = 'TN-B'", Long.class))
                .isNotEqualTo(2L);
    }

    @Test
    void FR_INV_10_v28PreservesLegitimateAccountBeginningWith9704() {
        JdbcTemplate jdbcTemplate = migrateToV27();
        jdbcTemplate.update("UPDATE TOA_NHA SET tk_ngan_hang = '9704-123456789' WHERE ma_toa = 'TN-A'");

        migrateLatest();

        assertThat(jdbcTemplate.queryForObject(
                "SELECT ma_ngan_hang FROM TOA_NHA WHERE ma_toa = 'TN-A'", String.class
        )).isEqualTo("970405");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tk_ngan_hang FROM TOA_NHA WHERE ma_toa = 'TN-A'", String.class
        )).isEqualTo("9704123456789");
    }

    @Test
    void FR_INV_10_v28FailsFastForUnresolvedNonSeedBuildingWithoutCorruptingItsAccount() {
        JdbcTemplate jdbcTemplate = migrateToV27();
        insertLegacyBuilding(jdbcTemplate, "TN-C", "9704-777777777");

        assertThatThrownBy(this::migrateLatest)
                .isInstanceOf(FlywayException.class)
                .hasMessageContaining(
                        "V28 requires explicit BIN mapping for legacy buildings: TN-C"
                );

        assertThat(jdbcTemplate.queryForObject(
                "SELECT tk_ngan_hang FROM TOA_NHA WHERE ma_toa = 'TN-C'", String.class
        )).isEqualTo("9704-777777777");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'toa_nha'
                          AND column_name = 'ma_ngan_hang'
                        """,
                Integer.class
        )).isZero();
    }

    private JdbcTemplate migrateToV27() {
        Flyway flyway = Flyway.configure()
                .cleanDisabled(false)
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .target("27")
                .load();
        flyway.clean();
        flyway.migrate();
        return jdbcTemplate();
    }

    private void migrateLatest() {
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load()
                .migrate();
    }

    private void insertLegacyBuilding(JdbcTemplate jdbcTemplate, String maToa, String taiKhoan) {
        jdbcTemplate.update(
                """
                        INSERT INTO TOA_NHA (
                            ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt,
                            tk_ngan_hang, nguong_that_thoat
                        ) VALUES (?, ?, ?, 3, 25, 7, ?, 100.00)
                        """,
                maToa,
                "Toà " + maToa,
                "Địa chỉ " + maToa,
                taiKhoan
        );
    }

    private JdbcTemplate jdbcTemplate() {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(POSTGRES.getJdbcUrl());
        dataSource.setUsername(POSTGRES.getUsername());
        dataSource.setPassword(POSTGRES.getPassword());
        return new JdbcTemplate(dataSource);
    }
}
