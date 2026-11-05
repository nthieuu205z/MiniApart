package com.prj1.ccm.architecture;

import com.prj1.ccm.config.FlywayUpgradeStrategy;
import com.prj1.ccm.support.TestPostgres;
import com.prj1.ccm.toanha.DemoDataSeeder;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

@Testcontainers
class MigrationUpgradeHistoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new TestPostgres("postgres:17-alpine");

    private JdbcTemplate taoJdbcTemplate(String jdbcUrl) {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setUrl(jdbcUrl);
        ds.setUsername(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        return new JdbcTemplate(ds);
    }

    @Test
    void duongNangCap1_databaseTruocV49CoDuLieuThat_nangCapThanhCongKhongMatDuLieuVaKhongClashUnique() {
        String testUrl = POSTGRES.getJdbcUrl();
        JdbcTemplate jdbc = taoJdbcTemplate(testUrl);

        // 1. Giả lập cơ sở dữ liệu đã có từ trước V49 (áp dụng đến V48)
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration_common")
                .target("48")
                .cleanDisabled(false)
                .load()
                .clean();

        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration_common")
                .target("48")
                .load()
                .migrate();

        // 2. Chèn dữ liệu thực tế của khách hàng: Toà 1 đã có từ V2; phòng P.101 nhưng ID = 999 (khác ID 101 của demo)
        jdbc.update("INSERT INTO PHONG (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (999, 1, 'P.101', 1, 30.0, 2, 4000000.00, 'Khép kín', 'TRONG')");
        jdbc.update("INSERT INTO DICH_VU (id, toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 1, 'Dịch vụ thật của khách', 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE) ON CONFLICT (id) DO NOTHING");

        // 3. Thực thi nâng cấp qua FlywayUpgradeStrategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // 4. Xác nhận dữ liệu thật được bảo toàn nguyên vẹn
        Integer phongId = jdbc.queryForObject("SELECT id FROM PHONG WHERE toa_nha_id = 1 AND so_phong = 'P.101'", Integer.class);
        assertThat(phongId).isEqualTo(999);

        String tenDv = jdbc.queryForObject("SELECT ten FROM DICH_VU WHERE id = 1", String.class);
        assertThat(tenDv).isEqualTo("Dịch vụ thật của khách");

        // Bảng mới và cột mới đã được tạo thành công
        Boolean bangLichHenTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'lich_hen_xem_phong')", Boolean.class);
        assertThat(bangLichHenTonTai).isTrue();

        Boolean bangTaiSanTonTai = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tai_san_phong')", Boolean.class);
        assertThat(bangTaiSanTonTai).isTrue();
    }

    @Test
    void duongNangCap2_databaseDaApDung046d45a_validateChecksumThanhCongVaApDungV56() {
        String testUrl = POSTGRES.getJdbcUrl();
        JdbcTemplate jdbc = taoJdbcTemplate(testUrl);

        // 1. Giả lập database đã chạy bản 046d45a (đến V55)
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration_common", "classpath:db/migration_variants/v046d45a")
                .target("55")
                .cleanDisabled(false)
                .load()
                .clean();

        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration_common", "classpath:db/migration_variants/v046d45a")
                .target("55")
                .load()
                .migrate();

        // Kiểm tra checksum của V49 trong DB khớp với mốc 046d45a
        Integer checksumV49 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '49'", Integer.class);
        assertThat(FlywayUpgradeStrategy.is046d45a(checksumV49)).isTrue();

        // 2. Chạy upgrade strategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // 3. V56 được áp dụng thành công
        Boolean v56Applied = jdbc.queryForObject("SELECT success FROM flyway_schema_history WHERE version = '56'", Boolean.class);
        assertThat(v56Applied).isTrue();
    }

    @Test
    void duongNangCap3_databaseDaApDungD2e3d69_validateChecksumThanhCongVaChuanHoaTenCot() {
        String testUrl = POSTGRES.getJdbcUrl();
        JdbcTemplate jdbc = taoJdbcTemplate(testUrl);

        // 1. Giả lập database đã chạy bản d2e3d69 (đến V55 có cột tien_khautru)
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration_common", "classpath:db/migration_variants/vd2e3d69")
                .target("55")
                .cleanDisabled(false)
                .load()
                .clean();

        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration_common", "classpath:db/migration_variants/vd2e3d69")
                .target("55")
                .load()
                .migrate();

        Integer checksumV49 = jdbc.queryForObject("SELECT checksum FROM flyway_schema_history WHERE version = '49'", Integer.class);
        assertThat(FlywayUpgradeStrategy.isD2e3d69(checksumV49)).isTrue();

        // Kiểm tra trước khi chạy V56: có cột tien_khautru
        Boolean coCotCu = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khautru')", Boolean.class);
        assertThat(coCotCu).isTrue();

        // 2. Chạy upgrade strategy
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // 3. Sau V56: cột đã được chuẩn hóa sang tien_khau_tru
        Boolean coCotChuan = jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'chi_tiet_bien_ban_tai_san' AND column_name = 'tien_khau_tru')", Boolean.class);
        assertThat(coCotChuan).isTrue();
    }

    @Test
    void duongNangCap4_databaseMoi_chayTuDauToiCuoiSachSeVaKhongCoSeedDemo() {
        String testUrl = POSTGRES.getJdbcUrl();
        JdbcTemplate jdbc = taoJdbcTemplate(testUrl);

        // Clean database
        Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load()
                .clean();

        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        assertThatNoException().isThrownBy(() -> strategy.migrate(flyway));

        // Không có dữ liệu demo trong phòng hay tài sản
        Integer countTaiSan = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG", Integer.class);
        assertThat(countTaiSan).isEqualTo(0);

        // Thử kích hoạt active seeder
        DemoDataSeeder seeder = new DemoDataSeeder(jdbc);
        assertThatNoException().isThrownBy(() -> seeder.run());

        Integer countTaiSanSauSeed = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG", Integer.class);
        assertThat(countTaiSanSauSeed).isGreaterThan(0);
    }
}

