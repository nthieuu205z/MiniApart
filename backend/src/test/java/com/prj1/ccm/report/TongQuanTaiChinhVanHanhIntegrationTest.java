package com.prj1.ccm.report;

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
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(TongQuanTaiChinhVanHanhIntegrationTest.ReportClockConfiguration.class)
class TongQuanTaiChinhVanHanhIntegrationTest {
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant NOW = Instant.parse("2040-08-15T03:00:00Z");
    private static final LocalDate TODAY = LocalDate.of(2040, 8, 15);

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
        xoaNeuBangTonTai("ANH_DINH_KEM");
        xoaNeuBangTonTai("NHAT_KY_THAO_TAC");
        xoaNeuBangTonTai("GIAO_DICH_COC");
        xoaNeuBangTonTai("SO_DU_KHA_DUNG");
        xoaNeuBangTonTai("THANH_TOAN");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON_BAC_THANG");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("KHOAN_PHAT_SINH");
        xoaNeuBangTonTai("HOA_DON");
        xoaNeuBangTonTai("CHI_SO_DICH_VU");
        xoaNeuBangTonTai("KY_THANH_TOAN");
        xoaNeuBangTonTai("YEU_CAU_SUA_CHUA");
        xoaNeuBangTonTai("NGUOI_O_CUNG");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("NGUOI_THUE");
        xoaNeuBangTonTai("DICH_VU");
        xoaNeuBangTonTai("PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (1, 2, 4, 5)");
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET phien_ban_token = 0,
                            so_lan_sai = 0,
                            lan_sai_dau_tien = NULL,
                            khoa_den = NULL,
                            trang_thai = 'HOAT_DONG',
                            nguoi_thue_id = NULL
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1) ON CONFLICT DO NOTHING");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
    }

    @Test
    void FR_RPT_01_FR_RPT_02_BR_08_usesLedgerExcludesDepositAndDoesNotMultiplyInvoiceDetails() throws Exception {
        Long occupiedRoom = themPhong(1L, "901", false);
        Long emptyRoom = themPhong(1L, "902", false);
        Long tenantId = themNguoiThue("Nguoi thue bao cao", "0909000001");
        Long contractId = themHopDong(occupiedRoom, tenantId, TODAY.minusDays(5), TODAY.plusDays(25), "HIEU_LUC");
        Long periodId = themKy(1L, TODAY.minusDays(30), TODAY, "DA_CHOT");
        Long invoiceId = themHoaDon(periodId, contractId, TODAY.minusDays(2), "DA_THANH_TOAN", "1000000.00", "0.00");
        themChiTiet(invoiceId, "Tien phong", "600000.00");
        themChiTiet(invoiceId, "Dich vu", "400000.00");
        Long paymentId = themThanhToan(invoiceId, new BigDecimal("600000.00"), "THU", null, null, "RPT-THU");
        themThanhToan(invoiceId, new BigDecimal("-100000.00"), "DOI_UNG", paymentId, "Sua so tien", "RPT-DOI-UNG");
        themGiaoDichCoc(contractId, "THU_COC", "9999999.00");

        Long foreignRoom = themPhong(2L, "B-901", false);
        Long foreignTenant = themNguoiThue("Nguoi thue ngoai pham vi", "0909000002");
        Long foreignContract = themHopDong(foreignRoom, foreignTenant, TODAY.minusDays(5), TODAY.plusDays(25), "HIEU_LUC");
        Long foreignPeriod = themKy(2L, TODAY.minusDays(30), TODAY, "DA_CHOT");
        themHoaDon(foreignPeriod, foreignContract, TODAY.minusDays(1), "DA_PHAT_HANH", "7000000.00", "0.00");

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toaNhaId").value(nullValue()))
                .andExpect(jsonPath("$.coDuLieuTaiChinh").value(true))
                .andExpect(jsonPath("$.kpi.doanhThuPhatHanh").value("1000000.00"))
                .andExpect(jsonPath("$.kpi.daThu").value("500000.00"))
                .andExpect(jsonPath("$.kpi.congNo").value("500000.00"))
                .andExpect(jsonPath("$.kpi.tyLeLapDay").value("50.00"))
                .andExpect(jsonPath("$.kpi.tongSoPhong").value(2))
                .andExpect(jsonPath("$.kpi.soPhongDangThue").value(1))
                .andExpect(jsonPath("$.kpi.soPhongTrong").value(1))
                .andExpect(jsonPath("$.kpi.soSuCoDangMo").value(0))
                .andExpect(jsonPath("$.theoThang", hasSize(1)))
                .andExpect(jsonPath("$.theoThang[0].doanhThuPhatHanh").value("1000000.00"))
                .andExpect(jsonPath("$.theoThang[0].daThu").value("500000.00"))
                .andExpect(jsonPath("$.theoThang[0].congNo").value("500000.00"))
                .andExpect(jsonPath("$.tinhLuc").value("2040-08-15T10:00+07:00"));

        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .param("toaNhaId", "2")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_RPT_01_BR_11_usesInclusiveContractDatesAndEffectiveRepair72HourRuleForCurrentKpis() throws Exception {
        Long occupiedRoom = themPhong(1L, "903", false);
        Long futureRoom = themPhong(1L, "904", false);
        Long stoppedAtBoundaryRoom = themPhong(1L, "905", true);
        Long stoppedAfterBoundaryRoom = themPhong(1L, "906", true);
        Long tenantOne = themNguoiThue("Nguoi thue hien tai", "0909000003");
        Long tenantTwo = themNguoiThue("Nguoi thue tuong lai", "0909000004");
        themHopDong(occupiedRoom, tenantOne, TODAY.minusDays(1), TODAY, "HIEU_LUC");
        themHopDong(futureRoom, tenantTwo, TODAY.plusDays(1), TODAY.plusDays(20), "HIEU_LUC");
        Long atBoundaryRepair = themYeuCauSuaChua(stoppedAtBoundaryRoom, "CHO_XAC_NHAN", NOW.minusSeconds(72 * 60 * 60));
        Long afterBoundaryRepair = themYeuCauSuaChua(stoppedAfterBoundaryRoom, "CHO_XAC_NHAN", NOW.minusSeconds(73 * 60 * 60));
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET cho_xac_nhan_luc = ? WHERE id = ?", java.sql.Timestamp.from(NOW.minusSeconds(72 * 60 * 60)), atBoundaryRepair);
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET cho_xac_nhan_luc = ? WHERE id = ?", java.sql.Timestamp.from(NOW.minusSeconds(73 * 60 * 60)), afterBoundaryRepair);

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .param("toaNhaId", "1")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coDuLieuTaiChinh").value(false))
                .andExpect(jsonPath("$.kpi.tongSoPhong").value(4))
                .andExpect(jsonPath("$.kpi.soPhongDangThue").value(1))
                .andExpect(jsonPath("$.kpi.tyLeLapDay").value("25.00"))
                .andExpect(jsonPath("$.kpi.soPhongTrong").value(1))
                .andExpect(jsonPath("$.kpi.soSuCoDangMo").value(1))
                .andExpect(jsonPath("$.kpi.doanhThuPhatHanh").value("0.00"))
                .andExpect(jsonPath("$.theoThang[0].congNo").value("0.00"));
    }

    @Test
    void FR_RPT_01_D3_deniesWrongRoleAndCrossScopeAndRejectsInvalidDateRange() throws Exception {
        String managerToken = login(3L, "0900000003");
        String tenantToken = login(5L, "0900000006");
        String adminToken = login(1L, "0900000001");

        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bao-cao/tong-quan")
                        .param("tuNgay", "2040-09-01")
                        .param("denNgay", "2040-08-01")
                        .header("Authorization", "Bearer " + login(2L, "0900000002")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value(containsString("khoảng ngày")));
        mockMvc.perform(get("/api/bao-cao/tong-quan"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_RPT_02_FR_RPT_05_listsConsumptionByRoomAndClosedPeriodWithReplacementAndMissingData() throws Exception {
        Long dienId = themDichVu(1L, "Dien", "kWh", true);
        Long nuocId = themDichVu(1L, "Nuoc", "m3", false);
        Long phongCoDuLieu = themPhong(1L, "911", false);
        Long phongThieuDuLieu = themPhong(1L, "912", false);
        Long nguoiThueMot = themNguoiThue("Nguoi thue tieu thu mot", "0909000301");
        Long nguoiThueHai = themNguoiThue("Nguoi thue tieu thu hai", "0909000302");
        Long hopDongMot = themHopDong(phongCoDuLieu, nguoiThueMot, TODAY.minusDays(60), TODAY.plusDays(60), "HIEU_LUC");
        Long hopDongHai = themHopDong(phongThieuDuLieu, nguoiThueHai, TODAY.minusDays(60), TODAY.plusDays(60), "HIEU_LUC");
        themHopDongDichVu(hopDongMot, dienId);
        themHopDongDichVu(hopDongMot, nuocId);
        themHopDongDichVu(hopDongHai, dienId);
        themHopDongDichVu(hopDongHai, nuocId);
        Long kyDaChot = themKy(1L, TODAY.minusDays(30), TODAY.minusDays(1), "DA_CHOT");
        themChiSo(kyDaChot, phongCoDuLieu, dienId, "100.00", "150.00", false, null, null);
        themChiSo(kyDaChot, phongCoDuLieu, nuocId, "100.00", "30.00", true, "140.00", "10.00");

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/tieu-thu")
                        .param("toaNhaId", "1")
                        .param("kyId", kyDaChot.toString())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toaNhaId").value(1))
                .andExpect(jsonPath("$.kyId").value(kyDaChot))
                .andExpect(jsonPath("$.tinhLuc").value("2040-08-15T10:00+07:00"))
                .andExpect(jsonPath("$.cacDong", hasSize(4)))
                .andExpect(jsonPath("$.cacDong[0].soPhong").value("911"))
                .andExpect(jsonPath("$.cacDong[0].donVi").value("kWh"))
                .andExpect(jsonPath("$.cacDong[0].mucTieuThu").value("50.00"))
                .andExpect(jsonPath("$.cacDong[0].coDuLieu").value(true))
                .andExpect(jsonPath("$.cacDong[1].soPhong").value("911"))
                .andExpect(jsonPath("$.cacDong[1].donVi").value("m3"))
                .andExpect(jsonPath("$.cacDong[1].coThayCongTo").value(true))
                .andExpect(jsonPath("$.cacDong[1].chiSoCuoiCongToCu").value("140.00"))
                .andExpect(jsonPath("$.cacDong[1].chiSoDauCongToMoi").value("10.00"))
                .andExpect(jsonPath("$.cacDong[1].mucTieuThu").value("60.00"))
                .andExpect(jsonPath("$.cacDong[2].soPhong").value("912"))
                .andExpect(jsonPath("$.cacDong[2].mucTieuThu").value(nullValue()))
                .andExpect(jsonPath("$.cacDong[2].coDuLieu").value(false))
                .andExpect(jsonPath("$.cacDong[3].soPhong").value("912"))
                .andExpect(jsonPath("$.cacDong[3].mucTieuThu").value(nullValue()))
                .andExpect(jsonPath("$.bieuDo", hasSize(2)))
                .andExpect(jsonPath("$.bieuDo[0].donVi").value("kWh"))
                .andExpect(jsonPath("$.bieuDo[0].mucTieuThu").value("50.00"))
                .andExpect(jsonPath("$.bieuDo[0].soDong").value(2))
                .andExpect(jsonPath("$.bieuDo[0].soDongCoDuLieu").value(1))
                .andExpect(jsonPath("$.bieuDo[1].donVi").value("m3"))
                .andExpect(jsonPath("$.bieuDo[1].mucTieuThu").value("60.00"))
                .andExpect(jsonPath("$.bieuDo[1].soDong").value(2))
                .andExpect(jsonPath("$.bieuDo[1].soDongCoDuLieu").value(1));
    }

    @Test
    void FR_RPT_02_FR_RPT_05_filtersRoomAndPeriodAndDeniesWrongRolesAndForeignBuildings() throws Exception {
        Long dienId = themDichVu(1L, "Dien", "kWh", true);
        Long phong = themPhong(1L, "913", false);
        Long tenantId = themNguoiThue("Nguoi thue loc tieu thu", "0909000303");
        Long contractId = themHopDong(phong, tenantId, TODAY.minusDays(120), TODAY.plusDays(120), "HIEU_LUC");
        themHopDongDichVu(contractId, dienId);
        Long kyCu = themKy(1L, TODAY.minusDays(60), TODAY.minusDays(31), "DA_CHOT");
        Long kyMoi = themKy(1L, TODAY.minusDays(30), TODAY.minusDays(1), "DA_CHOT");
        themChiSo(kyCu, phong, dienId, "10.00", "20.00", false, null, null);
        themChiSo(kyMoi, phong, dienId, "20.00", "35.00", false, null, null);
        Long toaNhaNgoaiPhamVi = themToaNha("RPT-CONSUMPTION-FOREIGN");
        Long phongNgoaiPhamVi = themPhong(toaNhaNgoaiPhamVi, "914", false);
        Long tenantNgoaiPhamVi = themNguoiThue("Nguoi thue toa ngoai", "0909000304");
        Long contractNgoaiPhamVi = themHopDong(phongNgoaiPhamVi, tenantNgoaiPhamVi, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        themHopDongDichVu(contractNgoaiPhamVi, dienId);

        String ownerToken = login(2L, "0900000002");
        mockMvc.perform(get("/api/bao-cao/tieu-thu")
                        .param("toaNhaId", "1")
                        .param("phongId", phong.toString())
                        .param("kyId", kyCu.toString())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacDong", hasSize(1)))
                .andExpect(jsonPath("$.cacDong[0].kyId").value(kyCu))
                .andExpect(jsonPath("$.cacDong[0].mucTieuThu").value("10.00"));

        mockMvc.perform(get("/api/bao-cao/tieu-thu")
                        .param("toaNhaId", toaNhaNgoaiPhamVi.toString())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/tieu-thu")
                        .param("toaNhaId", "1")
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/tieu-thu")
                        .param("toaNhaId", "1")
                        .header("Authorization", "Bearer " + login(1L, "0900000001")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/tieu-thu")).andExpect(status().isUnauthorized());
    }

    @Test
    void NFR_USA_02_measuresFiveBuildingsFiftyRoomsTwentyFourPeriodsWithinThreeSeconds() throws Exception {
        Long tenantId = themNguoiThue("Nguoi thue perf bao cao", "0909000100");
        List<Long> toaNhaIds = new ArrayList<>();
        List<Object[]> hoaDonBatch = new ArrayList<>();
        YearMonth thangDau = YearMonth.of(2039, 9);

        for (int toaIndex = 0; toaIndex < 5; toaIndex++) {
            Long toaNhaId = themToaNha("PERF-" + toaIndex);
            toaNhaIds.add(toaNhaId);
            jdbcTemplate.update(
                    "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, ?)",
                    toaNhaId
            );
            List<Long> kyIds = new ArrayList<>();
            for (int kyIndex = 0; kyIndex < 24; kyIndex++) {
                YearMonth thang = thangDau.plusMonths(kyIndex);
                kyIds.add(themKy(toaNhaId, thang.atDay(1), thang.atEndOfMonth(), "DA_CHOT"));
            }
            for (int phongIndex = 0; phongIndex < 50; phongIndex++) {
                Long phongId = themPhong(toaNhaId, "%d-%02d".formatted(toaIndex, phongIndex), false);
                Long hopDongId = themHopDong(phongId, tenantId, TODAY.minusDays(1), TODAY.plusYears(3), "HIEU_LUC");
                for (Long kyId : kyIds) {
                    hoaDonBatch.add(new Object[]{
                            "PERF-" + UUID.randomUUID(),
                            kyId,
                            hopDongId,
                            java.sql.Date.valueOf(thangDau.plusMonths(hoaDonBatch.size() % 24L).atEndOfMonth()),
                            java.sql.Date.valueOf(thangDau.plusMonths(hoaDonBatch.size() % 24L).atEndOfMonth().plusDays(7)),
                            new BigDecimal("1000000.00"),
                            BigDecimal.ZERO,
                            "DA_PHAT_HANH",
                    });
                }
            }
        }
        jdbcTemplate.batchUpdate(
                """
                        INSERT INTO HOA_DON(
                            ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan,
                            tong_tien, da_thu, trang_thai
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                hoaDonBatch
        );

        String ownerToken = login(2L, "0900000002");
        String endpoint = "/api/bao-cao/tong-quan?tuNgay=2039-09-01&denNgay=2041-08-31";
        mockMvc.perform(get(endpoint).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpi.tongSoPhong").value(250))
                .andExpect(jsonPath("$.theoThang", hasSize(24)));

        long started = System.nanoTime();
        mockMvc.perform(get(endpoint).header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theoThang", hasSize(24)));
        long elapsedMillis = (System.nanoTime() - started) / 1_000_000;

        assertTrue(elapsedMillis < 3_000, "Báo cáo 5 toà x 50 phòng x 24 kỳ mất " + elapsedMillis + " ms");
        assertTrue(toaNhaIds.size() == 5, "fixture phải có đủ năm toà");
    }

    @Test
    void FR_RPT_02_FR_RPT_03_listsScopedUnpaidInvoicesInOverdueOrderWithoutMixingContracts() throws Exception {
        Long room = themPhong(1L, "907", false);
        Long oldTenant = themNguoiThue("Nguoi thue cu", "0909000201");
        Long newTenant = themNguoiThue("Nguoi thue moi", "0909000202");
        Long oldContract = themHopDong(room, oldTenant, TODAY.minusDays(90), TODAY.minusDays(30), "DA_THANH_LY");
        Long newContract = themHopDong(room, newTenant, TODAY.minusDays(20), TODAY.plusDays(20), "HIEU_LUC");
        Long period = themKy(1L, TODAY.withDayOfMonth(1), TODAY.withDayOfMonth(1).plusMonths(1).minusDays(1), "DA_CHOT");
        Long overdueInvoice = themHoaDon(period, oldContract, TODAY.minusDays(30), "QUA_HAN", "1000000.00", "0.00");
        themChiTiet(overdueInvoice, "Tien phong", "600000.00");
        themChiTiet(overdueInvoice, "Dich vu", "400000.00");
        Long paymentId = themThanhToan(overdueInvoice, new BigDecimal("600000.00"), "THU", null, null, "RPT-NO-THU");
        themThanhToan(overdueInvoice, new BigDecimal("-100000.00"), "DOI_UNG", paymentId, "Sua so tien", "RPT-NO-DOI-UNG");
        Long dueTodayInvoice = themHoaDon(period, newContract, TODAY.minusDays(7), "DA_PHAT_HANH", "2000000.00", "0.00");
        Long boundaryRoom = themPhong(1L, "910", false);
        Long boundaryTenant = themNguoiThue("Nguoi thue bien han", "0909000206");
        Long boundaryContract = themHopDong(boundaryRoom, boundaryTenant, TODAY.minusDays(10), TODAY.plusDays(20), "HIEU_LUC");
        Long dueYesterdayInvoice = themHoaDon(period, boundaryContract, TODAY.minusDays(8), "QUA_HAN", "750000.00", "0.00");

        Long paidRoom = themPhong(1L, "908", false);
        Long paidTenant = themNguoiThue("Nguoi thue da tra", "0909000203");
        Long paidContract = themHopDong(paidRoom, paidTenant, TODAY.minusDays(10), TODAY.plusDays(20), "HIEU_LUC");
        Long paidInvoice = themHoaDon(period, paidContract, TODAY.minusDays(8), "DA_THANH_TOAN", "3000000.00", "0.00");
        themThanhToan(paidInvoice, new BigDecimal("4000000.00"), "THU", null, null, "RPT-NO-OVERPAID");

        Long foreignRoom = themPhong(2L, "B-907", false);
        Long foreignTenant = themNguoiThue("Nguoi thue ngoai pham vi", "0909000204");
        Long foreignContract = themHopDong(foreignRoom, foreignTenant, TODAY.minusDays(10), TODAY.plusDays(20), "HIEU_LUC");
        Long foreignPeriod = themKy(2L, TODAY.withDayOfMonth(1), TODAY.withDayOfMonth(1).plusMonths(1).minusDays(1), "DA_CHOT");
        Long foreignInvoice = themHoaDon(foreignPeriod, foreignContract, TODAY.minusDays(30), "QUA_HAN", "9000000.00", "0.00");

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/cong-no")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tinhLuc").value("2040-08-15T10:00+07:00"))
                .andExpect(jsonPath("$.congNo", hasSize(3)))
                .andExpect(jsonPath("$.congNo[0].hoaDonId").value(overdueInvoice))
                .andExpect(jsonPath("$.congNo[0].toaNhaId").value(1))
                .andExpect(jsonPath("$.congNo[0].soPhong").value("907"))
                .andExpect(jsonPath("$.congNo[0].hoTenNguoiThue").value("Nguoi thue cu"))
                .andExpect(jsonPath("$.congNo[0].hopDongId").value(oldContract))
                .andExpect(jsonPath("$.congNo[0].tongTien").value("1000000.00"))
                .andExpect(jsonPath("$.congNo[0].daThu").value("500000.00"))
                .andExpect(jsonPath("$.congNo[0].conLai").value("500000.00"))
                .andExpect(jsonPath("$.congNo[0].soNgayQuaHan").value(23))
                .andExpect(jsonPath("$.congNo[1].hoaDonId").value(dueYesterdayInvoice))
                .andExpect(jsonPath("$.congNo[1].hoTenNguoiThue").value("Nguoi thue bien han"))
                .andExpect(jsonPath("$.congNo[1].hopDongId").value(boundaryContract))
                .andExpect(jsonPath("$.congNo[1].soNgayQuaHan").value(1))
                .andExpect(jsonPath("$.congNo[2].hoaDonId").value(dueTodayInvoice))
                .andExpect(jsonPath("$.congNo[2].hoTenNguoiThue").value("Nguoi thue moi"))
                .andExpect(jsonPath("$.congNo[2].hopDongId").value(newContract))
                .andExpect(jsonPath("$.congNo[2].soNgayQuaHan").value(0))
                .andExpect(jsonPath("$.congNo[*].hoaDonId").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItems(paidInvoice, foreignInvoice))));

        mockMvc.perform(get("/api/bao-cao/cong-no")
                        .param("toaNhaId", "2")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_RPT_03_supportsSettlementInvoiceDrillDownAndDeniesWrongRoles() throws Exception {
        Long room = themPhong(1L, "909", false);
        Long tenantId = themNguoiThue("Nguoi thue quyet toan", "0909000205");
        Long contractId = themHopDong(room, tenantId, TODAY.minusDays(60), TODAY.minusDays(30), "DA_THANH_LY");
        Long invoiceId = themHoaDonQuyetToan(contractId, TODAY.minusDays(5), "QUYET-TOAN-RPT", "1250000.00");
        themChiTiet(invoiceId, "Khoan phai thu quyet toan", "1250000.00");

        String ownerToken = login(2L, "0900000002");
        mockMvc.perform(get("/api/bao-cao/cong-no/hoa-don/" + invoiceId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoaDonId").value(invoiceId))
                .andExpect(jsonPath("$.kyId").value(nullValue()))
                .andExpect(jsonPath("$.hopDongId").value(contractId))
                .andExpect(jsonPath("$.nguoiThue").value("Nguoi thue quyet toan"));

        String managerToken = login(3L, "0900000003");
        mockMvc.perform(get("/api/bao-cao/cong-no")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bao-cao/cong-no/hoa-don/" + invoiceId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bao-cao/cong-no"))
                .andExpect(status().isUnauthorized());
    }

    @TestConfiguration
    static class ReportClockConfiguration {
        @Bean
        @Primary
        Clock reportClock() {
            return Clock.fixed(NOW, ZONE);
        }
    }

    private Long themPhong(Long toaNhaId, String soPhong, boolean ngungChoThue) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai, ngung_cho_thue)
                        VALUES (?, ?, 9, 25.00, 2, 3000000.00, 'Studio', 'TRONG', ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                ngungChoThue
        );
    }

    private Long themToaNha(String maToa) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO TOA_NHA(
                            ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt,
                            tk_ngan_hang, ma_ngan_hang, nguong_that_thoat
                        ) VALUES (?, ?, 'Dia chi fixture', 5, 25, 7, '9704000000000999', '970405', 150000.00)
                        RETURNING id
                        """,
                Long.class,
                maToa,
                "Toà hiệu năng " + maToa
        );
    }

    private Long themNguoiThue(String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan)
                        VALUES (?, DATE '1990-01-01', ?, ?, 'Ha Noi')
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                "CC" + UUID.randomUUID().toString().replace("-", "").substring(0, 8)
        );
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, LocalDate ngayBatDau, LocalDate ngayKetThuc, String trangThai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?, ?, 3000000.00, 3000000.00, 30, ?)
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc),
                trangThai
        );
    }

    private Long themDichVu(Long toaNhaId, String ten, String donVi, boolean laDien) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'THEO_CHI_SO', 'CO_DINH', ?, ?, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten,
                donVi,
                laDien
        );
    }

    private void themHopDongDichVu(Long hopDongId, Long dichVuId) {
        jdbcTemplate.update(
                "INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 1.00)",
                hopDongId,
                dichVuId
        );
    }

    private void themChiSo(
            Long kyId,
            Long phongId,
            Long dichVuId,
            String chiSoDau,
            String chiSoCuoi,
            boolean thayCongTo,
            String chiSoCuoiCongToCu,
            String chiSoDauCongToMoi
    ) {
        jdbcTemplate.update(
                """
                        INSERT INTO CHI_SO_DICH_VU(
                            ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi,
                            co_thay_cong_to, chi_so_cuoi_cong_to_cu, chi_so_dau_cong_to_moi, nguoi_ghi_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 3)
                        """,
                kyId,
                phongId,
                dichVuId,
                new BigDecimal(chiSoDau),
                new BigDecimal(chiSoCuoi),
                thayCongTo,
                chiSoCuoiCongToCu == null ? null : new BigDecimal(chiSoCuoiCongToCu),
                chiSoDauCongToMoi == null ? null : new BigDecimal(chiSoDauCongToMoi)
        );
    }

    private Long themKy(Long toaNhaId, LocalDate ngayBatDau, LocalDate ngayKetThuc, String trangThai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ngayKetThuc.getYear(),
                ngayKetThuc.getMonthValue(),
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc),
                trangThai
        );
    }

    private Long themHoaDon(Long kyId, Long hopDongId, LocalDate ngayPhatHanh, String trangThai, String tongTien, String daThu) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                "RPT-" + UUID.randomUUID(),
                kyId,
                hopDongId,
                java.sql.Date.valueOf(ngayPhatHanh),
                java.sql.Date.valueOf(ngayPhatHanh.plusDays(7)),
                new BigDecimal(tongTien),
                new BigDecimal(daThu),
                trangThai
        );
    }

    private Long themHoaDonQuyetToan(Long hopDongId, LocalDate ngayPhatHanh, String maHoaDon, String tongTien) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES (?, NULL, ?, ?, ?, ?, 0.00, 'DA_PHAT_HANH')
                        RETURNING id
                        """,
                Long.class,
                maHoaDon,
                hopDongId,
                java.sql.Date.valueOf(ngayPhatHanh),
                java.sql.Date.valueOf(ngayPhatHanh.plusDays(7)),
                new BigDecimal(tongTien)
        );
    }

    private void themChiTiet(Long hoaDonId, String tenKhoan, String thanhTien) {
        jdbcTemplate.update(
                "INSERT INTO CHI_TIET_HOA_DON(hoa_don_id, ten_khoan, thanh_tien, loai_khoan) VALUES (?, ?, ?, 'DICH_VU')",
                hoaDonId,
                tenKhoan,
                new BigDecimal(thanhTien)
        );
    }

    private Long themThanhToan(Long hoaDonId, BigDecimal soTien, String loai, Long dieuChinhChoId, String lyDo, String maBienLai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO THANH_TOAN(hoa_don_id, so_tien, loai, dieu_chinh_cho_id, ly_do, ma_bien_lai)
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                hoaDonId,
                soTien,
                loai,
                dieuChinhChoId,
                lyDo,
                maBienLai
        );
    }

    private void themGiaoDichCoc(Long hopDongId, String loai, String soTien) {
        jdbcTemplate.update(
                "INSERT INTO GIAO_DICH_COC(hop_dong_id, loai, so_tien, ngay, nguoi_thu_id, ly_do) VALUES (?, ?, ?, ?, 2, 'RPT fixture')",
                hopDongId,
                loai,
                new BigDecimal(soTien),
                java.sql.Date.valueOf(TODAY)
        );
    }

    private Long themYeuCauSuaChua(Long phongId, String trangThai, Instant choXacNhanLuc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO YEU_CAU_SUA_CHUA(phong_id, nguoi_tao_id, hang_muc, mo_ta, muc_do, trang_thai, cho_xac_nhan_luc, tao_luc)
                        VALUES (?, 5, 'Dien', 'Su co fixture', 'KHAN_CAP', ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                phongId,
                trangThai,
                choXacNhanLuc == null ? null : java.sql.Timestamp.from(choXacNhanLuc),
                java.sql.Timestamp.from(NOW.minusSeconds(96 * 60 * 60))
        );
    }

    private String login(Long userId, String phone) throws Exception {
        String runtimePassword = "RPT-Password-" + userId;
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?", passwordHasher.hash(runtimePassword), userId);
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(phone, runtimePassword)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }

    private void xoaNeuBangTonTai(String table) {
        jdbcTemplate.update("DELETE FROM " + table);
    }
}
