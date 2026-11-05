package com.prj1.ccm.architecture;

import com.prj1.ccm.config.FlywayUpgradeStrategy;
import com.prj1.ccm.support.TestPostgres;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
class MigrationUpgradeHistoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new TestPostgres("postgres:17-alpine");

    private String testUrl;
    private JdbcTemplate jdbc;
    private Path fixtureDir;

    @BeforeEach
    void setUp() throws Exception {
        testUrl = POSTGRES.getJdbcUrl();
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setUrl(testUrl);
        ds.setUsername(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        jdbc = new JdbcTemplate(ds);

        // Dọn sạch schema trước mỗi test
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load()
                .clean();
    }

    @AfterEach
    void tearDown() {
        if (fixtureDir != null && Files.exists(fixtureDir)) {
            try {
                Files.walk(fixtureDir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            } catch (Exception ignored) {
            }
        }
    }

    /**
     * Tạo thư mục fixture độc lập từ artifact lịch sử chuẩn xác.
     */
    private Path taoFixtureMigration(String variantKey) throws Exception {
        fixtureDir = Files.createTempDirectory("fixture-migration-" + variantKey + "-");
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] canonical = resolver.getResources("classpath*:db/migration/*.sql");

        for (Resource res : canonical) {
            String name = res.getFilename();
            if (name == null) continue;
            Path dest = fixtureDir.resolve(name);
            try (InputStream in = res.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
        }

        if ("046d45a".equals(variantKey)) {
            copyFile(resolver.getResource("classpath:db/migration_variants/v046d45a/V49__public_lead_and_viewing_appointments.sql"),
                    fixtureDir.resolve("V49__public_lead_and_viewing_appointments.sql"));
            copyFile(resolver.getResource("classpath:db/migration_variants/v046d45a/V55__room_assets_and_handover.sql"),
                    fixtureDir.resolve("V55__room_assets_and_handover.sql"));
        } else if ("d2e3d69".equals(variantKey)) {
            copyFile(resolver.getResource("classpath:db/migration_variants/vd2e3d69/V49__public_lead_and_viewing_appointments.sql"),
                    fixtureDir.resolve("V49__public_lead_and_viewing_appointments.sql"));
            copyFile(resolver.getResource("classpath:db/migration_variants/vd2e3d69/V55__room_assets_and_handover.sql"),
                    fixtureDir.resolve("V55__room_assets_and_handover.sql"));
        }

        return fixtureDir;
    }

    private void copyFile(Resource src, Path dest) throws Exception {
        try (InputStream in = src.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    @Test
    void a_cleanDb_demoTat_chayTuDauToiCuoi_khongCoDemo() {
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Không có dữ liệu mẫu tài sản trong database
        Integer countTaiSan = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG", Integer.class);
        assertThat(countTaiSan).isEqualTo(0);

        // V56 thành công
        Boolean v56Applied = jdbc.queryForObject("SELECT success FROM flyway_schema_history WHERE version = '56'", Boolean.class);
        assertThat(v56Applied).isTrue();
    }

    @Test
    void b_preV49_coDuLieuThat_nangCapThanhCong_khongClashUnique_khongGanGiaSai() {
        // 1. Database dừng ở V48
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .target("48")
                .load()
                .migrate();

        // 2. Chèn dữ liệu nghiệp vụ thật của khách hàng
        // Toà 1 đã có từ V2; phòng P.101 nhưng ID = 9999 (khác ID 101 của demo)
        jdbc.update("INSERT INTO PHONG (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (9999, 1, 'P.101', 1, 30.0, 2, 4500000.00, 'Khép kín', 'TRONG')");
        // Dịch vụ thật của khách mang ID = 1 và ID = 2
        jdbc.update("INSERT INTO DICH_VU (id, toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 1, 'Dịch vụ mạng riêng của khách', 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE) ON CONFLICT (id) DO NOTHING");
        jdbc.update("INSERT INTO DICH_VU (id, toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (2, 1, 'Dịch vụ giặt ủi', 'THEO_SO_LUONG', 'CO_DINH', 'kg', FALSE, TRUE) ON CONFLICT (id) DO NOTHING");

        // 3. Thực hiện nâng cấp bằng FlywayUpgradeStrategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // 4. Kiểm chứng dữ liệu thật được bảo toàn nguyên vẹn
        Integer phongId = jdbc.queryForObject("SELECT id FROM PHONG WHERE toa_nha_id = 1 AND so_phong = 'P.101'", Integer.class);
        assertThat(phongId).isEqualTo(9999);

        String tenDv1 = jdbc.queryForObject("SELECT ten FROM DICH_VU WHERE id = 1", String.class);
        assertThat(tenDv1).isEqualTo("Dịch vụ mạng riêng của khách");

        // Bảng giá không bị gán đơn giá demo vào dịch vụ thật (dịch vụ 1 chưa có bảng giá do khách chưa tạo)
        Integer countBangGiaDv1 = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA WHERE dich_vu_id = 1", Integer.class);
        assertThat(countBangGiaDv1).isEqualTo(0);

        // Bảng mới được tạo thành công
        Boolean tableLichHen = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'lich_hen_xem_phong')", Boolean.class);
        assertThat(tableLichHen).isTrue();
    }

    @Test
    void c_ban046d45a_daDenV55_nangCapThanhCongLenV56() throws Exception {
        Path fixDir = taoFixtureMigration("046d45a");

        // Giả lập database đã chạy bản 046d45a đến V55
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        Integer checksumV49 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '49'", Integer.class);
        assertThat(checksumV49).isEqualTo(FlywayUpgradeStrategy.CHECKSUM_V49_046D45A);

        Integer checksumV55 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '55'", Integer.class);
        assertThat(checksumV55).isEqualTo(FlywayUpgradeStrategy.CHECKSUM_V55_046D45A);

        // Nâng cấp bằng FlywayUpgradeStrategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        Boolean v56Applied = jdbc.queryForObject("SELECT success FROM flyway_schema_history WHERE version = '56'", Boolean.class);
        assertThat(v56Applied).isTrue();
    }

    @Test
    void d_banD2e3d69_daDenV55_chuanHoaCotTienKhauTru() throws Exception {
        Path fixDir = taoFixtureMigration("d2e3d69");

        // Giả lập database đã chạy bản d2e3d69 đến V55
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        Integer checksumV49 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '49'", Integer.class);
        assertThat(checksumV49).isEqualTo(FlywayUpgradeStrategy.CHECKSUM_V49_D2E3D69);

        Integer checksumV55 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '55'", Integer.class);
        assertThat(checksumV55).isEqualTo(FlywayUpgradeStrategy.CHECKSUM_V55_D2E3D69);

        // Trước V56: có cột tien_khautru
        Boolean coCotCu = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        assertThat(coCotCu).isTrue();

        // Nâng cấp bằng FlywayUpgradeStrategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Sau V56: cột đã được chuẩn hóa sang tien_khau_tru
        Boolean coCotChuan = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(coCotChuan).isTrue();
    }

    @Test
    void e1_mocNangCapDo_v49_046d45a_v55Pending_chayV55CanonicalKhongSinhDemo() throws Exception {
        Path fixDir = taoFixtureMigration("046d45a");

        // Database dừng ở V50 (V49 đã áp dụng từ 046d45a, V55 còn PENDING)
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("50")
                .load()
                .migrate();

        // Nâng cấp bằng FlywayUpgradeStrategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Kiểm tra V55 pending đã chạy bản canonical: KHÔNG có bất kỳ tài sản mẫu nào được sinh ra
        Integer countTaiSan = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG", Integer.class);
        assertThat(countTaiSan).isEqualTo(0);

        // V55 áp dụng có checksum là canonical
        Integer checksumV55 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '55'", Integer.class);
        assertThat(checksumV55).isEqualTo(FlywayUpgradeStrategy.CHECKSUM_V55_CANONICAL);
    }

    @Test
    void e2_mocNangCapDo_v49_d2e3d69_v55Pending_chayV55CanonicalKhongSinhDemo() throws Exception {
        Path fixDir = taoFixtureMigration("d2e3d69");

        // Database dừng ở V54 (V49 đã áp dụng từ d2e3d69, V55 còn PENDING)
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("54")
                .load()
                .migrate();

        // Nâng cấp bằng FlywayUpgradeStrategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // V55 canonical không sinh tài sản mẫu
        Integer countTaiSan = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG", Integer.class);
        assertThat(countTaiSan).isEqualTo(0);

        // V55 tạo trực tiếp cột chuẩn tien_khau_tru
        Boolean coCotChuan = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(coCotChuan).isTrue();
    }

    @Test
    void f_checksumKhongDuocHoTro_failRoRang() {
        // Giả lập DB có V49 với checksum lạ không nằm trong danh mục hỗ trợ
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .target("48")
                .load()
                .migrate();

        jdbc.update("""
                INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
                VALUES (49, '49', 'tampered migration', 'SQL', 'V49__public_lead_and_viewing_appointments.sql', 999999999, 'test', CURRENT_TIMESTAMP, 10, TRUE)
                """);

        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatThrownBy(() -> strategy.migrate(flyway))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Không hỗ trợ nâng cấp database có migration V49 với checksum không xác định: 999999999");
    }

    @Test
    void g_nangCapXong_khoiDongLanHai_khongLoiValidation() throws Exception {
        Path fixDir = taoFixtureMigration("046d45a");

        // 1. Chạy 046d45a đến V55
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        // Lần khởi động 1: Nâng cấp thành công lên V56
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Lần khởi động 2: Tái khởi động ứng dụng, validate thành công, 0 migrations cần chạy
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));
    }

    @Test
    void h_nhanhTuongThich_khongBoSotMigrationTuongLai() throws Exception {
        Path fixDir = taoFixtureMigration("046d45a");

        // 1. Database 046d45a dừng ở V55
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        // 2. Giả lập một migration mới trong tương lai V57 trên runtime classpath của Flyway
        var resV1 = getClass().getResource("/db/migration/V1__baseline.sql");
        Path runtimeMigrationDir = Path.of(resV1.toURI()).getParent();
        Path futureMigrationRuntime = runtimeMigrationDir.resolve("V57__future_feature_test.sql");
        Path futureMigrationSrc = Path.of("D:/vscode/miniapart/MiniApart-main/backend/src/main/resources/db/migration/V57__future_feature_test.sql");
        String sqlV57 = """
                CREATE TABLE IF NOT EXISTS BANG_THU_NGHIEM_TUONG_LAI (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    ten_tinh_nang VARCHAR(100) NOT NULL
                );
                """;
        try {
            Files.writeString(futureMigrationRuntime, sqlV57);
            Files.writeString(futureMigrationSrc, sqlV57);

            Flyway flyway = Flyway.configure()
                    .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                    .locations("classpath:db/migration")
                    .load();

            FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
            assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

            // Bảng tương lai V57 phải được tạo thành công trên nhánh legacy nâng cấp
            Boolean tableExists = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'bang_thu_nghiem_tuong_lai')", Boolean.class);
            assertThat(tableExists).isTrue();
        } finally {
            Files.deleteIfExists(futureMigrationRuntime);
            Files.deleteIfExists(futureMigrationSrc);
        }
    }

    @Test
    void i_taoVaDocBienBanTaiSan_sauNangCapHoatDongThucSu() {
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        strategy.migrate(flyway);

        // Thử nghiệm tạo phòng, hợp đồng và biên bản bàn giao có chi tiết khấu trừ
        jdbc.update("INSERT INTO PHONG (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (1010, 1, 'P.888', 8, 30.0, 2, 5000000.00, 'Khép kín', 'TRONG')");
        jdbc.update("INSERT INTO NGUOI_THUE (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (88, 'Nguyễn Văn A', '1995-01-01', '0988888888', '123456789012', 'Hà Nội')");
        jdbc.update("INSERT INTO HOP_DONG (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (888, 1010, 88, '2026-01-01', '2026-12-31', 5000000.00, 5000000.00, 30, 'HIEU_LUC')");

        // Lập biên bản bàn giao
        Long bbId = jdbc.queryForObject("""
                INSERT INTO BIEN_BAN_BAN_GIAO_TAI_SAN (hop_dong_id, phong_id, loai_bien_ban, nguoi_lap_id, ngay_thuc_hien, tong_tien_khau_tru)
                VALUES (888, 1010, 'TRA_PHONG', 1, CURRENT_DATE, 350000.00)
                RETURNING id
                """, Long.class);

        // Thêm chi tiết biên bản với cột chuẩn tien_khau_tru
        jdbc.update("""
                INSERT INTO CHI_TIET_BIEN_BAN_TAI_SAN (bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khau_tru, ly_do_khau_tru)
                VALUES (?, 'Điều hoà', 1, 'Tốt', 'Hỏng điều khiển', 350000.00, 'Làm mất điều khiển gốc')
                """, bbId);

        // Đọc lại chi tiết biên bản và kiểm tra số tiền khấu trừ
        Map<String, Object> chiTiet = jdbc.queryForMap("SELECT ten_tai_san, tien_khau_tru, ly_do_khau_tru FROM CHI_TIET_BIEN_BAN_TAI_SAN WHERE bien_ban_id = ?", bbId);
        assertThat(chiTiet.get("ten_tai_san")).isEqualTo("Điều hoà");
        assertThat(chiTiet.get("ly_do_khau_tru")).isEqualTo("Làm mất điều khiển gốc");
        assertThat(chiTiet.get("tien_khau_tru").toString()).isEqualTo("350000.00");
    }
}
