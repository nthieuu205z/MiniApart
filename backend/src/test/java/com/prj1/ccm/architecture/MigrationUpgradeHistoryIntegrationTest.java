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
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import com.prj1.ccm.taisan.ChiTietBienBanDto;
import com.prj1.ccm.taisan.TaiSanRepository;
import com.prj1.ccm.taisan.YeuCauChiTietBienBan;
import com.prj1.ccm.taisan.YeuCauLapBienBan;

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

        // 2. Giả lập một migration mới trong tương lai V58 trên runtime classpath của Flyway
        var resV1 = getClass().getResource("/db/migration/V1__baseline.sql");
        Path runtimeMigrationDir = Path.of(resV1.toURI()).getParent();
        Path futureMigrationRuntime = runtimeMigrationDir.resolve("V58__future_feature_test.sql");
        Path futureMigrationSrc = Path.of("D:/vscode/miniapart/MiniApart-main/backend/src/main/resources/db/migration/V58__future_feature_test.sql");
        String sqlV58 = """
                CREATE TABLE IF NOT EXISTS BANG_THU_NGHIEM_TUONG_LAI (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    ten_tinh_nang VARCHAR(100) NOT NULL
                );
                """;
        try {
            Files.writeString(futureMigrationRuntime, sqlV58);
            Files.writeString(futureMigrationSrc, sqlV58);

            Flyway flyway = Flyway.configure()
                    .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                    .locations("classpath:db/migration")
                    .load();

            FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
            assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

            // Bảng tương lai V58 phải được tạo thành công trên nhánh legacy nâng cấp
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

    @Test
    void j_flywayDefaultSchemaKhac_nhanDienDungHistoryLegacyVaNangCapThanhCong() throws Exception {
        // Kịch bản: Connection current schema là public nhưng Flyway được cấu hình defaultSchema("custom_tenant")
        String customSchema = "custom_tenant";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + customSchema);

        Path fixDir = taoFixtureMigration("046d45a");

        // 1. Chạy migration 046d45a đến V55 trong schema custom_tenant
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(customSchema)
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        // 2. Chạy upgrade strategy với cấu hình defaultSchema khác public
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(customSchema)
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Kiểm tra schema custom_tenant đã được nâng cấp lên V56
        Integer checksumV56 = jdbc.queryForObject(
                "SELECT checksum FROM \"" + customSchema + "\".\"flyway_schema_history\" WHERE version = '56'",
                Integer.class
        );
        assertThat(checksumV56).isNotNull();
    }

    @Test
    void k_flywayHistoryTableTuyChinh_nhanDienDungVaNangCapThanhCong() throws Exception {
        // Kịch bản: Flyway được cấu hình tên bảng lịch sử tùy chỉnh "my_custom_history"
        String customTable = "my_custom_history";
        Path fixDir = taoFixtureMigration("d2e3d69");

        // 1. Chạy migration d2e3d69 đến V55 vào bảng custom
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .table(customTable)
                .locations("filesystem:" + fixDir.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        // 2. Chạy upgrade strategy với bảng custom
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .table(customTable)
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Xác nhận bảng custom đã lưu bản ghi V56
        Integer checksumV56 = jdbc.queryForObject(
                "SELECT checksum FROM \"" + customTable + "\" WHERE version = '56'",
                Integer.class
        );
        assertThat(checksumV56).isNotNull();
    }

    @Test
    void l_flywayBangTonTaiNhungDocLoi_nemExceptionRoRang() {
        // Kịch bản: Bảng lịch sử tồn tại nhưng schema bị sai/lỗi (ví dụ thiếu cột checksum)
        // Hệ thống phải fail-fast và ném exception rõ ràng, KHÔNG được che giấu coi như DB mới
        jdbc.execute("CREATE TABLE \"flyway_schema_history\" (id INT, sai_schema VARCHAR(50))");

        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatThrownBy(() -> strategy.migrate(flyway))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Không thể đọc dữ liệu từ bảng lịch sử Flyway");
    }

    @Test
    void m_daSchema_schemaACoCotChuan_schemaBCoCotLoi_nangCapBThanhCongBaoToanDuLieu() throws Exception {
        // Kịch bản: Schema A đã có cột chuẩn tien_khau_tru; Schema B còn cột lỗi tien_khautru từ d2e3d69
        // V56 cũ bỏ qua rename ở B vì thấy cột ở A. V57 mới scope chuẩn current_schema sẽ rename thành công ở B.
        String schemaA = "multi_schema_a";
        String schemaB = "multi_schema_b";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaA);
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaB);

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        // 1. Schema A chạy canonical đến mới nhất (có cột chuẩn tien_khau_tru)
        Flyway flywayA = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaA)
                .locations("classpath:db/migration")
                .load();
        strategy.migrate(flywayA);

        // Chèn dữ liệu biên bản ở Schema A
        jdbc.update("INSERT INTO " + schemaA + ".toa_nha (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang) VALUES (1, 'TN-A', 'Toà A', 'HN', 5, 25, 7, '9704000000000001', 100000.00, '970422') ON CONFLICT (id) DO NOTHING");
        jdbc.update("INSERT INTO " + schemaA + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (101, 1, 'P.101', 1, 30.0, 2, 5000000.00, 'VIP', 'TRONG') ON CONFLICT (id) DO NOTHING");
        jdbc.update("INSERT INTO " + schemaA + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (1, 'Khách A', '1995-01-01', '0911111111', '123456789001', 'HN') ON CONFLICT (id) DO NOTHING");
        jdbc.update("INSERT INTO " + schemaA + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (1, 101, 1, '2026-01-01', '2026-12-31', 5000000.00, 5000000.00, 30, 'HIEU_LUC') ON CONFLICT (id) DO NOTHING");
        jdbc.update("INSERT INTO " + schemaA + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (1, 1, 101, 'TRA_PHONG', '2026-03-01', 1, 500000.00) ON CONFLICT (id) DO NOTHING");
        jdbc.update("INSERT INTO " + schemaA + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khau_tru, ly_do_khau_tru) VALUES (1, 1, 'Tủ lạnh', 1, 'Tốt', 'Nứt khay', 500000.00, 'Nứt khay') ON CONFLICT (id) DO NOTHING");

        // 2. Schema B chạy migration d2e3d69 đến V55 (chứa cột lỗi tien_khautru)
        Path fixDirB = taoFixtureMigration("d2e3d69");
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaB)
                .locations("filesystem:" + fixDirB.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        // Chèn dữ liệu biên bản ở Schema B với cột lỗi tien_khautru (dùng ID phòng và hợp đồng mới để không clash với seed cũ của V49)
        jdbc.update("INSERT INTO " + schemaB + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (9999, 2, 'P.999', 9, 35.0, 2, 6000000.00, 'VIP', 'TRONG')");
        jdbc.update("INSERT INTO " + schemaB + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (99, 'Khách B', '1996-02-02', '0922222222', '123456789002', 'SG')");
        jdbc.update("INSERT INTO " + schemaB + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (999, 9999, 99, '2026-01-01', '2026-12-31', 6000000.00, 6000000.00, 30, 'HIEU_LUC')");
        jdbc.update("INSERT INTO " + schemaB + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (999, 999, 9999, 'TRA_PHONG', '2026-03-01', 1, 350000.00)");
        jdbc.update("INSERT INTO " + schemaB + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, ly_do_khau_tru) VALUES (999, 999, 'Điều hoà', 1, 'Tốt', 'Mất remote', 350000.00, 'Mất remote')");

        // 3. Tiến hành nâng cấp Schema B lên phiên bản mới nhất
        Flyway flywayB = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaB)
                .locations("classpath:db/migration")
                .load();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flywayB));

        // 4. KIỂM TRA BẤT BIẾN:
        // a) Schema B: Cột tien_khautru đã được rename thành tien_khau_tru, dữ liệu 350000.00 được bảo toàn
        Map<String, Object> rowB = jdbc.queryForMap("SELECT tien_khau_tru, ly_do_khau_tru FROM " + schemaB + ".chi_tiet_bien_ban_tai_san WHERE id = 999");
        assertThat(rowB.get("tien_khau_tru").toString()).isEqualTo("350000.00");
        assertThat(rowB.get("ly_do_khau_tru")).isEqualTo("Mất remote");

        Boolean cotCuConKhongB = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaB + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        assertThat(cotCuConKhongB).isFalse();

        // b) Schema A: Không bị ảnh hưởng, dữ liệu 500000.00 giữ nguyên
        Map<String, Object> rowA = jdbc.queryForMap("SELECT tien_khau_tru, ly_do_khau_tru FROM " + schemaA + ".chi_tiet_bien_ban_tai_san WHERE id = 1");
        assertThat(rowA.get("tien_khau_tru").toString()).isEqualTo("500000.00");
        assertThat(rowA.get("ly_do_khau_tru")).isEqualTo("Nứt khay");

        // c) Đọc/ghi biên bản qua repository thật trong Schema B
        DriverManagerDataSource dsB = new DriverManagerDataSource();
        dsB.setUrl(testUrl + "?currentSchema=" + schemaB);
        dsB.setUsername(POSTGRES.getUsername());
        dsB.setPassword(POSTGRES.getPassword());
        JdbcTemplate jdbcB = new JdbcTemplate(dsB);
        TaiSanRepository repoB = new TaiSanRepository(jdbcB);

        // Đọc chi tiết biên bản qua repository
        List<ChiTietBienBanDto> chiTietListB = repoB.layChiTietBienBan(999L);
        assertThat(chiTietListB).hasSize(1);
        assertThat(chiTietListB.get(0).tienKhauTru()).isEqualByComparingTo("350000.00");
        assertThat(chiTietListB.get(0).tenTaiSan()).isEqualTo("Điều hoà");

        // Ghi biên bản mới qua repository trong Schema B
        YeuCauLapBienBan yeuCauMoi = new YeuCauLapBienBan(
                "NHAN_PHONG",
                LocalDate.of(2026, 4, 1),
                "Ghi mới qua repoB",
                List.of(new YeuCauChiTietBienBan(null, "Bình nóng lạnh", 1, "Tốt", "Tốt", BigDecimal.ZERO, null, null))
        );
        Long newBbId = repoB.lapBienBan(999L, 9999L, 1L, yeuCauMoi);
        assertThat(newBbId).isNotNull();

        List<ChiTietBienBanDto> newChiTietList = repoB.layChiTietBienBan(newBbId);
        assertThat(newChiTietList).hasSize(1);
        assertThat(newChiTietList.get(0).tenTaiSan()).isEqualTo("Bình nóng lạnh");
    }

    @Test
    void n_daSchema_daoThuTuNangCap_schemaBChayTruoc_schemaAChaySau() throws Exception {
        // Đảo thứ tự: Nâng cấp Schema B trước, sau đó nâng cấp Schema A
        String schemaRevB = "rev_schema_b";
        String schemaRevA = "rev_schema_a";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaRevB);
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaRevA);

        Path fixDirB = taoFixtureMigration("d2e3d69");
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaRevB)
                .locations("filesystem:" + fixDirB.toAbsolutePath().toString().replace('\\', '/'))
                .target("55")
                .load()
                .migrate();

        jdbc.update("INSERT INTO " + schemaRevB + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (8888, 2, 'P.888', 8, 35.0, 2, 6000000.00, 'VIP', 'TRONG')");
        jdbc.update("INSERT INTO " + schemaRevB + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (88, 'Khách B3', '1996-03-03', '0933333333', '123456789003', 'SG')");
        jdbc.update("INSERT INTO " + schemaRevB + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (888, 8888, 88, '2026-01-01', '2026-12-31', 6000000.00, 6000000.00, 30, 'HIEU_LUC')");
        jdbc.update("INSERT INTO " + schemaRevB + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (888, 888, 8888, 'TRA_PHONG', '2026-03-01', 1, 250000.00)");
        jdbc.update("INSERT INTO " + schemaRevB + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, ly_do_khau_tru) VALUES (888, 888, 'Bếp từ', 1, 'Tốt', 'Vỡ mặt kính', 250000.00, 'Vỡ kính')");

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        // 1. Nâng cấp Schema B trước
        Flyway flywayB = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaRevB)
                .locations("classpath:db/migration")
                .load();
        strategy.migrate(flywayB);

        // 2. Nâng cấp Schema A sau
        Flyway flywayA = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaRevA)
                .locations("classpath:db/migration")
                .load();
        strategy.migrate(flywayA);

        // Kiểm tra Schema B bảo toàn dữ liệu
        Map<String, Object> rowB = jdbc.queryForMap("SELECT tien_khau_tru FROM " + schemaRevB + ".chi_tiet_bien_ban_tai_san WHERE id = 888");
        assertThat(rowB.get("tien_khau_tru").toString()).isEqualTo("250000.00");

        // Kiểm tra Schema A có bảng với cột chuẩn
        Boolean cotA = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaRevA + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(cotA).isTrue();
    }

    @Test
    void o_daSchema_caHaiCotCungTonTai_khongXungDot_hopNhatBaoToanDuLieu() {
        // Schema tồn tại cả hai cột nhưng không xung đột giá trị (bằng nhau hoặc NULL một bên):
        // V57 hợp nhất an toàn sang tien_khau_tru và dọn dẹp tien_khautru mà không làm mất thông tin
        String schemaDual = "schema_dual_col";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaDual);

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        // 1. Chạy Flyway đến V56
        Flyway flyway56 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaDual)
                .locations("classpath:db/migration")
                .target("56")
                .load();
        strategy.migrate(flyway56);

        // 2. Thêm cột cũ tien_khautru và tạo dữ liệu mô phỏng không xung đột:
        jdbc.execute("ALTER TABLE " + schemaDual + ".chi_tiet_bien_ban_tai_san ADD COLUMN tien_khautru NUMERIC(15,2)");
        jdbc.execute("ALTER TABLE " + schemaDual + ".chi_tiet_bien_ban_tai_san ALTER COLUMN tien_khau_tru DROP NOT NULL");
        jdbc.update("INSERT INTO " + schemaDual + ".toa_nha (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang) VALUES (1, 'TN-O', 'Toà O', 'HN', 5, 25, 7, '9704000000000001', 100000.00, '970422') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaDual + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (9101, 1, 'P.9101', 9, 30.0, 2, 5000000.00, 'VIP', 'TRONG') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaDual + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (91, 'Khách O', '1995-01-01', '0911111111', '123456789001', 'HN') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaDual + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (91, 9101, 91, '2026-01-01', '2026-12-31', 5000000.00, 5000000.00, 30, 'HIEU_LUC') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaDual + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (91, 91, 9101, 'TRA_PHONG', '2026-03-01', 1, 350000.00) ON CONFLICT DO NOTHING");

        // a) Hai giá trị bằng nhau (số dương): 150000.00 == 150000.00
        jdbc.update("INSERT INTO " + schemaDual + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (911, 91, 'Tủ lạnh', 1, 'Tốt', 'Nứt khay', 150000.00, 150000.00, 'Nứt khay')");
        // b) Hai giá trị bằng nhau (mức 0 hợp lệ): 0.00 == 0.00
        jdbc.update("INSERT INTO " + schemaDual + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (912, 91, 'Quạt trần', 1, 'Tốt', 'Bình thường', 0.00, 0.00, 'Miễn trừ')");
        // c) Cột cũ NULL, cột chuẩn có giá trị: NULL vs 200000.00
        jdbc.update("INSERT INTO " + schemaDual + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (913, 91, 'Điều hoà', 1, 'Tốt', 'Hỏng điều khiển', NULL, 200000.00, 'Hỏng điều khiển')");
        // d) Cột chuẩn NULL, cột cũ có giá trị: 300000.00 vs NULL
        jdbc.update("INSERT INTO " + schemaDual + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (914, 91, 'Máy giặt', 1, 'Tốt', 'Kẹt cửa', 300000.00, NULL, 'Kẹt cửa')");

        // 3. Chạy migration V57 trực tiếp trong schemaDual
        Flyway flyway57 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaDual)
                .locations("classpath:db/migration")
                .load();
        strategy.migrate(flyway57);

        // Kiểm tra dữ liệu được bảo toàn đầy đủ và cột cũ đã được dọn dẹp
        BigDecimal val1 = jdbc.queryForObject("SELECT tien_khau_tru FROM " + schemaDual + ".chi_tiet_bien_ban_tai_san WHERE id = 911", BigDecimal.class);
        BigDecimal val2 = jdbc.queryForObject("SELECT tien_khau_tru FROM " + schemaDual + ".chi_tiet_bien_ban_tai_san WHERE id = 912", BigDecimal.class);
        BigDecimal val3 = jdbc.queryForObject("SELECT tien_khau_tru FROM " + schemaDual + ".chi_tiet_bien_ban_tai_san WHERE id = 913", BigDecimal.class);
        BigDecimal val4 = jdbc.queryForObject("SELECT tien_khau_tru FROM " + schemaDual + ".chi_tiet_bien_ban_tai_san WHERE id = 914", BigDecimal.class);
        assertThat(val1).isEqualByComparingTo("150000.00");
        assertThat(val2).isEqualByComparingTo("0.00");
        assertThat(val3).isEqualByComparingTo("200000.00");
        assertThat(val4).isEqualByComparingTo("300000.00");

        Boolean cotCuConKhong = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaDual + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        assertThat(cotCuConKhong).isFalse();
    }

    @Test
    void p1_daSchema_caHaiCot_xungDotHaiSoDuongKhacNhau_failVaRollbackBaoToanDuLieu() {
        // Hai số dương khác nhau (150000.00 <> 300000.00): V57 phải fail rõ ràng, transaction rollback, giữ nguyên 2 cột và dữ liệu
        String schemaConflict = "schema_conflict_pos";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaConflict);

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        Flyway flyway56 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaConflict)
                .locations("classpath:db/migration")
                .target("56")
                .load();
        strategy.migrate(flyway56);

        jdbc.execute("ALTER TABLE " + schemaConflict + ".chi_tiet_bien_ban_tai_san ADD COLUMN tien_khautru NUMERIC(15,2)");
        jdbc.update("INSERT INTO " + schemaConflict + ".toa_nha (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang) VALUES (1, 'TN-C1', 'Toà C1', 'HN', 5, 25, 7, '9704000000000001', 100000.00, '970422') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaConflict + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (9201, 1, 'P.9201', 9, 30.0, 2, 5000000.00, 'VIP', 'TRONG') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaConflict + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (92, 'Khách C1', '1995-01-01', '0911111111', '123456789001', 'HN') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaConflict + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (92, 9201, 92, '2026-01-01', '2026-12-31', 5000000.00, 5000000.00, 30, 'HIEU_LUC') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaConflict + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (92, 92, 9201, 'TRA_PHONG', '2026-03-01', 1, 350000.00) ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaConflict + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (921, 92, 'Tủ lạnh', 1, 'Tốt', 'Nứt khay', 150000.00, 300000.00, 'Nứt khay')");

        Flyway flyway57 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaConflict)
                .locations("classpath:db/migration")
                .load();

        assertThatThrownBy(() -> strategy.migrate(flyway57))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("Xung đột dữ liệu schema");

        // KIỂM TRA BẤT BIẾN KHI BỊ TỪ CHỐI: Transaction rollback, cả hai cột và giá trị còn nguyên
        Boolean cotOldTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaConflict + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        Boolean cotStdTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaConflict + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(cotOldTonTai).isTrue();
        assertThat(cotStdTonTai).isTrue();

        Map<String, Object> row = jdbc.queryForMap("SELECT tien_khautru, tien_khau_tru FROM " + schemaConflict + ".chi_tiet_bien_ban_tai_san WHERE id = 921");
        assertThat(row.get("tien_khautru").toString()).isEqualTo("150000.00");
        assertThat(row.get("tien_khau_tru").toString()).isEqualTo("300000.00");
    }

    @Test
    void p2_daSchema_caHaiCot_xungDotChieu1_khauTru0VaSoDuong_failVaRollbackBaoToanDuLieu() {
        // Chiều 1: tien_khautru = 0.00 và tien_khau_tru = 150000.00
        // 0 là mức khấu trừ hợp lệ (miễn trừ), không được tự ý ghi đè hay drop -> phải fail và rollback
        String schema0Pos = "schema_conflict_0_pos";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schema0Pos);

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        Flyway flyway56 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schema0Pos)
                .locations("classpath:db/migration")
                .target("56")
                .load();
        strategy.migrate(flyway56);

        jdbc.execute("ALTER TABLE " + schema0Pos + ".chi_tiet_bien_ban_tai_san ADD COLUMN tien_khautru NUMERIC(15,2)");
        jdbc.update("INSERT INTO " + schema0Pos + ".toa_nha (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang) VALUES (1, 'TN-C2', 'Toà C2', 'HN', 5, 25, 7, '9704000000000001', 100000.00, '970422') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schema0Pos + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (9301, 1, 'P.9301', 9, 30.0, 2, 5000000.00, 'VIP', 'TRONG') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schema0Pos + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (93, 'Khách C2', '1995-01-01', '0911111111', '123456789001', 'HN') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schema0Pos + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (93, 9301, 93, '2026-01-01', '2026-12-31', 5000000.00, 5000000.00, 30, 'HIEU_LUC') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schema0Pos + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (93, 93, 9301, 'TRA_PHONG', '2026-03-01', 1, 150000.00) ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schema0Pos + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (931, 93, 'Điều hoà', 1, 'Tốt', 'Hỏng remote', 0.00, 150000.00, 'Cần đối soát')");

        Flyway flyway57 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schema0Pos)
                .locations("classpath:db/migration")
                .load();

        assertThatThrownBy(() -> strategy.migrate(flyway57))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("Xung đột dữ liệu schema");

        // KIỂM TRA BẤT BIẾN KHI BỊ TỪ CHỐI: Transaction rollback, cả hai cột và giá trị còn nguyên
        Boolean cotOldTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schema0Pos + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        Boolean cotStdTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schema0Pos + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(cotOldTonTai).isTrue();
        assertThat(cotStdTonTai).isTrue();

        Map<String, Object> row = jdbc.queryForMap("SELECT tien_khautru, tien_khau_tru FROM " + schema0Pos + ".chi_tiet_bien_ban_tai_san WHERE id = 931");
        assertThat(row.get("tien_khautru").toString()).isEqualTo("0.00");
        assertThat(row.get("tien_khau_tru").toString()).isEqualTo("150000.00");
    }

    @Test
    void p3_daSchema_caHaiCot_xungDotChieu2_soDuongVaKhauTru0_failVaRollbackBaoToanDuLieu() {
        // Chiều 2: tien_khautru = 150000.00 và tien_khau_tru = 0.00
        // Cột chuẩn có 0 không có nghĩa là chưa có dữ liệu; không được ghi đè 150000 và drop cột cũ -> phải fail và rollback
        String schemaPos0 = "schema_conflict_pos_0";
        jdbc.execute("CREATE SCHEMA IF NOT EXISTS " + schemaPos0);

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();

        Flyway flyway56 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaPos0)
                .locations("classpath:db/migration")
                .target("56")
                .load();
        strategy.migrate(flyway56);

        jdbc.execute("ALTER TABLE " + schemaPos0 + ".chi_tiet_bien_ban_tai_san ADD COLUMN tien_khautru NUMERIC(15,2)");
        jdbc.update("INSERT INTO " + schemaPos0 + ".toa_nha (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang) VALUES (1, 'TN-C3', 'Toà C3', 'HN', 5, 25, 7, '9704000000000001', 100000.00, '970422') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaPos0 + ".phong (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (9401, 1, 'P.9401', 9, 30.0, 2, 5000000.00, 'VIP', 'TRONG') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaPos0 + ".nguoi_thue (id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (94, 'Khách C3', '1995-01-01', '0911111111', '123456789001', 'HN') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaPos0 + ".hop_dong (id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (94, 9401, 94, '2026-01-01', '2026-12-31', 5000000.00, 5000000.00, 30, 'HIEU_LUC') ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaPos0 + ".bien_ban_ban_giao_tai_san (id, hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, tong_tien_khau_tru) VALUES (94, 94, 9401, 'TRA_PHONG', '2026-03-01', 1, 150000.00) ON CONFLICT DO NOTHING");
        jdbc.update("INSERT INTO " + schemaPos0 + ".chi_tiet_bien_ban_tai_san (id, bien_ban_id, ten_tai_san, so_luong, tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khautru, tien_khau_tru, ly_do_khau_tru) VALUES (941, 94, 'Tủ lạnh', 1, 'Tốt', 'Nứt khay', 150000.00, 0.00, 'Cần đối soát')");

        Flyway flyway57 = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .defaultSchema(schemaPos0)
                .locations("classpath:db/migration")
                .load();

        assertThatThrownBy(() -> strategy.migrate(flyway57))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("Xung đột dữ liệu schema");

        // KIỂM TRA BẤT BIẾN KHI BỊ TỪ CHỐI: Transaction rollback, cả hai cột và giá trị còn nguyên
        Boolean cotOldTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaPos0 + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        Boolean cotStdTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = '" + schemaPos0 + "' AND table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(cotOldTonTai).isTrue();
        assertThat(cotStdTonTai).isTrue();

        Map<String, Object> row = jdbc.queryForMap("SELECT tien_khautru, tien_khau_tru FROM " + schemaPos0 + ".chi_tiet_bien_ban_tai_san WHERE id = 941");
        assertThat(row.get("tien_khautru").toString()).isEqualTo("150000.00");
        assertThat(row.get("tien_khau_tru").toString()).isEqualTo("0.00");
    }
}
