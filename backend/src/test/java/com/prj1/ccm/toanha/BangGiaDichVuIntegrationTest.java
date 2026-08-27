package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.Assertions;
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

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(BangGiaDichVuIntegrationTest.BangGiaClockTestConfiguration.class)
class BangGiaDichVuIntegrationTest {

    private static final LocalDate TEST_TODAY = LocalDate.of(2040, 8, 15);
    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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
        jdbcTemplate.update("DELETE FROM BANG_GIA_BAC_THANG");
        jdbcTemplate.update("DELETE FROM BANG_GIA");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
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
    }

    @Test
    void FR_BLD_06_listsFixedPriceHistoryMarksTodayAndAppendsRows() throws Exception {
        Long dichVuId = themDichVu(1L, "Internet");
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload("250000.00", TEST_TODAY.minusDays(45).toString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dichVuId").value(dichVuId))
                .andExpect(jsonPath("$.donGia").value("250000.00"))
                .andExpect(jsonPath("$.ngayHieuLuc").value(TEST_TODAY.minusDays(45).toString()))
                .andExpect(jsonPath("$.dangApDung").value(true));

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload("300000.00", TEST_TODAY.toString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.donGia").value("300000.00"))
                .andExpect(jsonPath("$.dangApDung").value(true));

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload("350000.00", TEST_TODAY.plusDays(47).toString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.donGia").value("350000.00"))
                .andExpect(jsonPath("$.dangApDung").value(false));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].donGia").value("350000.00"))
                .andExpect(jsonPath("$[0].ngayHieuLuc").value(TEST_TODAY.plusDays(47).toString()))
                .andExpect(jsonPath("$[0].dangApDung").value(false))
                .andExpect(jsonPath("$[1].donGia").value("300000.00"))
                .andExpect(jsonPath("$[1].ngayHieuLuc").value(TEST_TODAY.toString()))
                .andExpect(jsonPath("$[1].dangApDung").value(true))
                .andExpect(jsonPath("$[2].donGia").value("250000.00"))
                .andExpect(jsonPath("$[2].ngayHieuLuc").value(TEST_TODAY.minusDays(45).toString()))
                .andExpect(jsonPath("$[2].dangApDung").value(false));

        List<Map<String, Object>> lichSu = jdbcTemplate.queryForList(
                """
                        SELECT don_gia, ngay_hieu_luc
                        FROM BANG_GIA
                        WHERE dich_vu_id = ?
                        ORDER BY ngay_hieu_luc, id
                        """,
                dichVuId
        );
        Assertions.assertEquals(3, lichSu.size());
        Assertions.assertEquals("250000.00", String.valueOf(lichSu.get(0).get("don_gia")));
        Assertions.assertEquals(TEST_TODAY.minusDays(45).toString(), String.valueOf(lichSu.get(0).get("ngay_hieu_luc")));
        Assertions.assertEquals("300000.00", String.valueOf(lichSu.get(1).get("don_gia")));
        Assertions.assertEquals(TEST_TODAY.toString(), String.valueOf(lichSu.get(1).get("ngay_hieu_luc")));
        Assertions.assertEquals("350000.00", String.valueOf(lichSu.get(2).get("don_gia")));
        Assertions.assertEquals(TEST_TODAY.plusDays(47).toString(), String.valueOf(lichSu.get(2).get("ngay_hieu_luc")));
    }

    @Test
    void FR_BLD_06_looksUpApplicablePriceByRequestedDateAndPreservesJanuaryPriceHistory() throws Exception {
        Long dichVuId = themDichVu(1L, "Phí quản lý");
        String adminToken = login(1L, "0900000001");

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload("100000.00", "2026-01-01")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.donGia").value("100000.00"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .param("ngay", "2025-12-31")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.thongBao", containsString("giá hiệu lực")));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .param("ngay", "2026-01-01")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donGia").value("100000.00"))
                .andExpect(jsonPath("$.ngayHieuLuc").value("2026-01-01"));

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload("120000.00", "2026-03-01")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.donGia").value("120000.00"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .param("ngay", "2026-02-15")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donGia").value("100000.00"))
                .andExpect(jsonPath("$.ngayHieuLuc").value("2026-01-01"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .param("ngay", "2026-01-31")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donGia").value("100000.00"))
                .andExpect(jsonPath("$.ngayHieuLuc").value("2026-01-01"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .param("ngay", "2026-03-01")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donGia").value("120000.00"))
                .andExpect(jsonPath("$.ngayHieuLuc").value("2026-03-01"));
    }

    @Test
    void FR_BLD_06_keepsFixedPriceHistoryAppendOnlyWithoutUpdateOrDeleteMutators() throws Exception {
        Long dichVuId = themDichVu(1L, "Giữ xe");
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(put("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload("80000.00", "2026-08-01")))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(delete("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void FR_BLD_08_listsTieredPriceHistoryMarksTodayAndLooksUpApplicableTierSetByRequestedDate() throws Exception {
        Long dichVuId = themDichVuDien(1L, "Điện sinh hoạt");
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bacThangPayload("2204.0655", TEST_TODAY.minusDays(60).toString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ngayHieuLuc").value(TEST_TODAY.minusDays(60).toString()))
                .andExpect(jsonPath("$.dangApDung").value(true))
                .andExpect(jsonPath("$.cacBac", hasSize(5)))
                .andExpect(jsonPath("$.cacBac[0].bac").value(1))
                .andExpect(jsonPath("$.cacBac[0].donGia").value("1984.00"))
                .andExpect(jsonPath("$.cacBac[4].bac").value(5))
                .andExpect(jsonPath("$.cacBac[4].denSoLuong").doesNotExist())
                .andExpect(jsonPath("$.cacBac[4].donGia").value("3967.00"));

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bacThangPayload("2500.0000", TEST_TODAY.plusDays(20).toString())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ngayHieuLuc").value(TEST_TODAY.plusDays(20).toString()))
                .andExpect(jsonPath("$.dangApDung").value(false))
                .andExpect(jsonPath("$.cacBac[0].donGia").value("2250.00"))
                .andExpect(jsonPath("$.cacBac[4].donGia").value("4500.00"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].ngayHieuLuc").value(TEST_TODAY.plusDays(20).toString()))
                .andExpect(jsonPath("$[0].dangApDung").value(false))
                .andExpect(jsonPath("$[0].cacBac", hasSize(5)))
                .andExpect(jsonPath("$[1].ngayHieuLuc").value(TEST_TODAY.minusDays(60).toString()))
                .andExpect(jsonPath("$[1].dangApDung").value(true))
                .andExpect(jsonPath("$[1].cacBac[2].donGia").value("2998.00"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .param("ngay", TEST_TODAY.minusDays(61).toString())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.thongBao", containsString("giá hiệu lực")));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .param("ngay", TEST_TODAY.plusDays(5).toString())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ngayHieuLuc").value(TEST_TODAY.minusDays(60).toString()))
                .andExpect(jsonPath("$.cacBac[0].donGia").value("1984.00"))
                .andExpect(jsonPath("$.cacBac[4].donGia").value("3967.00"));

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .param("ngay", TEST_TODAY.plusDays(20).toString())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ngayHieuLuc").value(TEST_TODAY.plusDays(20).toString()))
                .andExpect(jsonPath("$.cacBac[0].donGia").value("2250.00"));

        List<Map<String, Object>> lichSuBacThang = jdbcTemplate.queryForList(
                """
                        SELECT bac, tu_so_luong, den_so_luong, ty_le, don_gia, ngay_hieu_luc
                        FROM BANG_GIA_BAC_THANG
                        WHERE dich_vu_id = ?
                        ORDER BY ngay_hieu_luc, bac
                        """,
                dichVuId
        );
        Assertions.assertEquals(10, lichSuBacThang.size());
        Assertions.assertEquals("90.00", String.valueOf(lichSuBacThang.get(0).get("ty_le")));
        Assertions.assertEquals("1984.00", String.valueOf(lichSuBacThang.get(0).get("don_gia")));
        Assertions.assertEquals(TEST_TODAY.minusDays(60).toString(), String.valueOf(lichSuBacThang.get(0).get("ngay_hieu_luc")));
        Assertions.assertEquals("180.00", String.valueOf(lichSuBacThang.get(4).get("ty_le")));
        Assertions.assertNull(lichSuBacThang.get(4).get("den_so_luong"));
        Assertions.assertEquals("2250.00", String.valueOf(lichSuBacThang.get(5).get("don_gia")));
        Assertions.assertEquals(TEST_TODAY.plusDays(20).toString(), String.valueOf(lichSuBacThang.get(5).get("ngay_hieu_luc")));
    }

    @Test
    void FR_BLD_08_rejectsTierSetsWithGapOverlapOrWrongInfiniteLastTier() throws Exception {
        Long dichVuId = themDichVuDien(1L, "Điện sinh hoạt");
        String adminToken = login(1L, "0900000001");

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "giaBanLeBinhQuan": "2204.0655",
                                  "ngayHieuLuc": "2026-01-01",
                                  "cacBac": [
                                    { "bac": 1, "tuSoLuong": "0.00", "denSoLuong": "100.00", "tyLe": "90.00" },
                                    { "bac": 2, "tuSoLuong": "102.00", "denSoLuong": "200.00", "tyLe": "108.00" },
                                    { "bac": 3, "tuSoLuong": "201.00", "denSoLuong": "400.00", "tyLe": "136.00" },
                                    { "bac": 4, "tuSoLuong": "401.00", "denSoLuong": "700.00", "tyLe": "162.00" },
                                    { "bac": 5, "tuSoLuong": "701.00", "denSoLuong": null, "tyLe": "180.00" }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("liền nhau")));

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "giaBanLeBinhQuan": "2204.0655",
                                  "ngayHieuLuc": "2026-01-01",
                                  "cacBac": [
                                    { "bac": 1, "tuSoLuong": "0.00", "denSoLuong": "100.00", "tyLe": "90.00" },
                                    { "bac": 2, "tuSoLuong": "100.00", "denSoLuong": "200.00", "tyLe": "108.00" },
                                    { "bac": 3, "tuSoLuong": "201.00", "denSoLuong": "400.00", "tyLe": "136.00" },
                                    { "bac": 4, "tuSoLuong": "401.00", "denSoLuong": "700.00", "tyLe": "162.00" },
                                    { "bac": 5, "tuSoLuong": "701.00", "denSoLuong": null, "tyLe": "180.00" }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("liền nhau")));

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "giaBanLeBinhQuan": "2204.0655",
                                  "ngayHieuLuc": "2026-01-01",
                                  "cacBac": [
                                    { "bac": 1, "tuSoLuong": "0.00", "denSoLuong": null, "tyLe": "90.00" },
                                    { "bac": 2, "tuSoLuong": "101.00", "denSoLuong": "200.00", "tyLe": "108.00" },
                                    { "bac": 3, "tuSoLuong": "201.00", "denSoLuong": "400.00", "tyLe": "136.00" },
                                    { "bac": 4, "tuSoLuong": "401.00", "denSoLuong": "700.00", "tyLe": "162.00" },
                                    { "bac": 5, "tuSoLuong": "701.00", "denSoLuong": null, "tyLe": "180.00" }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("bậc cuối")));
    }

    @Test
    void FR_BLD_08_rejectsDuplicateTierSetForSameEffectiveDateWithoutMergingRows() throws Exception {
        Long dichVuId = themDichVuDien(1L, "Điện sinh hoạt");
        String adminToken = login(1L, "0900000001");
        String ngayHieuLuc = "2026-01-01";

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bacThangPayload("2204.0655", ngayHieuLuc)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bacThangPayload("2500.0000", ngayHieuLuc)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao", containsString("đã tồn tại")));

        Assertions.assertEquals(
                5,
                demBanGhi("SELECT COUNT(*) FROM BANG_GIA_BAC_THANG WHERE dich_vu_id = ?", dichVuId)
        );
        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].cacBac", hasSize(5)))
                .andExpect(jsonPath("$[0].cacBac[0].donGia").value("1984.00"));
    }

    @Test
    void FR_BLD_08_rejectsNullTierEntryAndNullTierNumberWithBadRequest() throws Exception {
        Long dichVuId = themDichVuDien(1L, "Điện sinh hoạt");
        String adminToken = login(1L, "0900000001");

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "giaBanLeBinhQuan": "2204.0655",
                                  "ngayHieuLuc": "2026-01-01",
                                  "cacBac": [
                                    null,
                                    { "bac": 1, "tuSoLuong": "0.00", "denSoLuong": null, "tyLe": "90.00" }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bac-thang")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "giaBanLeBinhQuan": "2204.0655",
                                  "ngayHieuLuc": "2026-01-01",
                                  "cacBac": [
                                    { "bac": null, "tuSoLuong": "0.00", "denSoLuong": null, "tyLe": "90.00" },
                                    { "bac": 1, "tuSoLuong": "0.00", "denSoLuong": null, "tyLe": "90.00" }
                                  ]
                                }
                                """))
                .andExpect(status().isBadRequest());

        Assertions.assertEquals(
                0,
                demBanGhi("SELECT COUNT(*) FROM BANG_GIA_BAC_THANG WHERE dich_vu_id = ?", dichVuId)
        );
    }

    private Long themDichVu(Long toaNhaId, String ten) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten
        );
    }

    private Long themDichVuDien(Long toaNhaId, String ten) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'THEO_CHI_SO', 'CO_DINH', 'kWh', TRUE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten
        );
    }

    private void ganToaChoNguoiDung(Long nguoiDungId, Long toaNhaId) {
        jdbcTemplate.update(
                "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, ?)",
                nguoiDungId,
                toaNhaId
        );
    }

    private int demBanGhi(String sql, Long dichVuId) {
        Integer soLuong = jdbcTemplate.queryForObject(sql, Integer.class, dichVuId);
        return soLuong == null ? 0 : soLuong;
    }

    private String bangGiaPayload(String donGia, String ngayHieuLuc) {
        return """
                {
                  "donGia": "%s",
                  "ngayHieuLuc": "%s"
                }
                """.formatted(donGia, ngayHieuLuc);
    }

    private String bacThangPayload(String giaBanLeBinhQuan, String ngayHieuLuc) {
        return """
                {
                  "giaBanLeBinhQuan": "%s",
                  "ngayHieuLuc": "%s",
                  "cacBac": [
                    { "bac": 1, "tuSoLuong": "0.00", "denSoLuong": "100.00", "tyLe": "90.00" },
                    { "bac": 2, "tuSoLuong": "101.00", "denSoLuong": "200.00", "tyLe": "108.00" },
                    { "bac": 3, "tuSoLuong": "201.00", "denSoLuong": "400.00", "tyLe": "136.00" },
                    { "bac": 4, "tuSoLuong": "401.00", "denSoLuong": "700.00", "tyLe": "162.00" },
                    { "bac": 5, "tuSoLuong": "701.00", "denSoLuong": null, "tyLe": "180.00" }
                  ]
                }
                """.formatted(giaBanLeBinhQuan, ngayHieuLuc);
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

    @TestConfiguration(proxyBeanMethods = false)
    static class BangGiaClockTestConfiguration {
        @Bean
        @Primary
        Clock bangGiaTestClock() {
            return Clock.fixed(TEST_TODAY.atStartOfDay(TEST_ZONE).toInstant(), TEST_ZONE);
        }
    }
}
