package com.prj1.ccm.architecture;

import com.prj1.ccm.MiniApartApplication;
import com.prj1.ccm.config.FlywayUpgradeStrategy;
import com.prj1.ccm.support.TestPostgres;
import com.prj1.ccm.toanha.DemoDataReconciliationService;
import com.prj1.ccm.toanha.DemoDataSeeder;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.mockito.Mockito;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm chứng toàn diện DemoDataSeeder:
 * 1. Spring Bean & Proxy: Seeder được tạo thành Spring AOP proxy khi app.seed-demo=true.
 * 2. ConditionalOnProperty: Bean hoàn toàn KHÔNG được tạo khi app.seed-demo=false hoặc không cấu hình.
 * 3. Transactional Rollback thực tế: Cố ý gây lỗi sau khi ghi một phần qua Trigger,
 *    Spring @Transactional rollback toàn bộ dữ liệu nghiệp vụ của lần seed đó.
 * 4. Idempotency qua Spring Proxy: Chạy lại nhiều lần qua bean proxy không nhân bản bản ghi nào.
 * 5. Tách biệt dịch vụ demo khỏi dịch vụ thật: Dịch vụ thật cùng tên có giá từ 2025-12-01,
 *    dịch vụ chưa có giá, có giá tương lai, và trùng nhiều tên đều KHÔNG bị thay đổi bất kỳ thuộc tính hay bảng giá nào.
 */
@Testcontainers
@SpringBootTest(classes = MiniApartApplication.class, webEnvironment = SpringBootTest.WebEnvironment.NONE, properties = {
        "app.seed-demo=true"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DemoDataSeederIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new TestPostgres("postgres:17-alpine");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired(required = false)
    private DemoDataSeeder seeder;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void setUpCleanSchema() {
        // Đảm bảo Flyway schema ở V56
        Flyway flyway = Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("classpath:db/migration")
                .load();
        new FlywayUpgradeStrategy().migrate(flyway);
    }

    @Test
    @Order(1)
    void test1_conditionalOnProperty_tatHoacKhongCauHinh_beanKhongDuocTao() {
        ApplicationContextRunner contextRunner = new ApplicationContextRunner()
                .withBean(JdbcTemplate.class, () -> Mockito.mock(JdbcTemplate.class))
                .withUserConfiguration(DemoDataSeeder.class);

        // 1. Khi không cấu hình thuộc tính app.seed-demo: Bean không được nạp vào
        // Spring context
        contextRunner.run(ctx -> {
            assertThat(ctx).doesNotHaveBean(DemoDataSeeder.class);
            assertThat(ctx.containsBean("demoDataSeeder")).isFalse();
        });

        // 2. Khi cấu hình app.seed-demo=false: Bean không được nạp vào Spring context
        contextRunner.withPropertyValues("app.seed-demo=false").run(ctx -> {
            assertThat(ctx).doesNotHaveBean(DemoDataSeeder.class);
            assertThat(ctx.containsBean("demoDataSeeder")).isFalse();
        });

        // 3. Khi cấu hình app.seed-demo=true: Bean ĐƯỢC nạp duy nhất 1 instance
        contextRunner.withPropertyValues("app.seed-demo=true").run(ctx -> {
            assertThat(ctx).hasSingleBean(DemoDataSeeder.class);
            assertThat(ctx.containsBean("demoDataSeeder")).isTrue();
        });
    }

    @Test
    @Order(2)
    void test2_startupVaBeanProxy_appSeedDemoTrue_laSpringProxyVaDaChaySeed() {
        // Kiểm chứng bean thực sự tồn tại trong ApplicationContext và được bọc bởi
        // Spring Transaction Proxy
        assertThat(seeder).isNotNull();
        assertThat(applicationContext.containsBean("demoDataSeeder")).isTrue();
        assertThat(AopUtils.isAopProxy(seeder)).isTrue();

        // Kiểm chứng startup đã tự động chạy seeder và tạo dữ liệu mẫu
        int countPhong = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG WHERE mo_ta LIKE '[DEMO]%'", Integer.class);
        int countTaiSan = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE ghi_chu LIKE '[DEMO-SEED]%'",
                Integer.class);
        int countDichVu = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU WHERE toa_nha_id = 1", Integer.class);
        int countBangGia = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        assertThat(countPhong).isGreaterThan(0);
        assertThat(countTaiSan).isGreaterThan(0);
        assertThat(countDichVu).isEqualTo(5);
        assertThat(countBangGia).isEqualTo(5);
    }

    @Test
    @Order(3)
    void test3_idempotency_chayLaiQuaSpringBeanProxy_khongNhanBanDuLieu() {
        int countPhongTruoc = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG WHERE mo_ta LIKE '[DEMO]%'",
                Integer.class);
        int countTaiSanTruoc = jdbc
                .queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE ghi_chu LIKE '[DEMO-SEED]%'", Integer.class);
        int countDichVuTruoc = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU WHERE toa_nha_id = 1", Integer.class);
        int countBangGiaTruoc = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        // Chạy lại lần 2 qua Spring Bean Proxy
        assertThatNoException().isThrownBy(() -> seeder.run());

        int countPhongSau = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG WHERE mo_ta LIKE '[DEMO]%'", Integer.class);
        int countTaiSanSau = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE ghi_chu LIKE '[DEMO-SEED]%'",
                Integer.class);
        int countDichVuSau = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU WHERE toa_nha_id = 1", Integer.class);
        int countBangGiaSau = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        // Toàn bộ dữ liệu không bị nhân bản
        assertThat(countPhongSau).isEqualTo(countPhongTruoc);
        assertThat(countTaiSanSau).isEqualTo(countTaiSanTruoc);
        assertThat(countDichVuSau).isEqualTo(countDichVuTruoc);
        assertThat(countBangGiaSau).isEqualTo(countBangGiaTruoc);
    }

    @Test
    @Order(4)
    void test4_transactionalRollback_khiLoiGiuaChung_rollbackToanBoDuLieuNghiepVu() {
        // Dọn sạch dữ liệu nghiệp vụ bằng TRUNCATE CASCADE để đo lường rollback sạch 100%
        jdbc.execute("TRUNCATE TABLE TOA_NHA CASCADE;");

        // Cố ý cài đặt Trigger gây lỗi tại bước cuối cùng (seedTaiSanMau)
        // Khi chèn vào TAI_SAN_PHONG, trigger sẽ ném ngoại lệ trong database
        jdbc.execute("""
                CREATE OR REPLACE FUNCTION trg_fail_seed_fn() RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'LỖI CỐ Ý TẠI BƯỚC CUỐI ĐỂ KIỂM CHỨNG TRANSACTION ROLLBACK';
                END;
                $$ LANGUAGE plpgsql;
                """);
        jdbc.execute("""
                CREATE TRIGGER trg_test_fail_tai_san
                BEFORE INSERT ON TAI_SAN_PHONG
                FOR EACH ROW EXECUTE FUNCTION trg_fail_seed_fn();
                """);

        try {
            // Gọi qua Spring Transactional Proxy: Phải ném ngoại lệ
            assertThatThrownBy(() -> seeder.run())
                    .isInstanceOf(Exception.class)
                    .hasMessageContaining("LỖI CỐ Ý TẠI BƯỚC CUỐI");

            // Xác nhận bất biến: Các bước chạy trước đó (seedToaNhaNeuChuaCo,
            // seedDichVuVaBangGia, seedPhongMau)
            // đều đã bị Spring Transactional rollback hoàn toàn khỏi database!
            int countToaNha = jdbc.queryForObject("SELECT COUNT(*) FROM TOA_NHA", Integer.class);
            int countDichVu = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU", Integer.class);
            int countBangGia = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);
            int countPhong = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG", Integer.class);
            int countTaiSan = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG", Integer.class);

            assertThat(countToaNha).isEqualTo(0);
            assertThat(countDichVu).isEqualTo(0);
            assertThat(countBangGia).isEqualTo(0);
            assertThat(countPhong).isEqualTo(0);
            assertThat(countTaiSan).isEqualTo(0);
        } finally {
            // Dọn dẹp trigger kiểm thử
            jdbc.execute("DROP TRIGGER IF EXISTS trg_test_fail_tai_san ON TAI_SAN_PHONG");
            jdbc.execute("DROP FUNCTION IF EXISTS trg_fail_seed_fn()");
        }

        // Sau khi gỡ trigger, chạy lại seeder thành công hoàn toàn
        assertThatNoException().isThrownBy(() -> seeder.run());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM TOA_NHA", Integer.class)).isGreaterThan(0);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM PHONG", Integer.class)).isGreaterThan(0);
    }

    @Test
    @Order(5)
    void test5_dichVuThatCungTen_coGiaTruoc_chuaCoGia_giaTuongLai_khongBiThayDoi() {
        // Dọn dữ liệu kiểm thử
        jdbc.execute("TRUNCATE TABLE TOA_NHA CASCADE;");

        // 1. Tạo toà nhà 1
        jdbc.update(
                """
                        INSERT INTO TOA_NHA (id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat, ma_ngan_hang)
                        VALUES (1, 'TN-A', 'Toà Thật Của Khách', 'Hà Nội', 6, 25, 7, '9704000000000101', 150000.00, '970422')
                        """);

        // 2. Tạo các kịch bản dịch vụ thật trùng tên:
        // a) Dịch vụ 1: "Điện sinh hoạt" thật của khách, có giá từ quá khứ 2025-12-01
        // (4500.00)
        Long dvDienThatId = jdbc.queryForObject("""
                INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES (1, 'Điện sinh hoạt', 'THEO_CHI_SO', 'CO_DINH', 'kWh', TRUE, TRUE)
                RETURNING id
                """, Long.class);
        jdbc.update("INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, 4500.00, '2025-12-01')",
                dvDienThatId);

        // b) Dịch vụ 2: "Nước sinh hoạt" thật của khách, CHƯA CÓ BẢNG GIÁ
        Long dvNuocThatId = jdbc.queryForObject("""
                INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES (1, 'Nước sinh hoạt', 'THEO_CHI_SO', 'CO_DINH', 'm³', FALSE, TRUE)
                RETURNING id
                """, Long.class);

        // c) Dịch vụ 3: "Internet tốc độ cao" thật của khách, CÓ GIÁ TƯƠNG LAI
        // 2026-06-01 (250000.00)
        Long dvNetThatId = jdbc.queryForObject("""
                INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES (1, 'Internet tốc độ cao', 'CO_DINH', 'CO_DINH', 'phòng', FALSE, TRUE)
                RETURNING id
                """, Long.class);
        jdbc.update("INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, 250000.00, '2026-06-01')",
                dvNetThatId);

        // d) Dịch vụ 4 & 5: Trùng nhiều tên "Gửi xe máy" của khách
        Long dvXe1Id = jdbc.queryForObject("""
                INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES (1, 'Gửi xe máy', 'THEO_SO_LUONG', 'CO_DINH', 'xe', FALSE, TRUE)
                RETURNING id
                """, Long.class);
        Long dvXe2Id = jdbc.queryForObject("""
                INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES (1, 'Gửi xe máy', 'THEO_SO_LUONG', 'CO_DINH', 'xe', FALSE, TRUE)
                RETURNING id
                """, Long.class);
        jdbc.update("INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, 150000.00, '2025-10-01')",
                dvXe1Id);

        // Thêm phòng thật không có tiền tố [DEMO]
        jdbc.update(
                "INSERT INTO PHONG (id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, mo_ta) VALUES (777, 1, 'P.101', 1, 35.0, 2, 6000000.00, 'VIP', 'TRONG', 'Phòng thật cao cấp của khách')");

        // 3. Kích hoạt seeder qua Spring Bean Proxy
        seeder.run();

        // 4. KIỂM TRA BẤT BIẾN TOÀN DIỆN:
        // a) Dịch vụ Điện: Vẫn chỉ có 1 bảng giá duy nhất (4500.00 ngày 2025-12-01).
        // Tuyệt đối không chèn giá demo 3800.00 ngày 2026-01-01
        List<BigDecimal> giaDien = jdbc.query(
                "SELECT don_gia FROM BANG_GIA WHERE dich_vu_id = ? ORDER BY ngay_hieu_luc",
                (rs, rowNum) -> rs.getBigDecimal("don_gia"), dvDienThatId);
        assertThat(giaDien).hasSize(1);
        assertThat(giaDien.get(0)).isEqualByComparingTo("4500.00");

        // b) Dịch vụ Nước: Chưa có giá -> Vẫn 0 bảng giá. Tuyệt đối không chèn bảng giá
        // demo
        int countGiaNuoc = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA WHERE dich_vu_id = ?", Integer.class,
                dvNuocThatId);
        assertThat(countGiaNuoc).isEqualTo(0);

        // c) Dịch vụ Internet: Giá tương lai 2026-06-01 (250000.00) -> Vẫn chỉ có 1
        // bảng giá đó
        List<BigDecimal> giaNet = jdbc.query("SELECT don_gia FROM BANG_GIA WHERE dich_vu_id = ?",
                (rs, rowNum) -> rs.getBigDecimal("don_gia"), dvNetThatId);
        assertThat(giaNet).hasSize(1);
        assertThat(giaNet.get(0)).isEqualByComparingTo("250000.00");

        // d) Dịch vụ xe máy trùng tên: Không bảng giá demo nào được chèn vào dvXe1 hay
        // dvXe2
        int countGiaXe2 = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA WHERE dich_vu_id = ?", Integer.class,
                dvXe2Id);
        assertThat(countGiaXe2).isEqualTo(0);

        // e) Dịch vụ demo duy nhất chưa có trong toà ("Vệ sinh & thang máy") được tạo
        // mới an toàn
        int countVeSinh = jdbc.queryForObject(
                "SELECT COUNT(*) FROM DICH_VU WHERE toa_nha_id = 1 AND ten = 'Vệ sinh & thang máy'", Integer.class);
        assertThat(countVeSinh).isEqualTo(1);

        // f) Phòng thật P.101 không bị đổi mô tả và không bị gắn tài sản demo
        String moTaPhong = jdbc.queryForObject("SELECT mo_ta FROM PHONG WHERE id = 777", String.class);
        assertThat(moTaPhong).isEqualTo("Phòng thật cao cấp của khách");
        int countTaiSanPhongThat = jdbc.queryForObject("SELECT COUNT(*) FROM TAI_SAN_PHONG WHERE phong_id = 777",
                Integer.class);
        assertThat(countTaiSanPhongThat).isEqualTo(0);

        // 5. Chạy seed lần 2: Không nhân bản bất kỳ bản ghi nào
        int totalDichVuLan1 = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU", Integer.class);
        int totalBangGiaLan1 = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        seeder.run();

        int totalDichVuLan2 = jdbc.queryForObject("SELECT COUNT(*) FROM DICH_VU", Integer.class);
        int totalBangGiaLan2 = jdbc.queryForObject("SELECT COUNT(*) FROM BANG_GIA", Integer.class);

        assertThat(totalDichVuLan2).isEqualTo(totalDichVuLan1);
        assertThat(totalBangGiaLan2).isEqualTo(totalBangGiaLan1);
    }

    @Test
    @Order(6)
    void test6_demoDataReconciliationService_chiDoc_traUngVienDung() {
        DemoDataReconciliationService recon = new DemoDataReconciliationService(jdbc);
        List<DemoDataReconciliationService.UngVienDoiSoat> candidates = recon.timUngVienCanDoiSoat();

        assertThat(candidates).isNotEmpty();
        for (var c : candidates) {
            assertThat(c.phongId()).isNotNull();
            assertThat(c.soPhong()).isNotBlank();
            if (c.chuaTienToDemo() && !c.coHopDong()) {
                assertThat(c.ghiChuKiemTra()).contains("ỨNG VIÊN DỮ LIỆU MẪU");
            }
        }
    }
}
