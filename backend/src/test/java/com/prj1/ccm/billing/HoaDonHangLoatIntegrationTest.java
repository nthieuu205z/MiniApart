package com.prj1.ccm.billing;

import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import({
        HoaDonHangLoatIntegrationTest.KhoanPhatSinhTestConfiguration.class,
        HoaDonHangLoatIntegrationTest.HoaDonLifecycleClockTestConfiguration.class
})
class HoaDonHangLoatIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private TaoHoaDonHangLoatService taoHoaDonHangLoatService;

    @Autowired
    private TinhHoaDonRepository tinhHoaDonRepository;

    private ExecutorService executorService;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("KHOAN_PHAT_SINH");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("HOA_DON");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        xoaNeuBangTonTai("NHAN_KHAU_KY");
        xoaNeuBangTonTai("NGUOI_O_CUNG");
        xoaNeuBangTonTai("CHI_SO_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("DICH_VU");
        xoaNeuBangTonTai("PHONG");
        xoaNeuBangTonTai("KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET phien_ban_token = 0,
                            so_lan_sai = 0,
                            lan_sai_dau_tien = NULL,
                            khoa_den = NULL,
                            trang_thai = 'HOAT_DONG'
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );
        jdbcTemplate.update("UPDATE TOA_NHA SET so_ngay_han_tt = 7 WHERE id = 1");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
        executorService = Executors.newFixedThreadPool(2);
    }

    @AfterEach
    void shutdownExecutor() {
        if (executorService != null) {
            executorService.shutdownNow();
        }
        xoaTriggerEpLoiKhiDanhDauKhoanPhatSinh();
    }

    @Test
    void FR_INV_01_FR_INV_03_FR_INV_07_managerCreatesDraftInvoicesForTwentyRoomsAndReturnsCategorizedSummary() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long dienId = themDichVu(1L, "Dien", "kWh", "THEO_CHI_SO", true, true);
        Long guiXeId = themDichVu(1L, "Gui xe", "xe", "THEO_NGUOI", false, true);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");

        for (int soPhong = 101; soPhong <= 118; soPhong++) {
            Long phongId = themPhong(1L, Integer.toString(soPhong), 1);
            Long nguoiThueId = themNguoiThue("Nguoi thue " + soPhong, "0901000" + soPhong);
            Long hopDongId = themHopDong(phongId, nguoiThueId, soPhong == 101 ? "3499200.00" : "3500000.00",
                    "2026-07-01", "2026-09-30");
            themDichVuHopDong(hopDongId, internetId, "250000.00");
        }

        Long phongThieuChiSoId = themPhong(1L, "119", 1);
        Long hopDongThieuChiSoId = themHopDong(
                phongThieuChiSoId,
                themNguoiThue("Nguoi thue 119", "0901000119"),
                "3500000.00",
                "2026-07-01",
                "2026-09-30"
        );
        themDichVuHopDong(hopDongThieuChiSoId, dienId, "3500.00");

        Long phongThieuNhanKhauId = themPhong(1L, "120", 1);
        Long hopDongThieuNhanKhauId = themHopDong(
                phongThieuNhanKhauId,
                themNguoiThue("Nguoi thue 120", "0901000120"),
                "3500000.00",
                "2026-07-01",
                "2026-09-30"
        );
        themDichVuHopDong(hopDongThieuNhanKhauId, guiXeId, "100000.00");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kyId").value(kyId))
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(18))
                .andExpect(jsonPath("$.soHoaDonDaTonTai").value(0))
                .andExpect(jsonPath("$.soPhongBoQua").value(2))
                .andExpect(jsonPath("$.lyDoBoQua", hasSize(2)))
                .andExpect(jsonPath("$.lyDoBoQua[0].phongId").value(phongThieuChiSoId))
                .andExpect(jsonPath("$.lyDoBoQua[0].ma").value("THIEU_CHI_SO"))
                .andExpect(jsonPath("$.lyDoBoQua[1].phongId").value(phongThieuNhanKhauId))
                .andExpect(jsonPath("$.lyDoBoQua[1].ma").value("KHONG_XAC_DINH_SO_NGUOI_O"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON", Integer.class)).isEqualTo(18);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE trang_thai = 'NHAP'", Integer.class))
                .isEqualTo(18);

        Long hoaDon101Id = jdbcTemplate.queryForObject(
                "SELECT id FROM HOA_DON WHERE ma_hoa_don = 'TN-A-101-202608'",
                Long.class
        );
        assertThat(hoaDon101Id).isNotNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = 'GTGT'",
                Integer.class,
                hoaDon101Id
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = 'Tien phong (31/31 ngay)'",
                Integer.class,
                hoaDon101Id
        )).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT don_gia FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = 'Internet'",
                BigDecimal.class,
                hoaDon101Id
        )).isEqualByComparingTo("250000.00");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT thanh_tien FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = 'Lam tron'",
                BigDecimal.class,
                hoaDon101Id
        )).isEqualByComparingTo("-200.00");
    }

    @Test
    void FR_INV_01_FR_INV_03_missingApplicableTieredPriceSkipsOneRoomAndCommitsOtherRooms() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long dienBacThangId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (1, 'Dien bac thang thieu gia', 'THEO_CHI_SO', 'BAC_THANG', 'kWh', TRUE, TRUE)
                        RETURNING id
                        """,
                Long.class
        );
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");

        Long phongThieuBangGiaId = themPhong(1L, "101", 1);
        Long hopDongThieuBangGiaId = themHopDong(
                phongThieuBangGiaId,
                themNguoiThue("Nguoi thue thieu bang gia", "0904000101"),
                "3500000.00",
                "2026-07-01",
                "2026-09-30"
        );
        themDichVuHopDong(hopDongThieuBangGiaId, dienBacThangId, "3500.00");
        themChiSo(kyId, phongThieuBangGiaId, dienBacThangId, "100.00", "110.00");

        Long phongHopLeId = themPhong(1L, "102", 1);
        Long hopDongHopLeId = themHopDong(
                phongHopLeId,
                themNguoiThue("Nguoi thue hop le", "0904000102"),
                "3500000.00",
                "2026-07-01",
                "2026-09-30"
        );
        themDichVuHopDong(hopDongHopLeId, internetId, "250000.00");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(1))
                .andExpect(jsonPath("$.soHoaDonDaTonTai").value(0))
                .andExpect(jsonPath("$.soPhongBoQua").value(1))
                .andExpect(jsonPath("$.lyDoBoQua", hasSize(1)))
                .andExpect(jsonPath("$.lyDoBoQua[0].phongId").value(phongThieuBangGiaId))
                .andExpect(jsonPath("$.lyDoBoQua[0].ma").value("THIEU_BANG_GIA"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HOA_DON WHERE ma_hoa_don = 'TN-A-102-202608'",
                Integer.class
        )).isEqualTo(1);
    }

    @Test
    void FR_INV_04_secondBulkRunDoesNotCreateDuplicatesAndReportsExistingInvoiceCount() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long phongId = themPhong(1L, "101", 1);
        Long nguoiThueId = themNguoiThue("Nguoi thue 101", "0902000101");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "3500000.00", "2026-07-01", "2026-09-30");
        themDichVuHopDong(hopDongId, internetId, "250000.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(1))
                .andExpect(jsonPath("$.soHoaDonDaTonTai").value(0))
                .andExpect(jsonPath("$.soPhongBoQua").value(0));

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(0))
                .andExpect(jsonPath("$.soHoaDonDaTonTai").value(1))
                .andExpect(jsonPath("$.soPhongBoQua").value(0))
                .andExpect(jsonPath("$.lyDoBoQua", hasSize(0)));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON",
                Integer.class
        )).isEqualTo(3);
    }

    @Test
    void FR_INV_04_FR_INV_07_databaseRejectsDuplicateInvoiceCodeAndDuplicateContractPeriod() {
        Long phong101 = themPhong(1L, "101", 1);
        Long phong102 = themPhong(1L, "102", 1);
        Long nguoiThue101 = themNguoiThue("Nguoi thue 101", "0903000101");
        Long nguoiThue102 = themNguoiThue("Nguoi thue 102", "0903000102");
        Long hopDong101 = themHopDong(phong101, nguoiThue101, "3500000.00", "2026-07-01", "2026-09-30");
        Long hopDong102 = themHopDong(phong102, nguoiThue102, "3500000.00", "2026-07-01", "2026-09-30");
        Long kyThangTam = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long kyThangChin = themKyThanhToan(1L, 2026, 9, "2026-08-29", "2026-09-28", "DA_CHOT");

        chenHoaDon("TN-A-101-202608", kyThangTam, hopDong101);

        assertThatThrownBy(() -> chenHoaDon("TN-A-101-202608", kyThangChin, hopDong102))
                .isInstanceOf(DataIntegrityViolationException.class);

        assertThatThrownBy(() -> chenHoaDon("TN-A-102-202608", kyThangTam, hopDong101))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void FR_INV_05_CR_008_pendingExtraAppearsInFirstOfTwoConsecutiveInvoiceRunsOnly() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long phongId = themPhong(1L, "101", 1);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 101", "0905000101"),
                "3500000.00", "2026-07-01", "2026-10-31");
        themDichVuHopDong(hopDongId, internetId, "250000.00");
        Long kyThangTam = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DA_CHOT");
        Long kyThangChin = themKyThanhToan(1L, 2026, 9, "2026-08-29", "2026-09-28", "DANG_MO");

        taoKhoanPhatSinh(managerToken, hopDongId, "Tien sua cua kinh", "125000.00", "PHAT_SINH", "SUA_CHUA", 101L);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyThangTam))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(1))
                .andExpect(jsonPath("$.soHoaDonDaTonTai").value(0));

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyThangChin))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(1))
                .andExpect(jsonPath("$.soHoaDonDaTonTai").value(0));

        Long hoaDonTamId = idHoaDonTheoMa("TN-A-101-202608");
        Long hoaDonChinId = idHoaDonTheoMa("TN-A-101-202609");

        assertThat(hoaDonTamId).isNotNull();
        assertThat(hoaDonChinId).isNotNull();
        assertThat(soDongTheoTenKhoan(hoaDonTamId, "Tien sua cua kinh")).isEqualTo(1);
        assertThat(soDongTheoTenKhoan(hoaDonChinId, "Tien sua cua kinh")).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                String.class,
                hopDongId
        )).isEqualTo("DA_TINH");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT hoa_don_id FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                Long.class,
                hopDongId
        )).isEqualTo(hoaDonTamId);
    }

    @Test
    void FR_INV_05_CR_008_discountExtraIsStoredAndPrintedAsNegativeInvoiceLine() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long phongId = themPhong(1L, "102", 1);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 102", "0905000102"),
                "3500000.00", "2026-07-01", "2026-09-30");
        themDichVuHopDong(hopDongId, internetId, "250000.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");

        taoKhoanPhatSinh(managerToken, hopDongId, "Giam tru mat internet", "150000.00", "GIAM_TRU", "PHAT", 301L);

        assertThat(jdbcTemplate.queryForObject(
                "SELECT so_tien FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                BigDecimal.class,
                hopDongId
        )).isEqualByComparingTo("-150000.00");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonTaoMoi").value(1));

        Long hoaDonId = idHoaDonTheoMa("TN-A-102-202608");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT thanh_tien FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = 'Giam tru mat internet'",
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo("-150000.00");
    }

    @Test
    void FR_INV_05_CR_008_invalidSourceIsRejectedByApplication() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long hopDongId = themHopDong(themPhong(1L, "103", 1), themNguoiThue("Nguoi thue 103", "0905000103"),
                "3500000.00", "2026-07-01", "2026-10-31");

        mockMvc.perform(post("/api/hop-dong/%s/khoan-phat-sinh".formatted(hopDongId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(khoanPhatSinhPayload("Tien phat xa rac", "300000.00", "PHAT_SINH", "PHAT", 999L)))
                .andExpect(status().isBadRequest());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KHOAN_PHAT_SINH", Integer.class)).isZero();
    }

    @Test
    void FR_INV_05_CR_008_failedDraftInvoiceTransactionRestoresPendingExtraState() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long phongId = themPhong(1L, "104", 1);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 104", "0905000104"),
                "3500000.00", "2026-07-01", "2026-10-31");
        themDichVuHopDong(hopDongId, internetId, "250000.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");

        taoKhoanPhatSinh(managerToken, hopDongId, "Tien sua den hanh lang", "200000.00", "PHAT_SINH", "SUA_CHUA", 102L);
        taoTriggerEpLoiKhiDanhDauKhoanPhatSinh();

        assertThatThrownBy(() -> taoHoaDonHangLoatService.taoHoaDonHangLoat(1L, kyId, nguoiQuanLy()))
                .isInstanceOf(Exception.class);

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                String.class,
                hopDongId
        )).isEqualTo("CHO_TINH");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT hoa_don_id FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                Long.class,
                hopDongId
        )).isNull();
    }

    @Test
    void FR_INV_05_CR_008_cancelingDraftInvoiceRestoresPendingExtraQueue() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long phongId = themPhong(1L, "105", 1);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 105", "0905000105"),
                "3500000.00", "2026-07-01", "2026-10-31");
        themDichVuHopDong(hopDongId, internetId, "250000.00");
        Long kyThangTam = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DA_CHOT");
        Long kyThangChin = themKyThanhToan(1L, 2026, 9, "2026-08-29", "2026-09-28", "DANG_MO");

        taoKhoanPhatSinh(managerToken, hopDongId, "Tien boi thuong", "275000.00", "PHAT_SINH", "DEN_BU", 201L);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyThangTam))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        Long hoaDonId = idHoaDonTheoMa("TN-A-105-202608");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/huy".formatted(kyThangTam, hoaDonId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                String.class,
                hopDongId
        )).isEqualTo("CHO_TINH");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT hoa_don_id FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                Long.class,
                hopDongId
        )).isNull();

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/tao-hang-loat".formatted(kyThangChin))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        Long hoaDonThangChinId = idHoaDonTheoMa("TN-A-105-202609");
        assertThat(soDongTheoTenKhoan(hoaDonThangChinId, "Tien boi thuong")).isEqualTo(1);
    }

    @Test
    void FR_INV_05_CR_008_concurrentDraftGenerationAcrossPeriodsCannotDoubleConsumePendingExtra() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long internetId = themDichVu(1L, "Internet", "thang", "CO_DINH", false, true);
        Long phongId = themPhong(1L, "106", 1);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 106", "0905000106"),
                "3500000.00", "2026-07-01", "2026-10-31");
        themDichVuHopDong(hopDongId, internetId, "250000.00");
        Long kyThangTam = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DA_CHOT");
        Long kyThangChin = themKyThanhToan(1L, 2026, 9, "2026-08-29", "2026-09-28", "DANG_MO");

        taoKhoanPhatSinh(managerToken, hopDongId, "Tien sua cua cuon", "500000.00", "PHAT_SINH", "SUA_CHUA", 102L);

        CountDownLatch batDauCungLuc = new CountDownLatch(1);
        Future<ThongTinTaoHoaDonHangLoat> ketQuaThangTam = executorService.submit(() -> {
            batDauCungLuc.await(5, TimeUnit.SECONDS);
            return taoHoaDonHangLoatService.taoHoaDonHangLoat(1L, kyThangTam, nguoiQuanLy());
        });
        Future<ThongTinTaoHoaDonHangLoat> ketQuaThangChin = executorService.submit(() -> {
            batDauCungLuc.await(5, TimeUnit.SECONDS);
            return taoHoaDonHangLoatService.taoHoaDonHangLoat(1L, kyThangChin, nguoiQuanLy());
        });

        batDauCungLuc.countDown();

        assertThat(ketQuaThangTam.get(10, TimeUnit.SECONDS).soHoaDonTaoMoi()).isEqualTo(1);
        assertThat(ketQuaThangChin.get(10, TimeUnit.SECONDS).soHoaDonTaoMoi()).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE ten_khoan = 'Tien sua cua cuon'",
                Integer.class
        )).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KHOAN_PHAT_SINH WHERE hop_dong_id = ?",
                String.class,
                hopDongId
        )).isEqualTo("DA_TINH");
    }

    @Test
    void FR_INV_05_BR_08_draftInvoiceAcceptsManualSurchargeAndReductionWithReasons() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "201", 2);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 201", "0907000201"),
                "3500000.00", "2026-07-01", "2026-09-30");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long hoaDonId = chenHoaDon("TN-A-201-202608", kyId, hopDongId);

        themNoiDungHoaDon(managerToken, kyId, hoaDonId,
                "Tien thay remote cong", "120000.00", "PHAT_SINH", "Nguoi thue lam mat remote");
        themNoiDungHoaDon(managerToken, kyId, hoaDonId,
                "Giam tru mat nuoc 2 gio", "45000.00", "GIAM_TRU", "Su co do toa nha");

        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT thanh_tien
                        FROM CHI_TIET_HOA_DON
                        WHERE hoa_don_id = ? AND ten_khoan = 'Tien thay remote cong'
                        """,
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo("120000.00");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT thanh_tien
                        FROM CHI_TIET_HOA_DON
                        WHERE hoa_don_id = ? AND ten_khoan = 'Giam tru mat nuoc 2 gio'
                        """,
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo("-45000.00");
        assertThat(jdbcTemplate.queryForList(
                """
                        SELECT ly_do
                        FROM CHI_TIET_HOA_DON
                        WHERE hoa_don_id = ? AND loai_khoan = 'KHOAN_PHAT_SINH'
                        ORDER BY id
                        """,
                String.class,
                hoaDonId
        )).containsExactly("Nguoi thue lam mat remote", "Su co do toa nha");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tong_tien FROM HOA_DON WHERE id = ?",
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo("3825000.00");
    }

    @Test
    void FR_INV_05_BR_08_rejectsContentEditAfterInvoiceIsReleasedThroughApi() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "202", 2);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 202", "0907000202"),
                "3500000.00", "2026-07-01", "2026-09-30");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long hoaDonId = chenHoaDon("TN-A-202-202608", kyId, hopDongId);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/phat-hanh".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/noi-dung".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noiDungHoaDonPayload("Tien phat tre", "80000.00", "PHAT_SINH", "Nop tien tre")))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = 'Tien phat tre'",
                Integer.class,
                hoaDonId
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT tong_tien FROM HOA_DON WHERE id = ?",
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo("3750000.00");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM HOA_DON WHERE id = ?",
                String.class,
                hoaDonId
        )).isEqualTo("DA_PHAT_HANH");
    }

    @Test
    void FR_INV_06_BR_08_ownerCancelsReleasedInvoiceWithMandatoryReasonAndAuditEntry() throws Exception {
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        String ownerToken = login(2L, "0900000002");
        Long phongId = themPhong(1L, "203", 2);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 203", "0907000203"),
                "3500000.00", "2026-07-01", "2026-09-30");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long hoaDonId = chenHoaDon("TN-A-203-202608", kyId, hopDongId);
        jdbcTemplate.update("UPDATE HOA_DON SET trang_thai = 'DA_PHAT_HANH' WHERE id = ?", hoaDonId);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/huy".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(huyHoaDonPayload("Sai bang gia ap dung")))
                .andExpect(status().isNoContent());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM HOA_DON WHERE id = ?",
                String.class,
                hoaDonId
        )).isEqualTo("DA_HUY");
        assertThat(jdbcTemplate.queryForMap(
                """
                        SELECT nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau, ly_do
                        FROM NHAT_KY_THAO_TAC
                        WHERE doi_tuong = ?
                        """,
                "HOA_DON:" + hoaDonId
        )).containsEntry("nguoi_dung_id", 2L)
                .containsEntry("hanh_dong", "HUY_HOA_DON")
                .containsEntry("gia_tri_truoc", "DA_PHAT_HANH")
                .containsEntry("gia_tri_sau", "DA_HUY")
                .containsEntry("ly_do", "Sai bang gia ap dung");
    }

    @Test
    void FR_INV_06_BR_08_rejectsReleasedInvoiceCancelWithoutReason() throws Exception {
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        String ownerToken = login(2L, "0900000002");
        Long hoaDonId = hoaDonDaPhatHanh("204", "0907000204");
        Long kyId = jdbcTemplate.queryForObject("SELECT ky_id FROM HOA_DON WHERE id = ?", Long.class, hoaDonId);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/huy".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(huyHoaDonPayload("   ")))
                .andExpect(status().isBadRequest());

        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId))
                .isEqualTo("DA_PHAT_HANH");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NHAT_KY_THAO_TAC", Integer.class)).isZero();
    }

    @Test
    void FR_INV_06_BR_08_rejectsManagerCancelOfReleasedInvoiceWith403() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long hoaDonId = hoaDonDaPhatHanh("205", "0907000205");
        Long kyId = jdbcTemplate.queryForObject("SELECT ky_id FROM HOA_DON WHERE id = ?", Long.class, hoaDonId);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/huy".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(huyHoaDonPayload("Can huy hoa don")))
                .andExpect(status().isForbidden());

        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId))
                .isEqualTo("DA_PHAT_HANH");
    }

    @Test
    void FR_INV_06_BR_08_paidInvoiceCannotTransitionBackwardThroughCancelApi() throws Exception {
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        String ownerToken = login(2L, "0900000002");
        Long hoaDonId = hoaDonDaPhatHanh("207", "0907000207");
        Long kyId = jdbcTemplate.queryForObject("SELECT ky_id FROM HOA_DON WHERE id = ?", Long.class, hoaDonId);
        jdbcTemplate.update("UPDATE HOA_DON SET trang_thai = 'DA_THANH_TOAN', da_thu = tong_tien WHERE id = ?", hoaDonId);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/huy".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(huyHoaDonPayload("Sai hoa don da thanh toan")))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId))
                .isEqualTo("DA_THANH_TOAN");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NHAT_KY_THAO_TAC", Integer.class)).isZero();
    }

    @Test
    void FR_INV_06_BR_08_overdueStatusUsesStoredInvoiceDueDateInsteadOfBuildingGraceDays() {
        Long phongId = themPhong(1L, "206", 2);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue 206", "0907000206"),
                "3500000.00", "2026-07-01", "2026-09-30");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long hoaDonId = chenHoaDon("TN-A-206-202608", kyId, hopDongId);
        jdbcTemplate.update(
                """
                        UPDATE HOA_DON
                        SET trang_thai = 'DA_PHAT_HANH',
                            han_thanh_toan = DATE '2026-09-30'
                        WHERE id = ?
                        """,
                hoaDonId
        );
        jdbcTemplate.update("UPDATE TOA_NHA SET so_ngay_han_tt = 3 WHERE id = 1");

        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon = tinhHoaDonRepository
                .timHoaDonTrongPhamVi(1L, kyId, hoaDonId)
                .orElseThrow();

        assertThat(hoaDon.trangThai()).isEqualTo(com.prj1.ccm.billing.calc.TrangThaiHoaDon.DA_PHAT_HANH);
    }

    private Long themKyThanhToan(
            Long toaNhaId,
            int nam,
            int thang,
            String ngayBatDau,
            String ngayKetThuc,
            String trangThai
    ) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                nam,
                thang,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc),
                trangThai
        );
    }

    private Long themPhong(Long toaNhaId, String soPhong, int tang) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, ?, 20.00, 4, 3500000.00, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                tang
        );
    }

    private Long themDichVu(Long toaNhaId, String ten, String donVi, String cachTinh, boolean laDien, boolean dangSuDung) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, ?, 'CO_DINH', ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten,
                cachTinh,
                donVi,
                laDien,
                dangSuDung
        );
    }

    private Long themNguoiThue(String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, DATE '1995-01-01', ?, ?, 'TP HCM', 'HOAT_DONG')
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                soDienThoai + "01"
        );
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, String giaThue, String ngayBatDau, String ngayKetThuc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?, ?, ?, 3500000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc),
                new BigDecimal(giaThue)
        );
    }

    private void themDichVuHopDong(Long hopDongId, Long dichVuId, String donGia) {
        jdbcTemplate.update(
                """
                        INSERT INTO HOP_DONG_DICH_VU (hop_dong_id, dich_vu_id, don_gia_ap_dung)
                        VALUES (?, ?, ?)
                        """,
                hopDongId,
                dichVuId,
                new BigDecimal(donGia)
        );
    }

    private void themChiSo(Long kyId, Long phongId, Long dichVuId, String chiSoDau, String chiSoCuoi) {
        jdbcTemplate.update(
                """
                        INSERT INTO CHI_SO_DICH_VU (
                            ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, nguoi_ghi_id, thoi_diem_ghi
                        )
                        VALUES (?, ?, ?, ?, ?, 3, CURRENT_TIMESTAMP)
                        """,
                kyId,
                phongId,
                dichVuId,
                new BigDecimal(chiSoDau),
                new BigDecimal(chiSoCuoi)
        );
    }

    private Long chenHoaDon(String maHoaDon, Long kyId, Long hopDongId) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES (?, ?, ?, DATE '2026-08-31', DATE '2026-09-07', 3750000.00, 0.00, 'NHAP')
                        RETURNING id
                        """,
                Long.class,
                maHoaDon,
                kyId,
                hopDongId
        );
    }

    private void xoaNeuBangTonTai(String tenBang) {
        Boolean tonTai = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                              AND table_name = ?
                        )
                        """,
                Boolean.class,
                tenBang.toLowerCase()
        );
        if (Boolean.TRUE.equals(tonTai)) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    private void taoTriggerEpLoiKhiDanhDauKhoanPhatSinh() {
        jdbcTemplate.execute(
                """
                        CREATE OR REPLACE FUNCTION task6_fail_pending_extra_mark()
                        RETURNS trigger
                        LANGUAGE plpgsql
                        AS $$
                        BEGIN
                            RAISE EXCEPTION 'forced rollback while marking pending extra';
                        END;
                        $$
                        """
        );
        jdbcTemplate.execute(
                """
                        CREATE TRIGGER task6_fail_pending_extra_mark
                        AFTER UPDATE OF trang_thai, hoa_don_id ON KHOAN_PHAT_SINH
                        FOR EACH ROW
                        WHEN (NEW.trang_thai = 'DA_TINH')
                        EXECUTE FUNCTION task6_fail_pending_extra_mark()
                        """
        );
    }

    private void xoaTriggerEpLoiKhiDanhDauKhoanPhatSinh() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS task6_fail_pending_extra_mark ON KHOAN_PHAT_SINH");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS task6_fail_pending_extra_mark()");
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(runtimePassword),
                nguoiDungId
        );

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(soDienThoai, runtimePassword)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }

    private void taoKhoanPhatSinh(
            String token,
            Long hopDongId,
            String tenKhoan,
            String soTien,
            String loai,
            String nguonLoai,
            Long nguonId
    ) throws Exception {
        mockMvc.perform(post("/api/hop-dong/%s/khoan-phat-sinh".formatted(hopDongId))
                        .header("Authorization", "Bearer " + token)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(khoanPhatSinhPayload(tenKhoan, soTien, loai, nguonLoai, nguonId)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"));
    }

    private String khoanPhatSinhPayload(String tenKhoan, String soTien, String loai, String nguonLoai, Long nguonId) {
        return """
                {
                  "nguonLoai": "%s",
                  "nguonId": %d,
                  "tenKhoan": "%s",
                  "soTien": "%s",
                  "loai": "%s"
                }
                """.formatted(nguonLoai, nguonId, tenKhoan, soTien, loai);
    }

    private Long idHoaDonTheoMa(String maHoaDon) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM HOA_DON WHERE ma_hoa_don = ?",
                Long.class,
                maHoaDon
        );
    }

    private Integer soDongTheoTenKhoan(Long hoaDonId, String tenKhoan) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE hoa_don_id = ? AND ten_khoan = ?",
                Integer.class,
                hoaDonId,
                tenKhoan
        );
    }

    private void themNoiDungHoaDon(
            String token,
            Long kyId,
            Long hoaDonId,
            String tenKhoan,
            String soTien,
            String loai,
            String lyDo
    ) throws Exception {
        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/noi-dung".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noiDungHoaDonPayload(tenKhoan, soTien, loai, lyDo)))
                .andExpect(status().isCreated());
    }

    private String noiDungHoaDonPayload(String tenKhoan, String soTien, String loai, String lyDo) {
        return """
                {
                  "tenKhoan": "%s",
                  "soTien": "%s",
                  "loai": "%s",
                  "lyDo": "%s"
                }
                """.formatted(tenKhoan, soTien, loai, lyDo);
    }

    private String huyHoaDonPayload(String lyDo) {
        return """
                {
                  "lyDo": "%s"
                }
                """.formatted(lyDo);
    }

    private Long hoaDonDaPhatHanh(String soPhong, String soDienThoai) {
        Long phongId = themPhong(1L, soPhong, 2);
        Long hopDongId = themHopDong(phongId, themNguoiThue("Nguoi thue " + soPhong, soDienThoai),
                "3500000.00", "2026-07-01", "2026-09-30");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long hoaDonId = chenHoaDon("TN-A-" + soPhong + "-202608", kyId, hopDongId);
        jdbcTemplate.update("UPDATE HOA_DON SET trang_thai = 'DA_PHAT_HANH' WHERE id = ?", hoaDonId);
        return hoaDonId;
    }

    private NguoiDung nguoiQuanLy() {
        return new NguoiDung(3L, "Quan ly", "0900000003", "hash", VaiTro.QUAN_LY, TrangThaiNguoiDung.HOAT_DONG, 0, null);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class KhoanPhatSinhTestConfiguration {
        @Bean
        NguonKhoanPhatSinhValidator nguonSuaChuaValidator() {
            return new NguonKhoanPhatSinhValidator() {
                @Override
                public NguonKhoanPhatSinh nguonLoai() {
                    return NguonKhoanPhatSinh.SUA_CHUA;
                }

                @Override
                public boolean tonTai(Long nguonId) {
                    return List.of(101L, 102L).contains(nguonId);
                }
            };
        }

        @Bean
        NguonKhoanPhatSinhValidator nguonDenBuValidator() {
            return new NguonKhoanPhatSinhValidator() {
                @Override
                public NguonKhoanPhatSinh nguonLoai() {
                    return NguonKhoanPhatSinh.DEN_BU;
                }

                @Override
                public boolean tonTai(Long nguonId) {
                    return List.of(201L).contains(nguonId);
                }
            };
        }

        @Bean
        NguonKhoanPhatSinhValidator nguonPhatValidator() {
            return new NguonKhoanPhatSinhValidator() {
                @Override
                public NguonKhoanPhatSinh nguonLoai() {
                    return NguonKhoanPhatSinh.PHAT;
                }

                @Override
                public boolean tonTai(Long nguonId) {
                    return List.of(301L).contains(nguonId);
                }
            };
        }

    }

    @TestConfiguration(proxyBeanMethods = false)
    static class HoaDonLifecycleClockTestConfiguration {
        @Bean
        @Primary
        Clock hoaDonLifecycleClock() {
            return Clock.fixed(
                    Instant.parse("2026-09-02T17:00:00Z"),
                    ZoneId.of("Asia/Ho_Chi_Minh")
            );
        }
    }
}
