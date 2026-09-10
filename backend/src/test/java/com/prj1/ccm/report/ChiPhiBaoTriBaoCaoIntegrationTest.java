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
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(ChiPhiBaoTriBaoCaoIntegrationTest.ReportClockConfiguration.class)
class ChiPhiBaoTriBaoCaoIntegrationTest {
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
        xoaNeuBangTonTai("THONG_BAO");
        xoaNeuBangTonTai("KHOAN_PHAT_SINH");
        xoaNeuBangTonTai("YEU_CAU_SUA_CHUA");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("NGUOI_THUE");
        xoaNeuBangTonTai("PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (1, 2, 3, 4, 5)");
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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1)");
    }

    @Test
    void FR_RPT_02_08_keepsLocalMonthRowsAndChartAmountsSeparateWithoutDoubleCountingRepairExtras() throws Exception {
        Long room = themPhong(1L, "901", false);
        Long tenantId = themNguoiThue("Nguoi thue bao tri", "0909000401");
        Long contractId = themHopDong(room, tenantId, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");

        Long ownerRepair = themYeuCau(
                room, contractId, "DANG_XU_LY", "CHU_NHA", "1000.00", "Dien", instantAtLocal("2040-08-01T23:30:00")
        );
        Long secondOwnerRepair = themYeuCau(
                room, contractId, "DA_DONG", "CHU_NHA", "500.50", "Dien", instantAtLocal("2040-08-15T09:00:00")
        );
        Long missingCostRepair = themYeuCau(
                room, contractId, "DANG_XU_LY", null, null, "Son", instantAtLocal("2040-08-20T09:00:00")
        );
        Long tenantRepair = themYeuCau(
                room, contractId, "CHO_XAC_NHAN", "NGUOI_THUE", "300.25", "Ong nuoc", instantAtLocal("2040-08-31T23:59:00")
        );
        themKhoanPhatSinh(contractId, tenantRepair, "300.25", "CHO_TINH");
        themKhoanPhatSinh(contractId, tenantRepair, "300.25", "DA_TINH");
        themKhoanPhatSinh(contractId, tenantRepair, "300.25", "VO_HIEU");

        themYeuCau(room, contractId, "DA_HUY", "CHU_NHA", "9000.00", "Dien", instantAtLocal("2040-08-10T09:00:00"));
        themYeuCau(room, contractId, "DANG_XU_LY", "CHU_NHA", "7000.00", "Dien", instantAtLocal("2040-09-01T00:30:00"));

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("toaNhaId", "1")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toaNhaId").value(1))
                .andExpect(jsonPath("$.phongId").value(nullValue()))
                .andExpect(jsonPath("$.tuNgay").value("2040-08-01"))
                .andExpect(jsonPath("$.denNgay").value("2040-08-31"))
                .andExpect(jsonPath("$.tinhLuc").value("2040-08-15T10:00+07:00"))
                .andExpect(jsonPath("$.tongChiPhiChuNha").value("1500.50"))
                .andExpect(jsonPath("$.tongChiPhiNguoiThue").value("300.25"))
                .andExpect(jsonPath("$.cacDong", hasSize(4)))
                .andExpect(jsonPath("$.cacDong[0].yeuCauId").value(ownerRepair))
                .andExpect(jsonPath("$.cacDong[0].id").value(ownerRepair))
                .andExpect(jsonPath("$.cacDong[0].hangMuc").value("Dien"))
                .andExpect(jsonPath("$.cacDong[0].thang").value("2040-08"))
                .andExpect(jsonPath("$.cacDong[0].chiPhi").value("1000.00"))
                .andExpect(jsonPath("$.cacDong[0].benChiuChiPhi").value("CHU_NHA"))
                .andExpect(jsonPath("$.cacDong[0].trangThaiChiPhi").value("DA_GHI_NHAN"))
                .andExpect(jsonPath("$.cacDong[0].lienKet").value("/su-co?yeuCauId=" + ownerRepair))
                .andExpect(jsonPath("$.cacDong[2].yeuCauId").value(missingCostRepair))
                .andExpect(jsonPath("$.cacDong[2].chiPhi").value(nullValue()))
                .andExpect(jsonPath("$.cacDong[2].trangThaiChiPhi").value("CHUA_GHI_NHAN"))
                .andExpect(jsonPath("$.cacDong[3].yeuCauId").value(tenantRepair))
                .andExpect(jsonPath("$.cacDong[3].chiPhi").value("300.25"))
                .andExpect(jsonPath("$.cacDong[3].benChiuChiPhi").value("NGUOI_THUE"))
                .andExpect(jsonPath("$.bieuDo", hasSize(1)))
                .andExpect(jsonPath("$.bieuDo[0].thang").value("2040-08"))
                .andExpect(jsonPath("$.bieuDo[0].chiPhiChuNha").value("1500.50"))
                .andExpect(jsonPath("$.bieuDo[0].chiPhiNguoiThue").value("300.25"))
                .andExpect(jsonPath("$.bieuDo[0].soDong").value(4))
                .andExpect(jsonPath("$.bieuDo[0].soDongThieuChiPhi").value(1));
    }

    @Test
    void FR_RPT_02_08_filtersRoomAndDateAndDeniesForeignScopeWrongRolesAndMissingAuthentication() throws Exception {
        Long roomA = themPhong(1L, "902", false);
        Long roomB = themPhong(1L, "903", false);
        Long foreignRoom = themPhong(2L, "B-902", false);
        Long tenantId = themNguoiThue("Nguoi thue loc bao tri", "0909000402");
        Long contractA = themHopDong(roomA, tenantId, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        Long contractB = themHopDong(roomB, tenantId, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        Long foreignContract = themHopDong(foreignRoom, tenantId, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        Long roomRepair = themYeuCau(roomA, contractA, "DANG_XU_LY", "CHU_NHA", "125.00", "Dien", instantAtLocal("2040-08-12T10:00:00"));
        themYeuCau(roomB, contractB, "DANG_XU_LY", "CHU_NHA", "250.00", "Dien", instantAtLocal("2040-08-12T10:00:00"));
        themYeuCau(foreignRoom, foreignContract, "DANG_XU_LY", "CHU_NHA", "9999.00", "Dien", instantAtLocal("2040-08-12T10:00:00"));

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("toaNhaId", "1")
                        .param("phongId", roomA.toString())
                        .param("tuNgay", "2040-08-12")
                        .param("denNgay", "2040-08-12")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacDong", hasSize(1)))
                .andExpect(jsonPath("$.cacDong[0].yeuCauId").value(roomRepair));

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("toaNhaId", "2")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("toaNhaId", "1")
                        .param("phongId", foreignRoom.toString())
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("phongId", foreignRoom.toString())
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-09-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value(containsString("khoảng ngày")));

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "not-a-date")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + login(5L, "0900000006")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + login(1L, "0900000001")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_RPT_02_08_groupsManyRowsAcrossTwoMonthsAndExcludesUnassignedBuildingFromUnfilteredScope() throws Exception {
        Long roomA = themPhong(1L, "904", false);
        Long roomB = themPhong(1L, "905", false);
        Long foreignRoom = themPhong(2L, "B-904", false);
        Long tenantId = themNguoiThue("Nguoi thue nhieu thang", "0909000403");
        Long contractA = themHopDong(roomA, tenantId, TODAY.minusDays(60), TODAY.plusDays(60), "HIEU_LUC");
        Long contractB = themHopDong(roomB, tenantId, TODAY.minusDays(60), TODAY.plusDays(60), "HIEU_LUC");
        Long foreignContract = themHopDong(foreignRoom, tenantId, TODAY.minusDays(60), TODAY.plusDays(60), "HIEU_LUC");

        themYeuCau(roomA, contractA, "DANG_XU_LY", "CHU_NHA", "100.00", "Dien", instantAtLocal("2040-08-03T10:00:00"));
        themYeuCau(roomA, contractA, "DA_DONG", "CHU_NHA", "50.00", "Dien", instantAtLocal("2040-08-04T10:00:00"));
        themYeuCau(roomA, contractA, "DA_DONG", "NGUOI_THUE", "20.25", "Ong nuoc", instantAtLocal("2040-08-05T10:00:00"));
        Long septemberOwner = themYeuCau(roomA, contractA, "DANG_XU_LY", "CHU_NHA", "75.00", "Dien", instantAtLocal("2040-09-03T10:00:00"));
        themYeuCau(roomB, contractB, "DANG_XU_LY", "NGUOI_THUE", "30.00", "Son", instantAtLocal("2040-09-04T10:00:00"));
        Long foreignRepair = themYeuCau(foreignRoom, foreignContract, "DANG_XU_LY", "CHU_NHA", "900.00", "Dien", instantAtLocal("2040-08-06T10:00:00"));

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-09-30")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.toaNhaId").value(nullValue()))
                .andExpect(jsonPath("$.cacDong", hasSize(5)))
                .andExpect(jsonPath("$.cacDong[*].toaNhaId", contains(1, 1, 1, 1, 1)))
                .andExpect(jsonPath("$.tongChiPhiChuNha").value("225.00"))
                .andExpect(jsonPath("$.tongChiPhiNguoiThue").value("50.25"))
                .andExpect(jsonPath("$.bieuDo", hasSize(2)))
                .andExpect(jsonPath("$.bieuDo[0].thang").value("2040-08"))
                .andExpect(jsonPath("$.bieuDo[0].chiPhiChuNha").value("150.00"))
                .andExpect(jsonPath("$.bieuDo[0].chiPhiNguoiThue").value("20.25"))
                .andExpect(jsonPath("$.bieuDo[1].thang").value("2040-09"))
                .andExpect(jsonPath("$.bieuDo[1].chiPhiChuNha").value("75.00"))
                .andExpect(jsonPath("$.bieuDo[1].chiPhiNguoiThue").value("30.00"))
                .andExpect(jsonPath("$.cacNhom", hasSize(4)))
                .andExpect(jsonPath("$.cacNhom[0].toaNhaId").value(1))
                .andExpect(jsonPath("$.cacNhom[0].phongId").value(roomA))
                .andExpect(jsonPath("$.cacNhom[0].hangMuc").value("Dien"))
                .andExpect(jsonPath("$.cacNhom[0].thang").value("2040-08"))
                .andExpect(jsonPath("$.cacNhom[0].chiPhiChuNha").value("150.00"))
                .andExpect(jsonPath("$.cacNhom[0].chiPhiNguoiThue").value(nullValue()))
                .andExpect(jsonPath("$.cacNhom[0].soDong").value(2))
                .andExpect(jsonPath("$.cacNhom[1].hangMuc").value("Ong nuoc"))
                .andExpect(jsonPath("$.cacNhom[1].chiPhiChuNha").value(nullValue()))
                .andExpect(jsonPath("$.cacNhom[1].chiPhiNguoiThue").value("20.25"))
                .andExpect(jsonPath("$.cacNhom[2].thang").value("2040-09"))
                .andExpect(jsonPath("$.cacNhom[2].chiPhiChuNha").value("75.00"))
                .andExpect(jsonPath("$.cacNhom[3].phongId").value(roomB))
                .andExpect(jsonPath("$.cacNhom[3].chiPhiNguoiThue").value("30.00"));

        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + septemberOwner)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(septemberOwner));

        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + foreignRepair)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_RPT_02_08_distinguishesRecordedZeroMissingAmountAndMissingPayerInTotalsAndStatuses() throws Exception {
        Long room = themPhong(1L, "906", false);
        Long tenantId = themNguoiThue("Nguoi thue trang thai chi phi", "0909000404");
        Long contractId = themHopDong(room, tenantId, TODAY.minusDays(30), TODAY.plusDays(30), "HIEU_LUC");
        themYeuCau(room, contractId, "DA_DONG", "CHU_NHA", "0.00", "A-zero", instantAtLocal("2040-08-07T10:00:00"));
        themYeuCau(room, contractId, "DA_DONG", "NGUOI_THUE", null, "B-missing", instantAtLocal("2040-08-08T10:00:00"));
        themYeuCau(room, contractId, "DA_DONG", null, "125.00", "C-payer", instantAtLocal("2040-08-09T10:00:00"));

        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(get("/api/bao-cao/chi-phi-bao-tri")
                        .param("tuNgay", "2040-08-01")
                        .param("denNgay", "2040-08-31")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongChiPhiChuNha").value("0.00"))
                .andExpect(jsonPath("$.tongChiPhiNguoiThue").value(nullValue()))
                .andExpect(jsonPath("$.soDong").value(3))
                .andExpect(jsonPath("$.soDongCoChiPhi").value(1))
                .andExpect(jsonPath("$.soDongThieuChiPhi").value(1))
                .andExpect(jsonPath("$.soDongThieuBenChiuChiPhi").value(1))
                .andExpect(jsonPath("$.cacDong[0].chiPhi").value("0.00"))
                .andExpect(jsonPath("$.cacDong[0].trangThaiChiPhi").value("DA_GHI_NHAN"))
                .andExpect(jsonPath("$.cacDong[1].chiPhi").value(nullValue()))
                .andExpect(jsonPath("$.cacDong[1].trangThaiChiPhi").value("CHUA_GHI_NHAN"))
                .andExpect(jsonPath("$.cacDong[2].chiPhi").value("125.00"))
                .andExpect(jsonPath("$.cacDong[2].coChiPhi").value(false))
                .andExpect(jsonPath("$.cacDong[2].trangThaiChiPhi").value("THIEU_BEN_CHIU_CHI_PHI"));
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

    private Long themYeuCau(
            Long phongId,
            Long hopDongId,
            String trangThai,
            String benChiuChiPhi,
            String chiPhi,
            String hangMuc,
            Instant taoLuc
    ) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO YEU_CAU_SUA_CHUA(
                            phong_id, hop_dong_id, nguoi_tao_id, hang_muc, mo_ta, muc_do, trang_thai,
                            chi_phi, ben_chiu_chi_phi, tao_luc
                        ) VALUES (?, ?, 5, ?, 'Su co fixture', 'KHAN_CAP', ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                phongId,
                hopDongId,
                hangMuc,
                trangThai,
                chiPhi == null ? null : new BigDecimal(chiPhi),
                benChiuChiPhi,
                java.sql.Timestamp.from(taoLuc)
        );
    }

    private void themKhoanPhatSinh(Long hopDongId, Long yeuCauId, String soTien, String trangThai) {
        jdbcTemplate.update(
                """
                        INSERT INTO KHOAN_PHAT_SINH(
                            hop_dong_id, nguon_loai, nguon_id, ten_khoan, so_tien, loai, trang_thai, hoa_don_id
                        ) VALUES (?, 'SUA_CHUA', ?, 'Chi phi sua chua fixture', ?, 'PHAT_SINH', ?, NULL)
                        """,
                hopDongId,
                yeuCauId,
                new BigDecimal(soTien),
                trangThai
        );
    }

    private Instant instantAtLocal(String localDateTime) {
        return java.time.LocalDateTime.parse(localDateTime).atZone(ZONE).toInstant();
    }

    private String login(Long userId, String phone) throws Exception {
        String runtimePassword = "RPT-MAINTENANCE-" + userId;
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
