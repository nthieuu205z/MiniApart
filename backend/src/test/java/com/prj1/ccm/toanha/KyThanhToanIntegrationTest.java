package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class KyThanhToanIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
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
        jdbcTemplate.update(
                """
                        UPDATE TOA_NHA
                        SET ngay_chot_so = CASE id WHEN 1 THEN 25 ELSE 26 END
                        WHERE id IN (1, 2)
                        """
        );
    }

    @Test
    void FR_MTR_01_managerOpensPaymentPeriodAndListShowsDerivedDatesAndOpenStatus() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nam": 2026,
                                  "thang": 8
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nam").value(2026))
                .andExpect(jsonPath("$.thang").value(8))
                .andExpect(jsonPath("$.ngayBatDau").value("2026-07-26"))
                .andExpect(jsonPath("$.ngayKetThuc").value("2026-08-25"))
                .andExpect(jsonPath("$.trangThai").value("DANG_MO"));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nam").value(2026))
                .andExpect(jsonPath("$[0].thang").value(8))
                .andExpect(jsonPath("$[0].ngayBatDau").value("2026-07-26"))
                .andExpect(jsonPath("$[0].ngayKetThuc").value("2026-08-25"))
                .andExpect(jsonPath("$[0].trangThai").value("DANG_MO"));
    }

    @Test
    void FR_MTR_01_sameBuildingCannotHaveDuplicateYearMonthAtDatabaseLevel() {
        themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");

        assertThatThrownBy(() -> themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void FR_MTR_01_constraintMappingDistinguishesDuplicateMonthFromOpenPeriodRace() {
        DataIntegrityViolationException duplicateMonth = captureConstraintViolation(() -> {
            themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");
            themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        });

        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");

        DataIntegrityViolationException secondOpenPeriod = captureConstraintViolation(() -> {
            themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
            themKyThanhToan(1L, 2026, 9, "2026-08-26", "2026-09-25", "DANG_MO");
        });

        assertThat(KyThanhToanService.thongBaoXungDotTuRangBuoc(duplicateMonth))
                .isEqualTo("Toà nhà đã có kỳ thanh toán cho tháng này.");
        assertThat(KyThanhToanService.thongBaoXungDotTuRangBuoc(secondOpenPeriod))
                .isEqualTo("Toà nhà đang có một kỳ thanh toán mở.");
    }

    @Test
    void FR_MTR_01_closedPaymentPeriodCannotBeReopenedByOpeningSameYearMonthAgain() throws Exception {
        String managerToken = login(3L, "0900000003");
        themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DA_CHOT");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nam": 2026,
                                  "thang": 8
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao", is("Toà nhà đã có kỳ thanh toán cho tháng này.")));
    }

    @Test
    void FR_MTR_01_managerCannotOpenSecondOpenPaymentPeriodForSameBuilding() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nam": 2026,
                                  "thang": 8
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nam": 2026,
                                  "thang": 9
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao", is("Toà nhà đang có một kỳ thanh toán mở.")));
    }

    @Test
    void FR_MTR_01_listShowsClosedAndOpenPaymentPeriods() throws Exception {
        String managerToken = login(3L, "0900000003");
        themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].thang").value(8))
                .andExpect(jsonPath("$[0].trangThai").value("DANG_MO"))
                .andExpect(jsonPath("$[1].thang").value(7))
                .andExpect(jsonPath("$[1].trangThai").value("DA_CHOT"));
    }

    @Test
    void FR_MTR_08_managerSeesMissingRoomsInStableOrderAndSkipsRoomsWithoutEligibleMeteredServices() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh", "THEO_CHI_SO", true, true);
        Long internetId = themDichVu(1L, "Internet", "gói", "CO_DINH", false, true);
        Long phong101 = themPhong(1L, "101", 1);
        Long phong102 = themPhong(1L, "102", 1);
        Long phong202 = themPhong(1L, "202", 2);
        Long nguoiThue101 = themNguoiThue("Người thuê 101", "0900000191");
        Long nguoiThue102 = themNguoiThue("Người thuê 102", "0900000192");
        Long nguoiThue202 = themNguoiThue("Người thuê 202", "0900000193");
        Long hopDong101 = themHopDong(phong101, nguoiThue101, "2026-07-01", "2026-08-31");
        Long hopDong102 = themHopDong(phong102, nguoiThue102, "2026-07-01", "2026-08-31");
        Long hopDong202 = themHopDong(phong202, nguoiThue202, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDong101, dienId, "3500.00");
        themDichVuHopDong(hopDong102, internetId, "250000.00");
        themDichVuHopDong(hopDong202, dienId, "3500.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/thieu-chi-so".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].soPhong").value("101"))
                .andExpect(jsonPath("$[0].tang").value(1))
                .andExpect(jsonPath("$[1].soPhong").value("202"))
                .andExpect(jsonPath("$[1].tang").value(2));
    }

    @Test
    void FR_MTR_08_managerRejectsClosingWhenRoomsAreMissingAndKeepsPeriodOpen() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh", "THEO_CHI_SO", true, true);
        Long internetId = themDichVu(1L, "Internet", "gói", "CO_DINH", false, true);
        Long phong101 = themPhong(1L, "101", 1);
        Long phong102 = themPhong(1L, "102", 1);
        Long phong202 = themPhong(1L, "202", 2);
        Long nguoiThue101 = themNguoiThue("Người thuê 101", "0900000191");
        Long nguoiThue102 = themNguoiThue("Người thuê 102", "0900000192");
        Long nguoiThue202 = themNguoiThue("Người thuê 202", "0900000193");
        Long hopDong101 = themHopDong(phong101, nguoiThue101, "2026-07-01", "2026-08-31");
        Long hopDong102 = themHopDong(phong102, nguoiThue102, "2026-07-01", "2026-08-31");
        Long hopDong202 = themHopDong(phong202, nguoiThue202, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDong101, dienId, "3500.00");
        themDichVuHopDong(hopDong102, internetId, "250000.00");
        themDichVuHopDong(hopDong202, dienId, "3500.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chot".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].soPhong").value("101"))
                .andExpect(jsonPath("$[1].soPhong").value("202"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KY_THANH_TOAN WHERE id = ?",
                String.class,
                kyId
        )).isEqualTo("DANG_MO");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM KY_THANH_TOAN WHERE toa_nha_id = ?",
                Integer.class,
                1L
        )).isEqualTo(1);
    }

    @Test
    void FR_MTR_08_managerClosesPeriodAndOpensNextMonthWithinTheSameTransaction() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh", "THEO_CHI_SO", true, true);
        Long phong101 = themPhong(1L, "101", 1);
        Long phong202 = themPhong(1L, "202", 2);
        Long nguoiThue101 = themNguoiThue("Người thuê 101", "0900000191");
        Long nguoiThue202 = themNguoiThue("Người thuê 202", "0900000193");
        Long hopDong101 = themHopDong(phong101, nguoiThue101, "2026-07-01", "2026-08-31");
        Long hopDong202 = themHopDong(phong202, nguoiThue202, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDong101, dienId, "3500.00");
        themDichVuHopDong(hopDong202, dienId, "3500.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        themChiSo(kyId, phong101, dienId, "1240.00", "1250.00", 3L);
        themChiSo(kyId, phong202, dienId, "220.00", "233.50", 3L);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chot".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_CHOT"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KY_THANH_TOAN WHERE id = ?",
                String.class,
                kyId
        )).isEqualTo("DA_CHOT");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ?
                        """,
                Integer.class,
                1L
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT trang_thai
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2026,
                9
        )).isEqualTo("DANG_MO");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT ngay_bat_dau::text
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2026,
                9
        )).isEqualTo("2026-08-26");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT ngay_ket_thuc::text
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2026,
                9
        )).isEqualTo("2026-09-25");
    }

    @Test
    void FR_MTR_08_managerClosesDecemberPeriodAndOpensJanuaryPeriodOfNextYear() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh", "THEO_CHI_SO", true, true);
        Long phongId = themPhong(1L, "101", 1);
        Long nguoiThueId = themNguoiThue("Người thuê 101", "0900000191");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-11-01", "2027-01-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        Long kyId = themKyThanhToan(1L, 2026, 12, "2026-11-26", "2026-12-25", "DANG_MO");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chot".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KY_THANH_TOAN WHERE id = ?",
                String.class,
                kyId
        )).isEqualTo("DA_CHOT");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT trang_thai
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2027,
                1
        )).isEqualTo("DANG_MO");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT ngay_bat_dau::text
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2027,
                1
        )).isEqualTo("2026-12-26");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT ngay_ket_thuc::text
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2027,
                1
        )).isEqualTo("2027-01-25");
    }

    @Test
    void FR_MTR_08_nextPeriodUsesCurrentBuildingClosingDayIncludingYearRollover() throws Exception {
        String managerToken = login(3L, "0900000003");
        jdbcTemplate.update("UPDATE TOA_NHA SET ngay_chot_so = 20 WHERE id = 1");
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh", "THEO_CHI_SO", true, true);
        Long phongId = themPhong(1L, "101", 1);
        Long nguoiThueId = themNguoiThue("Người thuê rollover", "0900000194");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-11-01", "2027-01-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        Long kyId = themKyThanhToan(1L, 2026, 12, "2026-11-26", "2026-12-25", "DANG_MO");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chot".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_CHOT"));

        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT ngay_bat_dau::text
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2027,
                1
        )).isEqualTo("2026-12-26");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT ngay_ket_thuc::text
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ? AND nam = ? AND thang = ?
                        """,
                String.class,
                1L,
                2027,
                1
        )).isEqualTo("2027-01-20");
    }

    @Test
    void FR_MTR_08_closeRollsBackWhenNextPeriodInsertConflicts() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh", "THEO_CHI_SO", true, true);
        Long phongId = themPhong(1L, "101", 1);
        Long nguoiThueId = themNguoiThue("Người thuê 101", "0900000191");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-09-30");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        themChiSo(kyId, phongId, dienId, "1240.00", "1250.00", 3L);
        themKyThanhToan(1L, 2026, 9, "2026-08-26", "2026-09-25", "DA_CHOT");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/%s/chot".formatted(kyId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM KY_THANH_TOAN WHERE id = ?",
                String.class,
                kyId
        )).isEqualTo("DANG_MO");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM KY_THANH_TOAN WHERE toa_nha_id = ?",
                Integer.class,
                1L
        )).isEqualTo(2);
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
                        VALUES (?, ?, ?, 20.00, 2, 3500000.00, 'Studio', 'DANG_THUE')
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

    private DataIntegrityViolationException captureConstraintViolation(Runnable thaoTac) {
        return (DataIntegrityViolationException) org.assertj.core.api.Assertions.catchThrowableOfType(
                thaoTac::run,
                DataIntegrityViolationException.class
        );
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(runtimePassword),
                nguoiDungId
        );

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
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
