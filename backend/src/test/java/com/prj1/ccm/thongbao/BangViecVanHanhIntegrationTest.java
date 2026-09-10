package com.prj1.ccm.thongbao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.test.context.TestConfiguration;
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
import java.time.LocalDate;
import java.time.ZoneId;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(BangViecVanHanhIntegrationTest.DashboardClockConfiguration.class)
class BangViecVanHanhIntegrationTest {
    private static final Instant NOW = Instant.parse("2040-08-15T03:00:00Z");
    private static final LocalDate TODAY = LocalDate.of(2040, 8, 15);
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM THANH_TOAN");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON");
        jdbcTemplate.update("DELETE FROM HOA_DON");
        jdbcTemplate.update("DELETE FROM CHI_SO_DICH_VU");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM KHOAN_PHAT_SINH");
        jdbcTemplate.update("DELETE FROM YEU_CAU_SUA_CHUA");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET phien_ban_token = 0, so_lan_sai = 0, lan_sai_dau_tien = NULL, khoa_den = NULL, trang_thai = 'HOAT_DONG', nguoi_thue_id = NULL WHERE id IN (1, 2, 3, 4, 5)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1), (3, 1)");
    }

    @Test
    void FR_NTF_01_BR_14_managerGetsFourActionableGroupsAndExplicitPcccSourceStatus() throws Exception {
        Long roomId = themPhong(1L, "801");
        Long tenantId = themNguoiThue("Nguoi thue bang viec", "0908000001");
        Long contractId = themHopDong(roomId, tenantId, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        Long meterServiceId = themDichVu(1L, "Dien bang viec", "THEO_CHI_SO", true);
        themDichVuHopDong(contractId, meterServiceId);
        Long periodId = themKy(1L, TODAY.minusDays(30), TODAY, "DANG_MO");
        themHoaDon(periodId, contractId, TODAY.minusDays(1), "DA_PHAT_HANH", "100000.00", "0.00");
        themRepair(roomId, TODAY.atStartOfDay(ZoneId.of("UTC")).toInstant().minusSeconds(48 * 60 * 60 + 1), "MOI_TIEP_NHAN", null);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1/bang-viec")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toaNhaId").value(1))
                .andExpect(jsonPath("$.nhomViec", hasSize(5)))
                .andExpect(jsonPath("$.nhomViec[0].ma").value("NO_QUA_HAN"))
                .andExpect(jsonPath("$.nhomViec[0].soLuong").value(1))
                .andExpect(jsonPath("$.nhomViec[0].trangThai").value("CAN_XU_LY"))
                .andExpect(jsonPath("$.nhomViec[0].lienKet").value("/hoa-don?toaNhaId=1&trangThai=QUA_HAN"))
                .andExpect(jsonPath("$.nhomViec[1].ma").value("THIEU_CHI_SO"))
                .andExpect(jsonPath("$.nhomViec[1].soLuong").value(1))
                .andExpect(jsonPath("$.nhomViec[1].lienKet").value("/ghi-chi-so?toaNhaId=1"))
                .andExpect(jsonPath("$.nhomViec[2].ma").value("HOP_DONG_SAP_HET_HAN"))
                .andExpect(jsonPath("$.nhomViec[2].soLuong").value(1))
                .andExpect(jsonPath("$.nhomViec[2].lienKet").value("/hop-dong?toaNhaId=1&sapHetHan=true"))
                .andExpect(jsonPath("$.nhomViec[3].ma").value("SU_CO_TON_DONG"))
                .andExpect(jsonPath("$.nhomViec[3].soLuong").value(1))
                .andExpect(jsonPath("$.nhomViec[3].lienKet").value("/su-co?toaNhaId=1&boLoc=TON_DONG_QUA_48_GIO"))
                .andExpect(jsonPath("$.nhomViec[4].ma").value("PCCC"))
                .andExpect(jsonPath("$.nhomViec[4].soLuong").value(nullValue()))
                .andExpect(jsonPath("$.nhomViec[4].trangThai").value("CHUA_SAN_SANG"))
                .andExpect(jsonPath("$.nhomViec[4].tenTrangThai").value(containsString("Chưa triển khai nguồn kiểm tra PCCC")));
    }

    @Test
    void FR_NTF_01_BR_14_dashboardKeepsBoundaryRecordsAndMarksEmptyGroupsDone() throws Exception {
        Long room30 = themPhong(1L, "802");
        Long room31 = themPhong(1L, "803");
        Long tenant30 = themNguoiThue("Nguoi thue 30", "0908000002");
        Long tenant31 = themNguoiThue("Nguoi thue 31", "0908000003");
        Long contract30 = themHopDong(room30, tenant30, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        Long contract31 = themHopDong(room31, tenant31, TODAY.minusDays(30), TODAY.plusDays(31), "HIEU_LUC");
        Long period30 = themKy(1L, TODAY.minusDays(60), TODAY.minusDays(30), "DA_CHOT");
        themHoaDon(period30, contract30, TODAY.minusDays(2), "DA_HUY", "100000.00", "0.00");
        Long period31 = themKy(1L, TODAY.minusDays(90), TODAY.minusDays(60), "DA_CHOT");
        themHoaDon(period31, contract31, TODAY, "DA_PHAT_HANH", "100000.00", "0.00");
        themRepair(room30, NOW.minusSeconds(48 * 60 * 60), "MOI_TIEP_NHAN", null);
        themRepair(room31, NOW.minusSeconds(48 * 60 * 60 + 1), "DA_DONG", null);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/toa-nha/1/bang-viec")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nhomViec[0].soLuong").value(0))
                .andExpect(jsonPath("$.nhomViec[0].trangThai").value("DA_XONG"))
                .andExpect(jsonPath("$.nhomViec[2].soLuong").value(1))
                .andExpect(jsonPath("$.nhomViec[3].soLuong").value(0))
                .andExpect(jsonPath("$.nhomViec[3].trangThai").value("DA_XONG"));
    }

    @Test
    void FR_NTF_01_dashboardEnforcesBuildingScopeAndDefaultDeny() throws Exception {
        String managerToken = login(3L, "0900000003");
        String tenantToken = login(5L, "0900000006");
        String adminToken = login(1L, "0900000001");

        mockMvc.perform(get("/api/toa-nha/2/bang-viec")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/toa-nha/1/bang-viec")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/toa-nha/1/bang-viec")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/toa-nha/1/bang-viec"))
                .andExpect(status().isUnauthorized());
    }

    @TestConfiguration
    static class DashboardClockConfiguration {
        @Bean
        @Primary
        Clock dashboardClock() {
            return Clock.fixed(NOW, ZONE);
        }
    }

    private String login(Long userId, String phone) throws Exception {
        return mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"" + phone + "\",\"matKhau\":\"MatKhau@123\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()
                .replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (?, ?, 8, 22.50, 4, 3500000.00, 'Studio', 'DANG_THUE') RETURNING id",
                Long.class, toaNhaId, soPhong);
    }

    private Long themNguoiThue(String hoTen, String phone) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (?, DATE '1990-01-01', ?, ?, 'Viet Nam') RETURNING id",
                Long.class, hoTen, phone, "CC-" + phone);
    }

    private Long themHopDong(Long roomId, Long tenantId, LocalDate start, LocalDate end, String status) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (?, ?, ?, ?, 3500000.00, 3500000.00, 30, ?) RETURNING id",
                Long.class, roomId, tenantId, start, end, status);
    }

    private Long themDichVu(Long toaNhaId, String ten, String cachTinh, boolean laDien) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (?, ?, ?, 'CO_DINH', 'kWh', ?, TRUE) RETURNING id",
                Long.class, toaNhaId, ten, cachTinh, laDien);
    }

    private void themDichVuHopDong(Long contractId, Long serviceId) {
        jdbcTemplate.update("INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, ?)", contractId, serviceId, new BigDecimal("3500.00"));
    }

    private Long themKy(Long toaNhaId, LocalDate start, LocalDate end, String status) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (?, 2040, ?, ?, ?, ?) RETURNING id",
                Long.class, toaNhaId, end.getMonthValue(), start, end, status);
    }

    private Long themHoaDon(Long periodId, Long contractId, LocalDate dueDate, String status, String total, String paid) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id",
                Long.class, "HD-" + periodId + "-" + contractId, periodId, contractId, dueDate.minusDays(10), dueDate, new BigDecimal(total), new BigDecimal(paid), status);
    }

    private Long themRepair(Long roomId, Instant createdAt, String status, Instant confirmationAt) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO YEU_CAU_SUA_CHUA(phong_id, nguoi_tao_id, hang_muc, mo_ta, muc_do, trang_thai, cho_xac_nhan_luc, tao_luc) VALUES (?, 3, 'Dien', 'Kiem tra', 'GAP', ?, ?, ?) RETURNING id",
                Long.class, roomId, status, confirmationAt == null ? null : java.sql.Timestamp.from(confirmationAt), java.sql.Timestamp.from(createdAt));
    }
}
