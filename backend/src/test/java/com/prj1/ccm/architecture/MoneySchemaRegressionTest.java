package com.prj1.ccm.architecture;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
class MoneySchemaRegressionTest {

    private static final Map<String, String> NON_MONEY_COLUMN_EXCLUSIONS = Map.ofEntries(
            Map.entry("phong.dien_tich", "room area is a physical measurement, not money"),
            Map.entry("bang_gia_bac_thang.ty_le", "tier percentage is a rate, not money"),
            Map.entry("nguoi_dung.lan_sai_dau_tien", "login-failure timestamp ends with tien but is not money"),
            Map.entry("theo_doi_dang_nhap.lan_sai_dau_tien", "login-failure timestamp ends with tien but is not money"),
            Map.entry("nhat_ky_thao_tac.gia_tri_truoc", "audit before-value is text, not a price"),
            Map.entry("nhat_ky_thao_tac.gia_tri_sau", "audit after-value is text, not a price")
    );

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Test
    void FR_INV_02_quyUoc01_moiCotTienTheoTenQuyUocDeuLaNumeric15_2SauFlyway() {
        JdbcTemplate jdbcTemplate = migrateLatestAndCreateJdbcTemplate();

        assertMoneyColumnsComplyWithConvention(jdbcTemplate);
    }

    @Test
    void FR_INV_02_quyUoc01_tuChungMinhCotTienSaiKieuBiBaoDungTenBangVaCot() {
        JdbcTemplate jdbcTemplate = migrateLatestAndCreateJdbcTemplate();
        jdbcTemplate.execute("CREATE TABLE TEST_SAI_TIEN (so_tien DOUBLE PRECISION)");

        assertThatThrownBy(() -> assertMoneyColumnsComplyWithConvention(jdbcTemplate))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining("TEST_SAI_TIEN.so_tien")
                .hasMessageContaining("double precision");

        jdbcTemplate.execute("DROP TABLE TEST_SAI_TIEN");
    }

    private JdbcTemplate migrateLatestAndCreateJdbcTemplate() {
        Flyway.configure()
                .cleanDisabled(false)
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load()
                .clean();
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load()
                .migrate();

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setUrl(POSTGRES.getJdbcUrl());
        dataSource.setUsername(POSTGRES.getUsername());
        dataSource.setPassword(POSTGRES.getPassword());
        return new JdbcTemplate(dataSource);
    }

    private void assertMoneyColumnsComplyWithConvention(JdbcTemplate jdbcTemplate) {
        List<MoneyColumn> columns = jdbcTemplate.query(
                """
                        SELECT table_name, column_name, data_type, numeric_precision, numeric_scale
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND (
                              column_name LIKE '%\\_tien' ESCAPE '\\'
                              OR column_name LIKE 'tien\\_%' ESCAPE '\\'
                              OR column_name IN ('so_tien', 'don_gia', 'thanh_tien', 'da_thu', 'tong_tien')
                              OR column_name LIKE 'don\\_gia\\_%' ESCAPE '\\'
                              OR column_name LIKE 'gia\\_%' ESCAPE '\\'
                              OR column_name LIKE 'nguong\\_%' ESCAPE '\\'
                              OR column_name IN ('dien_tich', 'ty_le')
                          )
                        ORDER BY table_name, column_name
                        """,
                (resultSet, rowNum) -> new MoneyColumn(
                        resultSet.getString("table_name"),
                        resultSet.getString("column_name"),
                        resultSet.getString("data_type"),
                        (Integer) resultSet.getObject("numeric_precision"),
                        (Integer) resultSet.getObject("numeric_scale")
                )
        ).stream()
                .filter(column -> !NON_MONEY_COLUMN_EXCLUSIONS.containsKey(column.key()))
                .toList();

        List<String> invalidColumns = columns.stream()
                .filter(column -> !"numeric".equals(column.dataType())
                        || !Integer.valueOf(15).equals(column.numericPrecision())
                        || !Integer.valueOf(2).equals(column.numericScale()))
                .map(MoneyColumn::describe)
                .toList();

        if (!invalidColumns.isEmpty()) {
            throw new AssertionError(
                    "Quy uoc 1 FR-INV-02 yeu cau cot tien NUMERIC(15,2), nhung sai: " + invalidColumns
            );
        }

        assertThat(columns).isNotEmpty();
    }

    private record MoneyColumn(
            String tableName,
            String columnName,
            String dataType,
            Integer numericPrecision,
            Integer numericScale
    ) {
        private String key() {
            return tableName + "." + columnName;
        }

        private String describe() {
            return "%s.%s (%s, precision=%s, scale=%s)".formatted(
                    tableName.toUpperCase(Locale.ROOT),
                    columnName,
                    dataType,
                    numericPrecision,
                    numericScale
            );
        }
    }
}
