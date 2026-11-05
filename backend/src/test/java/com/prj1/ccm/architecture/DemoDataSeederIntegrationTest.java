package com.prj1.ccm.architecture;

import com.prj1.ccm.config.FlywayUpgradeStrategy;
import com.prj1.ccm.support.TestPostgres;
import com.prj1.ccm.toanha.DemoDataReconciliationService;
import com.prj1.ccm.toanha.DemoDataSeeder;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Testcontainers
class DemoDataSeederIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new TestPostgres("postgres:17-alpine");

    private String testUrl;
    private JdbcTemplate jdbc;

    @BeforeEach
    void setUp() {
        testUrl = POSTGRES.getJdbcUrl();
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setUrl(testUrl);
        ds.setUsername(POSTGRES.getUsername());
        ds.setPassword(POSTGRES.getPassword());
        jdbc = new JdbcTemplate(ds);

        // Migrate DB đến V56
        Flyway flyway = Flyway.configure()
                .dataSource(testUrl, POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .cleanDisabled(false)
                .load();
        flyway.clean();

        FlywayUpgradeStrategy strategy = new FlywayUpgradeStrategy();
        strategy.migrate(flyway);
    }

    @Test
    void testDemoBat_chayLan1VaLan2_idempotentKhongNhanBanTaiSan() {
        DemoDataSeeder seeder = new DemoDataSeeder(jdbc);

        // Chạy lần 1
        assertThatNoException().isThrownBy(() -> seeder.run());

        int countPhongLan1 = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG WHERE mo_ta LIKE '[DEMO]%'", Integer.class);
        int countTaiSanLan1 = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE ghi_chu LIKE '[DEMO-SEED]%'", Integer.class);
        int countDichVuLan1 = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU WHERE toa_nha_id = 1", Integer.class);
        int countBangGiaLan1 = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        assertThat(countPhongLan1).isGreaterThan(0);
        assertThat(countTaiSanLan1).isGreaterThan(0);
        assertThat(countDichVuLan1).isEqualTo(5);
        assertThat(countBangGiaLan1).isEqualTo(5);

        // Chạy lần 2
        assertThatNoException().isThrownBy(() -> seeder.run());

        int countPhongLan2 = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG WHERE mo_ta LIKE '[DEMO]%'", Integer.class);
        int countTaiSanLan2 = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE ghi_chu LIKE '[DEMO-SEED]%'", Integer.class);
        int countDichVuLan2 = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU WHERE toa_nha_id = 1", Integer.class);
        int countBangGiaLan2 = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        // Tuyệt đối không bị nhân bản bản ghi nào
        assertThat(countPhongLan2).isEqualTo(countPhongLan1);
        assertThat(countTaiSanLan2).isEqualTo(countTaiSanLan1);
        assertThat(countDichVuLan2).isEqualTo(countDichVuLan1);
        assertThat(countBangGiaLan2).isEqualTo(countBangGiaLan1);
    }

    @Test
    void testPhongVaDichVuThatTrungTen_khongBiGhiDeVaKhongGanSaiBangGia() {
        // 1. Khách hàng đã có sẵn phòng P.101 ở Toà 1 và dịch vụ "Điện sinh hoạt" với đơn giá riêng 4500.00
        jdbc.update("INSERT INTO PHONG (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, mo_ta) VALUES (555, 1, 'P.101', 1, 35.0, 2, 6000000.00, 'VIP', 'TRONG', 'Phòng thật cao cấp của khách')");
        Long dvIdThat = jdbc.queryForObject("INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 'Điện sinh hoạt', 'THEO_CHI_SO', 'CO_DINH', 'kWh', TRUE, TRUE) RETURNING id", Long.class);
        jdbc.update("INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, 4500.00, '2026-01-01')", dvIdThat);

        // 2. Kích hoạt seeder
        DemoDataSeeder seeder = new DemoDataSeeder(jdbc);
        seeder.run();

        // 3. Phòng P.101 thật của khách không bị đổi mô tả, không bị gắn thêm tiền tố [DEMO]
        String moTaPhong = jdbc.queryForObject("SELECT mo_ta FROM PHONG WHERE id = 555", String.class);
        assertThat(moTaPhong).isEqualTo("Phòng thật cao cấp của khách");

        // Phòng P.101 thật không bị gắn tài sản mẫu (chỉ phòng có [DEMO] mới được gắn tài sản)
        Integer countTaiSanPhongThat = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE phong_id = 555", Integer.class);
        assertThat(countTaiSanPhongThat).isEqualTo(0);

        // Dịch vụ của khách vẫn giữ nguyên đơn giá 4500.00, không bị chèn thêm bảng giá 3800.00
        BigDecimal donGiaThat = jdbc.queryForObject("SELECT don_gia FROM BANG_GIA WHERE dich_vu_id = ? AND ngay_hieu_luc = '2026-01-01'", BigDecimal.class, dvIdThat);
        assertThat(donGiaThat).isEqualByComparingTo("4500.00");
    }

    @Test
    void testDemoDataReconciliationService_chiDoc_traUngVienDung() {
        DemoDataSeeder seeder = new DemoDataSeeder(jdbc);
        seeder.run();

        DemoDataReconciliationService recon = new DemoDataReconciliationService(jdbc);
        List<DemoDataReconciliationService.UngVienDoiSoat> candidates = recon.timUngVienCanDoiSoat();

        assertThat(candidates).isNotEmpty();
        for (var c : candidates) {
            assertThat(c.phongId()).isNotNull();
            assertThat(c.soPhong()).isNotBlank();
            // Nếu chưa có hợp đồng/hóa đơn nhưng có tiền tố [DEMO], phải trả ghi chú ứng viên cần xác nhận
            if (c.chuaTienToDemo() && !c.coHopDong()) {
                assertThat(c.ghiChuKiemTra()).contains("ỨNG VIÊN DỮ LIỆU MẪU");
            }
        }
    }
}

