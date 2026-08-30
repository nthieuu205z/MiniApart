package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ChiSoDichVuIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.update("DELETE FROM CHI_SO_DICH_VU");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update("""
                UPDATE NGUOI_DUNG
                SET phien_ban_token = 0,
                    so_lan_sai = 0,
                    lan_sai_dau_tien = NULL,
                    khoa_den = NULL,
                    trang_thai = 'HOAT_DONG'
                WHERE id IN (1, 2, 3, 4, 5)
                """);
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA (nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA (nguoi_dung_id, toa_nha_id) VALUES (3, 1)");
    }

    @Test
    void FR_MTR_01_managerSeesOnlyRoomsWithActiveContractsAndPreviousReadings() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000099");
        Long phongDangThu = themPhong(1L, "101", 1);
        Long phongTrong = themPhong(1L, "201", 2);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long hopDongId = themHopDong(phongDangThu, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongDangThu, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongPhong").value(1))
                .andExpect(jsonPath("$.daGhi").value(0))
                .andExpect(jsonPath("$.phong[0].soPhong").value("101"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].tenDichVu").value("Điện sinh hoạt"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoDau").value("1240.00"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoCuoi").doesNotExist())
                .andExpect(jsonPath("$.phong[0].dichVu[0].mucTieuThu").doesNotExist());
    }

    @Test
    void FR_MTR_01_managerSeesOpeningReadingAsZeroWhenNoPreviousPeriodExists() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000095");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongPhong").value(1))
                .andExpect(jsonPath("$.daGhi").value(0))
                .andExpect(jsonPath("$.phong[0].soPhong").value("101"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoDau").value("0.00"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoCuoi").doesNotExist());
    }

    @Test
    void FR_MTR_02_managerCanSaveOneRoomAndProgressCountsTheRecordedRoom() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000096");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1252.75"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phongId").value(phongId))
                .andExpect(jsonPath("$.chiSoDau").value("1240.00"))
                .andExpect(jsonPath("$.chiSoCuoi").value("1252.75"))
                .andExpect(jsonPath("$.mucTieuThu").value("12.75"));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongPhong").value(1))
                .andExpect(jsonPath("$.daGhi").value(1))
                .andExpect(jsonPath("$.phong[0].dichVu[0].mucTieuThu").value("12.75"));

        org.assertj.core.api.Assertions.assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Integer.class,
                kyHienTaiId,
                phongId,
                dienId
        )).isEqualTo(1);
    }

    @Test
    void FR_MTR_02_managerCountsRoomAsDoneOnlyAfterAllMeteredServicesAreSaved() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long nuocId = themDichVu(1L, "Nước sinh hoạt", "m3");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000094");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themDichVuHopDong(hopDongId, nuocId, "12000.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);
        themChiSo(kyTruocId, phongId, nuocId, "40.00", "45.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1252.75"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mucTieuThu").value("12.75"));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongPhong").value(1))
                .andExpect(jsonPath("$.daGhi").value(0))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoCuoi").value("1252.75"))
                .andExpect(jsonPath("$.phong[0].dichVu[1].chiSoCuoi").doesNotExist());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "51.25"}
                                """.formatted(phongId, nuocId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mucTieuThu").value("6.25"));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongPhong").value(1))
                .andExpect(jsonPath("$.daGhi").value(1))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoCuoi").value("1252.75"))
                .andExpect(jsonPath("$.phong[0].dichVu[1].chiSoCuoi").value("51.25"));
    }

    @Test
    void FR_MTR_03_managerRejectsLowerReadingUnlessReplacementMeterIsDeclared() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000093");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1239.99"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Chỉ số mới không được nhỏ hơn chỉ số cũ (1240.00). Nếu vừa thay công tơ, hãy chọn 'Thay công tơ'."));

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1239.99", "coThayCongTo": true,
                                 "chiSoCuoiCongToCu": "1240.00", "chiSoDauCongToMoi": "0.00"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chiSoCuoi").value("1239.99"))
                .andExpect(jsonPath("$.mucTieuThu").value("1239.99"));

        org.assertj.core.api.Assertions.assertThat(jdbcTemplate.queryForObject(
                "SELECT co_thay_cong_to FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Boolean.class,
                kyHienTaiId,
                phongId,
                dienId
        )).isTrue();
    }

    @Test
    void FR_MTR_09_CR_004_BR_09_savesReplacementReadingWhenNewMeterStartsAtZero() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê thay công tơ", "0900000094");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "15.25", "coThayCongTo": true,
                                 "chiSoCuoiCongToCu": "1275.50", "chiSoDauCongToMoi": "0.00"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mucTieuThu").value("50.75"))
                .andExpect(jsonPath("$.chiSoCuoiCongToCu").value("1275.50"))
                .andExpect(jsonPath("$.chiSoDauCongToMoi").value("0.00"));
    }

    @Test
    void FR_MTR_09_CR_004_BR_09_savesReplacementReadingWhenNewMeterStartsAtNonzeroReading() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê thay công tơ", "0900000087");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "115.75", "coThayCongTo": true,
                                 "chiSoCuoiCongToCu": "1275.50", "chiSoDauCongToMoi": "100.25"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mucTieuThu").value("51.00"));
    }

    @Test
    void FR_MTR_09_CR_004_BR_09_databaseEnforcesReplacementFieldsInBothDirections() {
        Long dichVuId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");

        Long chiSoId = jdbcTemplate.queryForObject("""
                        INSERT INTO CHI_SO_DICH_VU (
                            ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, co_thay_cong_to, nguoi_ghi_id, thoi_diem_ghi
                        ) VALUES (?, ?, ?, 10.00, 20.00, FALSE, 3, CURRENT_TIMESTAMP)
                        RETURNING id
                        """, Long.class, kyId, phongId, dichVuId);

        assertThatThrownBy(() -> jdbcTemplate.update(
                "UPDATE CHI_SO_DICH_VU SET chi_so_cuoi_cong_to_cu = 15.00 WHERE id = ?", chiSoId
        )).hasMessageContaining("chi_so_dich_vu_thay_cong_to_check");
        assertThatThrownBy(() -> jdbcTemplate.update(
                "UPDATE CHI_SO_DICH_VU SET co_thay_cong_to = TRUE WHERE id = ?", chiSoId
        )).hasMessageContaining("chi_so_dich_vu_thay_cong_to_check");

        assertThat(jdbcTemplate.update("""
                UPDATE CHI_SO_DICH_VU
                SET co_thay_cong_to = TRUE,
                    chi_so_cuoi_cong_to_cu = 15.00,
                    chi_so_dau_cong_to_moi = 0.00
                WHERE id = ?
                """, chiSoId)).isEqualTo(1);
    }

    @Test
    void FR_MTR_09_CR_004_BR_09_replacementFieldsRoundTripThroughSaveAndListResponses() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê thay công tơ", "0900000086");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "115.75", "coThayCongTo": true,
                                 "chiSoCuoiCongToCu": "1275.50", "chiSoDauCongToMoi": "100.25"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.coThayCongTo").value(true))
                .andExpect(jsonPath("$.chiSoCuoiCongToCu").value("1275.50"))
                .andExpect(jsonPath("$.chiSoDauCongToMoi").value("100.25"));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phong[0].dichVu[0].coThayCongTo").value(true))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoCuoiCongToCu").value("1275.50"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].chiSoDauCongToMoi").value("100.25"));
    }

    @Test
    void FR_MTR_03_managerAllowsReadingEqualToPrevious() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000092");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1240.00"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chiSoCuoi").value("1240.00"))
                .andExpect(jsonPath("$.mucTieuThu").value("0.00"));
    }

    @Test
    void FR_MTR_03_managerAllowsReadingHigherThanPrevious() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000091");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyHienTaiId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1242.50"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chiSoCuoi").value("1242.50"))
                .andExpect(jsonPath("$.mucTieuThu").value("2.50"));
    }

    @Test
    void FR_MTR_04_reSavingTheSameAcknowledgedAnomalyDoesNotRequireAnotherAcknowledgement() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyThang5Id = themKyThanhToan(1L, 2026, 5, "2026-04-26", "2026-05-25", "DA_CHOT");
        Long kyThang6Id = themKyThanhToan(1L, 2026, 6, "2026-05-26", "2026-06-25", "DA_CHOT");
        Long kyThang7Id = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyThang8Id = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê cảnh báo", "0900000090");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-05-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyThang5Id, phongId, dienId, "100.00", "110.00", 3L);
        themChiSo(kyThang6Id, phongId, dienId, "110.00", "122.00", 3L);
        themChiSo(kyThang7Id, phongId, dienId, "122.00", "136.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyThang8Id + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "160.00", "xacNhanCanhBao": true}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.coCanhBao").value(true));

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyThang8Id + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "160.00"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chiSoCuoi").value("160.00"))
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.coCanhBao").value(true));
    }

    @Test
    void FR_MTR_01_wrongRoleCannotReadOrSaveMeterReadings() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000098");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        String wrongRoleToken = login(4L, "0900000004");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + wrongRoleToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + wrongRoleToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"phongId\": %d, \"dichVuId\": %d, \"chiSoCuoi\": \"1.00\"}".formatted(phongId, dienId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MTR_01_managerCannotReadOrSaveReadingsOutsideAssignedBuilding() throws Exception {
        Long dienId = themDichVu(2L, "Điện Toà B", "kWh");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000097");
        Long phongId = themPhong(2L, "101", 1);
        Long kyId = themKyThanhToan(2L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/2/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"phongId\": %d, \"dichVuId\": %d, \"chiSoCuoi\": \"1.00\"}".formatted(phongId, dienId)))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest(name = "FR_MTR_10_deniedRole_{0}")
    @MethodSource("duLieuVaiTroBiChanKhiSuaKyDaChot")
    void FR_MTR_10_deniedRolesReceive403WhenEditingClosedReading(Long nguoiDungId, String soDienThoai) throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê bị chặn", "0900000088");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        String token = login(nguoiDungId, soDienThoai);

        mockMvc.perform(put("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + token)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1255.00", "lyDo": "Sai số"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MTR_10_postCannotMutateClosedReadingEvenForOwner() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê không được POST", "0900000087");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1258.25"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT chi_so_cuoi FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                java.math.BigDecimal.class,
                kyId,
                phongId,
                dienId
        )).isEqualByComparingTo("1250.00");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NHAT_KY_THAO_TAC", Integer.class)).isZero();
    }

    @Test
    void FR_MTR_10_ownerCanEditClosedReadingWithReasonAndAuditIt() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê chủ sở hữu", "0900000086");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);
        LocalDateTime thoiDiemGhiBanDau = LocalDateTime.of(2026, 8, 25, 9, 15, 30);
        jdbcTemplate.update(
                "UPDATE CHI_SO_DICH_VU SET thoi_diem_ghi = ? WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Timestamp.valueOf(thoiDiemGhiBanDau),
                kyId,
                phongId,
                dienId
        );

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(put("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1258.25", "lyDo": "Đối chiếu lại sổ ghi"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chiSoCuoi").value("1258.25"));

        List<java.util.Map<String, Object>> nhatKy = jdbcTemplate.queryForList("""
                        SELECT nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau, phong_id, dich_vu_id, ly_do, thoi_diem
                        FROM NHAT_KY_THAO_TAC
                        WHERE nguoi_dung_id = 2
                        ORDER BY id
                        """);
        assertThat(nhatKy).hasSize(1);
        assertThat(nhatKy.getFirst()).containsEntry("nguoi_dung_id", 2L)
                .containsEntry("hanh_dong", "CAP_NHAT_CHI_SO")
                .containsEntry("doi_tuong", "CHI_SO_DICH_VU")
                .containsEntry("phong_id", phongId)
                .containsEntry("dich_vu_id", dienId)
                .containsEntry("ly_do", "Đối chiếu lại sổ ghi");
        assertThat(nhatKy.getFirst().get("thoi_diem")).isNotNull();
        assertThat(String.valueOf(nhatKy.getFirst().get("gia_tri_truoc"))).contains("1250.00");
        assertThat(String.valueOf(nhatKy.getFirst().get("gia_tri_sau"))).contains("1258.25");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT nguoi_ghi_id FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Long.class,
                kyId,
                phongId,
                dienId
        )).isEqualTo(3L);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT thoi_diem_ghi FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Timestamp.class,
                kyId,
                phongId,
                dienId
        ).toLocalDateTime()).isEqualTo(thoiDiemGhiBanDau);
    }

    @Test
    void FR_MTR_10_blankReasonRejectsClosedPeriodEdit() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê lý do trống", "0900000085");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(put("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1258.25", "lyDo": "   "}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isBadRequest());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NHAT_KY_THAO_TAC", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT chi_so_cuoi FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                java.math.BigDecimal.class,
                kyId,
                phongId,
                dienId
        )).isEqualByComparingTo("1250.00");
    }

    @Test
    void FR_MTR_10_closedPeriodEditStaysAppendOnly() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê nhật ký", "0900000084");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(put("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1258.25", "lyDo": "Lần sửa 1"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1262.50", "lyDo": "Lần sửa 2"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isOk());

        List<java.util.Map<String, Object>> nhatKy = jdbcTemplate.queryForList("""
                        SELECT id, gia_tri_truoc, gia_tri_sau, ly_do
                        FROM NHAT_KY_THAO_TAC
                        WHERE doi_tuong = 'CHI_SO_DICH_VU'
                        ORDER BY id
                        """);
        assertThat(nhatKy).hasSize(2);
        assertThat(String.valueOf(nhatKy.get(0).get("gia_tri_sau"))).contains("1258.25");
        assertThat(String.valueOf(nhatKy.get(1).get("gia_tri_truoc"))).contains("1258.25");
        assertThat(String.valueOf(nhatKy.get(1).get("gia_tri_sau"))).contains("1262.50");
    }

    @Test
    void FR_MTR_10_ownerEditPreservesReplacementFields() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê thay công tơ", "0900000083");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1234.50", "1250.00", 3L);
        jdbcTemplate.update("""
                UPDATE CHI_SO_DICH_VU
                SET co_thay_cong_to = TRUE,
                    chi_so_cuoi_cong_to_cu = 1275.50,
                    chi_so_dau_cong_to_moi = 100.25
                WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?
                """, kyId, phongId, dienId);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(put("/api/toa-nha/1/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "115.75", "coThayCongTo": true,
                                 "chiSoCuoiCongToCu": "1290.50", "chiSoDauCongToMoi": "100.25", "lyDo": "Thay đồng hồ"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coThayCongTo").value(true))
                .andExpect(jsonPath("$.chiSoCuoiCongToCu").value("1290.50"))
                .andExpect(jsonPath("$.chiSoDauCongToMoi").value("100.25"));
    }

    @Test
    void FR_MTR_10_ownerCannotEditClosedReadingOutsideAssignedBuilding() throws Exception {
        Long dienId = themDichVu(2L, "Điện Toà B", "kWh");
        Long phongId = themPhong(2L, "101", 1);
        Long kyId = themKyThanhToan(2L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
        Long nguoiThueId = themNguoiThue("Người thuê ngoài scope", "0900000082");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(put("/api/toa-nha/2/ky-thanh-toan/%s/chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1258.25", "lyDo": "Sai số"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isForbidden());
    }

    private static Stream<Arguments> duLieuVaiTroBiChanKhiSuaKyDaChot() {
        return Stream.of(
                Arguments.of(1L, "0900000001"),
                Arguments.of(3L, "0900000003"),
                Arguments.of(4L, "0900000004"),
                Arguments.of(5L, "0900000006")
        );
    }

    private Long themPhong(Long toaNhaId, String soPhong, int tang) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, ?, 20.00, 2, 3500000.00, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                tang
        );
    }

    private Long themDichVu(Long toaNhaId, String ten, String donVi) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'THEO_CHI_SO', 'CO_DINH', ?, TRUE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten,
                donVi
        );
    }

    private Long themKyThanhToan(Long toaNhaId, int nam, int thang, String ngayBatDau, String ngayKetThuc, String trangThai) {
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
                "012345678901"
        );
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, String ngayBatDau, String ngayKetThuc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?, ?, 3500000.00, 3500000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc)
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
                new java.math.BigDecimal(donGia)
        );
    }

    private void themChiSo(Long kyId, Long phongId, Long dichVuId, String chiSoDau, String chiSoCuoi, Long nguoiDungId) {
        jdbcTemplate.update(
                """
                        INSERT INTO CHI_SO_DICH_VU (
                            ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, nguoi_ghi_id, thoi_diem_ghi
                        )
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        """,
                kyId,
                phongId,
                dichVuId,
                new java.math.BigDecimal(chiSoDau),
                new java.math.BigDecimal(chiSoCuoi),
                nguoiDungId
        );
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(runtimePassword),
                nguoiDungId
        );

        String body = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(soDienThoai, runtimePassword)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }
}
