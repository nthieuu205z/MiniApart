package com.prj1.ccm.config;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

/**
 * Cơ chế nâng cấp Flyway tự động, an toàn và bảo toàn dữ liệu lịch sử:
 * 1. Không nhân bản mã migration (Single Source of Truth tại classpath:db/migration).
 * 2. Xác thực phân biệt giữa migration ĐÃ ÁP DỤNG và migration CÒN PENDING:
 *    - Đã áp dụng: validate khớp 100% bằng đúng artifact lịch sử gốc từ Git release.
 *    - Còn pending: bắt buộc thực thi migration canonical chuẩn (Pure DDL, không chạy seed legacy).
 * 3. Hỗ trợ đầy đủ 4 lịch sử thực tế:
 *    - Database mới (Clean DB): chạy canonical sạch sẽ.
 *    - Database Pre-V49 có dữ liệu thực: áp dụng canonical V49 (không clash unique, không gán giá sai).
 *    - Database đã áp dụng mốc 046d45a: validate thành công và áp dụng các migration tiếp theo.
 *    - Database đã áp dụng mốc d2e3d69: validate thành công và chuẩn hoá qua V56.
 *    - Database nâng cấp dở (ví dụ áp dụng V49 nhưng chưa đến V55): V55 pending chạy bản canonical an toàn.
 * 4. Checksum không hỗ trợ sẽ dừng ngay lập tức với thông báo lỗi rõ ràng.
 */
@Component
public class FlywayUpgradeStrategy implements FlywayMigrationStrategy {

    private static final Logger log = LoggerFactory.getLogger(FlywayUpgradeStrategy.class);

    // Checksum tính theo chuẩn CRC32 của Flyway từ các artifact Git gốc
    public static final int CHECKSUM_V49_CANONICAL = 1780494066;
    public static final int CHECKSUM_V55_CANONICAL = 1832145289;

    public static final int CHECKSUM_V49_046D45A = -1020674094;
    public static final int CHECKSUM_V55_046D45A = -1007063486;

    public static final int CHECKSUM_V49_D2E3D69 = 676094527;
    public static final int CHECKSUM_V55_D2E3D69 = 52954075;

    public static final int CHECKSUM_V58_DRAFT = -1463358195;

    public enum MigrationVariant {
        CANONICAL,
        V046D45A,
        VD2E3D69
    }

    @Override
    public void migrate(Flyway flyway) {
        Configuration config = flyway.getConfiguration();
        DataSource dataSource = config.getDataSource();

        Map<String, Integer> installedChecksums = docInstalledMigrations(dataSource, config);

        Integer checksumV49 = installedChecksums.get("49");
        Integer checksumV55 = installedChecksums.get("55");
        Integer checksumV58 = installedChecksums.get("58");

        MigrationVariant variantV49 = determineVariant("49", checksumV49);
        MigrationVariant variantV55 = determineVariant("55", checksumV55);

        // Nếu database mới hoặc các migration đã áp dụng đều là canonical: chạy trực tiếp từ classpath:db/migration
        boolean needVariantForV49 = (checksumV49 != null && variantV49 != MigrationVariant.CANONICAL);
        boolean needVariantForV55 = (checksumV55 != null && variantV55 != MigrationVariant.CANONICAL);
        boolean needVariantForV58 = (checksumV58 != null && checksumV58 == CHECKSUM_V58_DRAFT);

        if (!needVariantForV49 && !needVariantForV55 && !needVariantForV58) {
            log.info("Database chạy canonical migrations trực tiếp từ classpath:db/migration.");
            Flyway effectiveFlyway = Flyway.configure()
                    .configuration(flyway.getConfiguration())
                    .locations("classpath:db/migration")
                    .load();
            effectiveFlyway.migrate();
            return;
        }

        // Trường hợp database đã có migration legacy: chuẩn bị migration set động
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("miniapart-flyway-upgrade-");
            log.info("Tạo migration set động tương thích lịch sử tại: {}", tempDir);

            ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] canonicalResources = resolver.getResources("classpath*:db/migration/*.sql");

            for (Resource res : canonicalResources) {
                String filename = res.getFilename();
                if (filename == null) continue;
                Path dest = tempDir.resolve(filename);
                try (InputStream in = res.getInputStream()) {
                    Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
                }
            }

            // Ghi đè V49 bằng đúng artifact lịch sử ĐÃ ÁP DỤNG để validate
            if (needVariantForV49) {
                String variantPath = variantV49 == MigrationVariant.V046D45A
                        ? "classpath:db/migration_variants/v046d45a/V49__public_lead_and_viewing_appointments.sql"
                        : "classpath:db/migration_variants/vd2e3d69/V49__public_lead_and_viewing_appointments.sql";
                copyVariant(resolver, variantPath, tempDir, "V49__public_lead_and_viewing_appointments.sql");
                log.info("Áp dụng variant lịch sử {} cho V49 (checksum: {})", variantV49, checksumV49);
            }

            // Ghi đè V55 bằng đúng artifact lịch sử ĐÃ ÁP DỤNG để validate
            // Chú ý: Nếu V55 CÒN PENDING (checksumV55 == null), giữ nguyên V55 canonical, tuyệt đối không chép variant legacy
            if (needVariantForV55) {
                String variantPath = variantV55 == MigrationVariant.V046D45A
                        ? "classpath:db/migration_variants/v046d45a/V55__room_assets_and_handover.sql"
                        : "classpath:db/migration_variants/vd2e3d69/V55__room_assets_and_handover.sql";
                copyVariant(resolver, variantPath, tempDir, "V55__room_assets_and_handover.sql");
                log.info("Áp dụng variant lịch sử {} cho V55 (checksum: {})", variantV55, checksumV55);
            }

            if (needVariantForV58) {
                copyVariant(resolver, "classpath:db/migration_variants/draft_v58/V58__contract_dossier_snapshot_and_templates.sql", tempDir, "V58__contract_dossier_snapshot_and_templates.sql");
                log.info("Áp dụng variant lịch sử draft cho V58 (checksum: {})", checksumV58);
            }

            String fileLocation = "filesystem:" + tempDir.toAbsolutePath().toString().replace('\\', '/');
            Flyway effectiveFlyway = Flyway.configure()
                    .configuration(flyway.getConfiguration())
                    .locations(fileLocation)
                    .load();

            effectiveFlyway.migrate();
            log.info("Flyway upgrade migration hoàn tất thành công.");
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khởi tạo Flyway migration set động: " + e.getMessage(), e);
        } finally {
            if (tempDir != null && Files.exists(tempDir)) {
                try {
                    Files.walk(tempDir)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                } catch (Exception ignored) {
                }
            }
        }
    }

    private void copyVariant(ResourcePatternResolver resolver, String sourceClasspath, Path tempDir, String targetFilename) throws IOException {
        Resource res = resolver.getResource(sourceClasspath);
        if (!res.exists()) {
            throw new IllegalStateException("Không tìm thấy migration variant: " + sourceClasspath);
        }
        Path target = tempDir.resolve(targetFilename);
        try (InputStream in = res.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    public static MigrationVariant determineVariant(String version, Integer checksum) {
        if (checksum == null) {
            return MigrationVariant.CANONICAL;
        }
        if ("49".equals(version)) {
            if (checksum == CHECKSUM_V49_CANONICAL) return MigrationVariant.CANONICAL;
            if (checksum == CHECKSUM_V49_046D45A) return MigrationVariant.V046D45A;
            if (checksum == CHECKSUM_V49_D2E3D69) return MigrationVariant.VD2E3D69;
            throw new IllegalStateException(String.format("Không hỗ trợ nâng cấp database có migration V49 với checksum không xác định: %d", checksum));
        }
        if ("55".equals(version)) {
            if (checksum == CHECKSUM_V55_CANONICAL) return MigrationVariant.CANONICAL;
            if (checksum == CHECKSUM_V55_046D45A) return MigrationVariant.V046D45A;
            if (checksum == CHECKSUM_V55_D2E3D69) return MigrationVariant.VD2E3D69;
            throw new IllegalStateException(String.format("Không hỗ trợ nâng cấp database có migration V55 với checksum không xác định: %d", checksum));
        }
        return MigrationVariant.CANONICAL;
    }

    public static String resolveTable(Configuration config) {
        if (config != null) {
            String table = config.getTable();
            if (table != null && !table.isBlank()) {
                return table.trim();
            }
        }
        return "flyway_schema_history";
    }

    public static String resolveSchema(Connection conn, Configuration config) throws SQLException {
        if (config != null) {
            String defaultSchema = config.getDefaultSchema();
            if (defaultSchema != null && !defaultSchema.isBlank()) {
                return defaultSchema.trim();
            }
            String[] schemas = config.getSchemas();
            if (schemas != null && schemas.length > 0 && schemas[0] != null && !schemas[0].isBlank()) {
                return schemas[0].trim();
            }
        }
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT CURRENT_SCHEMA")) {
            if (rs.next()) {
                String current = rs.getString(1);
                if (current != null && !current.isBlank()) {
                    return current.trim();
                }
            }
        }
        return "public";
    }

    public static String escapeIdentifier(String identifier) {
        return identifier.replace("\"", "\"\"");
    }

    public static Map<String, Integer> docInstalledMigrations(DataSource dataSource, Configuration config) {
        Map<String, Integer> result = new HashMap<>();
        String table = resolveTable(config);

        try (Connection conn = dataSource.getConnection()) {
            String schema = resolveSchema(conn, config);

            // 1. Kiểm tra bảng history có tồn tại trong schema chỉ định không
            boolean tableExists = false;
            try (PreparedStatement checkStmt = conn.prepareStatement(
                    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE (table_schema = ? OR table_schema = LOWER(?)) AND (table_name = ? OR table_name = LOWER(?)))"
            )) {
                checkStmt.setString(1, schema);
                checkStmt.setString(2, schema);
                checkStmt.setString(3, table);
                checkStmt.setString(4, table);
                try (ResultSet rs = checkStmt.executeQuery()) {
                    if (rs.next()) {
                        tableExists = rs.getBoolean(1);
                    }
                }
            }

            // Nếu bảng chưa tồn tại (ví dụ database mới): trả về map rỗng (chạy canonical)
            if (!tableExists) {
                log.info("Bảng lịch sử Flyway \"{}\".\"{}\" chưa tồn tại (database mới).", schema, table);
                return result;
            }

            // 2. Bảng ĐÃ tồn tại: đọc lịch sử migration đã cài đặt
            // Quote identifier chuẩn: "schema"."table"
            String sql = String.format("SELECT version, checksum FROM \"%s\".\"%s\" WHERE version IS NOT NULL",
                    escapeIdentifier(schema), escapeIdentifier(table));

            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(sql)) {
                while (rs.next()) {
                    String version = rs.getString("version");
                    int checksum = rs.getInt("checksum");
                    boolean wasNull = rs.wasNull();
                    result.put(version, wasNull ? null : checksum);
                }
            } catch (SQLException e) {
                // Bảng tồn tại nhưng đọc lỗi -> ném ngoại lệ rõ ràng, không che giấu lỗi thành database mới
                log.error("Lỗi khi đọc dữ liệu từ bảng lịch sử Flyway \"{}\".\"{}\": {}", schema, table, e.getMessage());
                throw new IllegalStateException(String.format("Không thể đọc dữ liệu từ bảng lịch sử Flyway \"%s\".\"%s\": %s",
                        schema, table, e.getMessage()), e);
            }
        } catch (SQLException e) {
            log.error("Lỗi kết nối cơ sở dữ liệu khi kiểm tra Flyway history: {}", e.getMessage());
            throw new IllegalStateException("Lỗi kết nối khi kiểm tra lịch sử Flyway: " + e.getMessage(), e);
        }

        return result;
    }

    public static Map<String, Integer> docInstalledMigrations(DataSource dataSource, String tableName) {
        return docInstalledMigrations(dataSource, Flyway.configure().table(tableName));
    }
}
