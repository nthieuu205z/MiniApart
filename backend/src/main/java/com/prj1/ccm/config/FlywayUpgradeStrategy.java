package com.prj1.ccm.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Cơ chế nâng cấp Flyway tự động cho 4 lịch sử cơ sở dữ liệu thực tế:
 * 1. Database trước V49 có dữ liệu thật: chạy canonical migrations (không seed demo, không crash unique).
 * 2. Database đã áp dụng bản 046d45a: tự động chọn location tương thích 046d45a, checksum khớp 100%, áp dụng V56.
 * 3. Database đã áp dụng bản d2e3d69: tự động chọn location tương thích d2e3d69, checksum khớp 100%, áp dụng V56.
 * 4. Database tạo mới: chạy canonical migrations sạch sẽ, an toàn.
 *
 * Tuyệt đối không can thiệp flyway_schema_history, không tắt validation, không dùng repair che giấu lỗi.
 */
@Component
public class FlywayUpgradeStrategy implements FlywayMigrationStrategy {

    private static final Logger log = LoggerFactory.getLogger(FlywayUpgradeStrategy.class);

    public static final int CHECKSUM_V49_046D45A = -2021227304;
    public static final int CHECKSUM_V49_046D45A_ALT = -1020674094;
    public static final int CHECKSUM_V49_D2E3D69 = -658510974;
    public static final int CHECKSUM_V49_D2E3D69_ALT = 1635338167;

    public static boolean is046d45a(Integer checksum) {
        return checksum != null && (checksum == CHECKSUM_V49_046D45A || checksum == CHECKSUM_V49_046D45A_ALT);
    }

    public static boolean isD2e3d69(Integer checksum) {
        return checksum != null && (checksum == CHECKSUM_V49_D2E3D69 || checksum == CHECKSUM_V49_D2E3D69_ALT);
    }

    @Override
    public void migrate(Flyway flyway) {
        DataSource dataSource = flyway.getConfiguration().getDataSource();
        Integer installedChecksumV49 = docChecksumV49(dataSource);

        Flyway effectiveFlyway;
        if (is046d45a(installedChecksumV49)) {
            log.info("Phát hiện database đã áp dụng migration V49 mốc 046d45a (checksum {}). Kích hoạt bộ migration tương thích 046d45a...", installedChecksumV49);
            effectiveFlyway = Flyway.configure()
                    .configuration(flyway.getConfiguration())
                    .locations("classpath:db/migration_common", "classpath:db/migration_variants/v046d45a")
                    .load();
        } else if (isD2e3d69(installedChecksumV49)) {
            log.info("Phát hiện database đã áp dụng migration V49 mốc d2e3d69 (checksum {}). Kích hoạt bộ migration tương thích d2e3d69...", installedChecksumV49);
            effectiveFlyway = Flyway.configure()
                    .configuration(flyway.getConfiguration())
                    .locations("classpath:db/migration_common", "classpath:db/migration_variants/vd2e3d69")
                    .load();
        } else {
            log.info("Database tạo mới hoặc nâng cấp từ pre-V49. Áp dụng bộ migration canonical chuẩn...");
            effectiveFlyway = Flyway.configure()
                    .configuration(flyway.getConfiguration())
                    .locations("classpath:db/migration")
                    .load();
        }

        effectiveFlyway.migrate();
        log.info("Flyway migration hoàn tất thành công.");
    }

    public static Integer docChecksumV49(DataSource dataSource) {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            ResultSet rsTable = stmt.executeQuery("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_schema = 'public' AND table_name = 'flyway_schema_history'
                    )
                    """);
            if (!rsTable.next() || !rsTable.getBoolean(1)) {
                return null;
            }

            ResultSet rsChecksum = stmt.executeQuery("""
                    SELECT checksum FROM flyway_schema_history WHERE version = '49'
                    """);
            if (rsChecksum.next()) {
                return (Integer) rsChecksum.getObject("checksum");
            }
            return null;
        } catch (Exception e) {
            log.warn("Không thể đọc checksum V49 từ flyway_schema_history: {}", e.getMessage());
            return null;
        }
    }
}
