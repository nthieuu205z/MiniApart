package com.prj1.ccm.billing;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(HoaDonChiTietIntegrationTest.HoaDonChiTietClockTestConfiguration.class)
class HoaDonChiTietIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final Path STORAGE_ROOT = createStorageRoot();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long kyId;
    private Long hoaDonId;
    private Long nguoiThueId;
    private Long otherNguoiThueId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.anh.storage-root", () -> STORAGE_ROOT.toString());
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("ANH_DINH_KEM");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON_BAC_THANG");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("HOA_DON");
        xoaNeuBangTonTai("NHAN_KHAU_KY");
        xoaNeuBangTonTai("CHI_SO_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("BANG_GIA_BAC_THANG");
        xoaNeuBangTonTai("BANG_GIA");
        xoaNeuBangTonTai("DICH_VU");
        xoaNeuBangTonTai("PHONG");
        xoaNeuBangTonTai("KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA (nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id = 5");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET phien_ban_token = 0, so_lan_sai = 0, lan_sai_dau_tien = NULL, khoa_den = NULL, trang_thai = 'HOAT_DONG' WHERE id IN (1, 2, 3, 4, 5)");
        jdbcTemplate.update("UPDATE TOA_NHA SET so_ngay_han_tt = 7 WHERE id = 1");

        nguoiThueId = jdbcTemplate.queryForObject(
                "INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES ('Nguoi thue 101', DATE '1990-01-01', '0901000101', 'CC101', 'Ha Noi') RETURNING id",
                Long.class
        );
        otherNguoiThueId = jdbcTemplate.queryForObject(
                "INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES ('Nguoi thue 202', DATE '1991-02-02', '0901000202', 'CC202', 'Da Nang') RETURNING id",
                Long.class
        );
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", nguoiThueId);
        Long phongId = jdbcTemplate.queryForObject(
                "INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (1, '101', 1, 25.00, 4, 3500000.00, 'Tieu chuan', 'DANG_THUE') RETURNING id",
                Long.class
        );
        Long hopDongId = jdbcTemplate.queryForObject(
                "INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (?, ?, DATE '2026-07-01', DATE '2026-09-30', 3500000.00, 3500000.00, 30, 'HIEU_LUC') RETURNING id",
                Long.class,
                phongId,
                nguoiThueId
        );
        kyId = jdbcTemplate.queryForObject(
                "INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (1, 2026, 8, DATE '2026-07-28', DATE '2026-08-28', 'DA_CHOT') RETURNING id",
                Long.class
        );
        jdbcTemplate.update("INSERT INTO NHAN_KHAU_KY (ky_id, phong_id, so_nguoi, thoi_diem_chot) VALUES (?, ?, 5, TIMESTAMP '2026-08-28 23:00:00')", kyId, phongId);
        Long dichVuId = jdbcTemplate.queryForObject(
                "INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 'Dien', 'THEO_CHI_SO', 'BAC_THANG', 'kWh', TRUE, TRUE) RETURNING id",
                Long.class
        );
        jdbcTemplate.update("INSERT INTO HOP_DONG_DICH_VU (hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 3500.00)", hopDongId, dichVuId);
        jdbcTemplate.update("INSERT INTO BANG_GIA_BAC_THANG (dich_vu_id, bac, tu_so_luong, den_so_luong, ty_le, don_gia, ngay_hieu_luc) VALUES (?, 1, 0.00, 50.00, 1.00, 3500.00, DATE '2026-07-01'), (?, 2, 51.00, 100.00, 1.00, 4000.00, DATE '2026-07-01')", dichVuId, dichVuId);
        Long chiSoId = jdbcTemplate.queryForObject(
                "INSERT INTO CHI_SO_DICH_VU (ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, co_thay_cong_to, nguoi_ghi_id) VALUES (?, ?, ?, 1240.00, 1350.00, FALSE, 3) RETURNING id",
                Long.class,
                kyId,
                phongId,
                dichVuId
        );
        hoaDonId = jdbcTemplate.queryForObject(
                "INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai, so_nguoi_o, so_ho_quy_doi, giai_thich_so_ho) VALUES ('TN-A-101-202608', ?, ?, DATE '2026-08-31', DATE '2026-09-07', 3889500.00, 0.00, 'DA_PHAT_HANH', 5, 2, '1 ho quy doi cho moi 4 nguoi o') RETURNING id",
                Long.class,
                kyId,
                hopDongId
        );
        Long dongDienId = jdbcTemplate.queryForObject(
                "INSERT INTO CHI_TIET_HOA_DON (hoa_don_id, dich_vu_id, ten_khoan, chi_so_dau, chi_so_cuoi, so_luong, don_gia, thanh_tien, loai_khoan) VALUES (?, ?, 'Tien dien', 1240.00, 1350.00, 110.00, NULL, 390000.00, 'DICH_VU') RETURNING id",
                Long.class,
                hoaDonId,
                dichVuId
        );
        jdbcTemplate.update("INSERT INTO CHI_TIET_HOA_DON (hoa_don_id, ten_khoan, so_luong, don_gia, thanh_tien, loai_khoan) VALUES (?, 'Tien phong (31/31 ngay)', 31.00, 3500000.00, 3500000.00, 'TIEN_PHONG'), (?, 'Lam tron', NULL, NULL, -500.00, 'LAM_TRON')", hoaDonId, hoaDonId);
        jdbcTemplate.update("INSERT INTO CHI_TIET_HOA_DON_BAC_THANG (chi_tiet_hoa_don_id, bac, tu_so_luong, den_so_luong, dinh_muc_quy_doi, so_luong, don_gia, thanh_tien) VALUES (?, 1, 0.00, 50.00, 100.00, 100.00, 3500.00, 350000.00), (?, 2, 51.00, 100.00, 100.00, 10.00, 4000.00, 40000.00)", dongDienId, dongDienId);
        jdbcTemplate.update("INSERT INTO ANH_DINH_KEM (doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc) VALUES ('CHI_SO_DICH_VU', ?, 'meter.jpg', NULL, 'image/jpeg', 4)", chiSoId);
    }

    @Test
    void FR_INV_02_managerReadsHandRecomputableTieredInvoiceWithNegativeRoundingAndSignedMeterLink() throws Exception {
        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maHoaDon").value("TN-A-101-202608"))
                .andExpect(jsonPath("$.soNguoiO").value(5))
                .andExpect(jsonPath("$.soHoQuyDoi").value(2))
                .andExpect(jsonPath("$.giaiThichSoHo", containsString("4 nguoi")))
                .andExpect(jsonPath("$.cacDong", hasSize(3)))
                .andExpect(jsonPath("$.cacDong[0].cacBac", hasSize(2)))
                .andExpect(jsonPath("$.cacDong[0].cacBac[0].tuSoLuong").value("0.00"))
                .andExpect(jsonPath("$.cacDong[0].cacBac[0].denSoLuong").value("50.00"))
                .andExpect(jsonPath("$.cacDong[0].cacBac[0].dinhMucQuyDoi").value("100.00"))
                .andExpect(jsonPath("$.cacDong[0].cacBac[0].donGia").value("3500.00"))
                .andExpect(jsonPath("$.cacDong[0].cacBac[0].thanhTien").value("350000.00"))
                .andExpect(jsonPath("$.cacDong[0].anhCongToUrl").value(containsString("/api/anh/")))
                .andExpect(jsonPath("$.cacDong[0].anhCongToUrl").value(containsString("/xem?")))
                .andExpect(jsonPath("$.cacDong[1].dienGiai", containsString("31/31")))
                .andExpect(jsonPath("$.cacDong[2].thanhTien").value("-500.00"))
                .andExpect(jsonPath("$.tongTien").value("3889500.00"));
    }

    @Test
    void FR_INV_02_overdueDetailUsesCurrentBuildingGraceDaysInsteadOfStoredInvoiceStatus() throws Exception {
        jdbcTemplate.update("UPDATE TOA_NHA SET so_ngay_han_tt = 3 WHERE id = 1");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("QUA_HAN"));
    }

    @Test
    void FR_INV_02_wrongRolesReceive403OnInvoiceDetailEndpoint() throws Exception {
        String thoToken = login(4L, "0900000004");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + thoToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_INV_02_tenantReadsOwnInvoiceDetailAndReceivesSignedMeterLink() throws Exception {
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maHoaDon").value("TN-A-101-202608"))
                .andExpect(jsonPath("$.cacDong[0].anhCongToUrl").value(containsString("/api/anh/")));
    }

    @Test
    void FR_INV_02_otherTenantReceives403OnInvoiceDetailEndpoint() throws Exception {
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", otherNguoiThueId);
        String otherTenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + otherTenantToken))
                .andExpect(status().isForbidden());
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?", passwordHasher.hash(runtimePassword), nguoiDungId);
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(soDienThoai, runtimePassword)))
                .andReturn().getResponse().getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }

    private void xoaNeuBangTonTai(String tenBang) {
        Boolean tonTai = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?)",
                Boolean.class,
                tenBang.toLowerCase()
        );
        if (Boolean.TRUE.equals(tonTai)) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    private static Path createStorageRoot() {
        try {
            return Files.createTempDirectory("miniapart-task8-images-");
        } catch (Exception exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class HoaDonChiTietClockTestConfiguration {
        @Bean
        @Primary
        Clock hoaDonChiTietClock() {
            return Clock.fixed(
                    Instant.parse("2026-09-02T17:00:00Z"),
                    ZoneId.of("Asia/Ho_Chi_Minh")
            );
        }
    }
}
