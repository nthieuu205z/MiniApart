package com.prj1.ccm.portal;

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

import java.sql.Date;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(CongNguoiThueAuthorizationIntegrationTest.PortalClockTestConfiguration.class)
class CongNguoiThueAuthorizationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long ownContractId;
    private Long otherContractId;
    private Long ownTenantId;
    private Long ownRoomId;
    private Long dichVuId;
    private Long latestInvoiceId;
    private Long settlementInvoiceId;
    private Long otherInvoiceId;
    private Long ownMeterPhotoId;
    private Long otherMeterPhotoId;
    private Long emptyTenantId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.anh.link-secret", () -> "slice-06-portal-secret");
        registry.add("app.anh.link-ttl-seconds", () -> 900);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("THANH_TOAN");
        xoaNeuBangTonTai("SO_DU_KHA_DUNG");
        xoaNeuBangTonTai("KHOAN_PHAT_SINH");
        xoaNeuBangTonTai("GIAO_DICH_COC");
        xoaNeuBangTonTai("ANH_DINH_KEM");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON_BAC_THANG");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("HOA_DON");
        xoaNeuBangTonTai("XAC_NHAN_CANH_BAO_CHI_SO");
        xoaNeuBangTonTai("CHI_SO_DICH_VU");
        xoaNeuBangTonTai("NHAN_KHAU_KY");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("NGUOI_O_CUNG");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("KY_THANH_TOAN");
        xoaNeuBangTonTai("DICH_VU");
        xoaNeuBangTonTai("PHONG");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id IN (1, 2, 3, 4, 5)");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET vai_tro = CASE id
                                WHEN 1 THEN 'QTHT'
                                WHEN 2 THEN 'CHU'
                                WHEN 3 THEN 'QUAN_LY'
                                WHEN 4 THEN 'THO'
                                WHEN 5 THEN 'NGUOI_THUE'
                            END,
                            nguoi_thue_id = NULL,
                            phien_ban_token = 0,
                            so_lan_sai = 0,
                            lan_sai_dau_tien = NULL,
                            khoa_den = NULL,
                            trang_thai = 'HOAT_DONG'
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );

        ownTenantId = themNguoiThue("Người thuê cổng A", "0906000101", "CC-PORTAL-101");
        Long otherTenantId = themNguoiThue("Người thuê cổng B", "0906000202", "CC-PORTAL-202");
        emptyTenantId = themNguoiThue("Người thuê chưa có hoá đơn", "0906000303", "CC-PORTAL-303");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", ownTenantId);

        ownRoomId = themPhong("101");
        Long otherRoomId = themPhong("202");
        dichVuId = themDichVu();
        ownContractId = themHopDong(ownRoomId, ownTenantId, "HIEU_LUC");
        otherContractId = themHopDong(otherRoomId, otherTenantId, "HIEU_LUC");
        jdbcTemplate.update(
                "INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 3500.00), (?, ?, 3500.00)",
                ownContractId, dichVuId, otherContractId, dichVuId
        );

        Long kyCuId = themKy(2026, 7, "2026-07-01", "2026-07-31");
        Long kyMoiId = themKy(2026, 8, "2026-08-01", "2026-08-31");
        Long kyKhacId = themKy(2026, 9, "2026-09-01", "2026-09-30");
        themChiSo(kyMoiId, ownRoomId, dichVuId);
        Long otherChiSoId = themChiSo(kyKhacId, otherRoomId, dichVuId);
        Long ownChiSoId = jdbcTemplate.queryForObject(
                "SELECT id FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Long.class,
                kyMoiId,
                ownRoomId,
                dichVuId
        );
        ownMeterPhotoId = themAnhCongTo(ownChiSoId, "portal-own-meter.jpg");
        otherMeterPhotoId = themAnhCongTo(otherChiSoId, "portal-other-meter.jpg");

        themHoaDon(ownContractId, kyCuId, "PORTAL-A-202607");
        latestInvoiceId = themHoaDon(ownContractId, kyMoiId, "PORTAL-A-202608");
        settlementInvoiceId = themHoaDonQuyetToan(ownContractId, "PORTAL-A-SETTLEMENT");
        otherInvoiceId = themHoaDon(otherContractId, kyKhacId, "PORTAL-B-202609");
    }

    @Test
    void FR_POR_01_tenantReadsLatestOwnInvoiceAndNoInvoiceReturnsExplicitEmptyState() throws Exception {
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don-moi-nhat")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coHoaDon").value(true))
                .andExpect(jsonPath("$.hoaDon.hoaDonId").value(latestInvoiceId))
                .andExpect(jsonPath("$.hoaDon.maHoaDon").value("PORTAL-A-202608"));

        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", emptyTenantId);
        String emptyTenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don-moi-nhat")
                        .header("Authorization", "Bearer " + emptyTenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coHoaDon").value(false))
                .andExpect(jsonPath("$.hoaDon").doesNotExist())
                .andExpect(jsonPath("$.thongBao", containsString("Chưa có hoá đơn")));
    }

    @Test
    void FR_POR_03_tenantReadsAtLeastTwelveOwnPeriodsNewestFirstWithRoomAmountsAndPaymentStatus() throws Exception {
        for (int thang = 1; thang <= 10; thang++) {
            Long kyId = themKy(2025, thang, "2025-%02d-01".formatted(thang), "2025-%02d-28".formatted(thang));
            themHoaDon(ownContractId, kyId, "PORTAL-A-101-2025%02d".formatted(thang));
        }

        Long phongDaThanhLyId = themPhong("303");
        Long hopDongDaThanhLyId = themHopDong(phongDaThanhLyId, ownTenantId, "DA_THANH_LY");
        Long kyDaThanhLyId = themKy(2024, 12, "2024-12-01", "2024-12-31");
        Long settledContractInvoiceId = themHoaDon(hopDongDaThanhLyId, kyDaThanhLyId, "PORTAL-A-303-202412");

        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(14))
                .andExpect(jsonPath("$[0].hoaDonId").value(latestInvoiceId))
                .andExpect(jsonPath("$[0].nam").value(2026))
                .andExpect(jsonPath("$[0].thang").value(8))
                .andExpect(jsonPath("$[0].soPhong").value("101"))
                .andExpect(jsonPath("$[0].tongTien").value("3889500.00"))
                .andExpect(jsonPath("$[0].daThu").value("0.00"))
                .andExpect(jsonPath("$[0].conLai").value("3889500.00"))
                .andExpect(jsonPath("$[0].trangThai").value("DA_PHAT_HANH"))
                .andExpect(jsonPath("$[0].trangThaiThanhToan").value("CHUA_THANH_TOAN"))
                .andExpect(jsonPath("$[12].hoaDonId").value(settledContractInvoiceId))
                .andExpect(jsonPath("$[12].hopDongId").value(hopDongDaThanhLyId))
                .andExpect(jsonPath("$[12].soPhong").value("303"))
                .andExpect(jsonPath("$[12].hopDongTrangThai").value("DA_THANH_LY"))
                .andExpect(jsonPath("$[?(@.hoaDonId == %d)].kyId".formatted(settlementInvoiceId)).value(hasItem(nullValue())));
    }

    @Test
    void FR_POR_03_historyUsesEffectiveOverdueStateForUnpaidAndPartialInvoices() throws Exception {
        Long unpaidKyId = themKy(2026, 5, "2026-05-01", "2026-05-31");
        Long unpaidInvoiceId = themHoaDon(ownContractId, unpaidKyId, "PORTAL-A-101-OVERDUE");
        jdbcTemplate.update("UPDATE HOA_DON SET han_thanh_toan = DATE '2026-08-01' WHERE id = ?", unpaidInvoiceId);

        Long partialKyId = themKy(2026, 6, "2026-06-01", "2026-06-30");
        Long partialInvoiceId = themHoaDon(ownContractId, partialKyId, "PORTAL-A-101-PARTIAL-OVERDUE");
        jdbcTemplate.update("UPDATE HOA_DON SET han_thanh_toan = DATE '2026-08-01' WHERE id = ?", partialInvoiceId);
        jdbcTemplate.update(
                "INSERT INTO THANH_TOAN (hoa_don_id, so_tien, loai, hinh_thuc, ngay_thu, nguoi_thu_id) VALUES (?, 100000.00, 'THU', 'TIEN_MAT', DATE '2026-08-01', 3)",
                partialInvoiceId
        );

        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.hoaDonId == %d)].trangThai".formatted(unpaidInvoiceId)).value(hasItem("QUA_HAN")))
                .andExpect(jsonPath("$[?(@.hoaDonId == %d)].trangThaiThanhToan".formatted(unpaidInvoiceId)).value(hasItem("QUA_HAN")))
                .andExpect(jsonPath("$[?(@.hoaDonId == %d)].trangThai".formatted(partialInvoiceId)).value(hasItem("QUA_HAN")))
                .andExpect(jsonPath("$[?(@.hoaDonId == %d)].trangThaiThanhToan".formatted(partialInvoiceId)).value(hasItem("QUA_HAN")));
    }

    @Test
    void FR_POR_03_tenantGetsExactlyAvailablePeriodsAndARealEmptyState() throws Exception {
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[2].hoaDonId").value(settlementInvoiceId))
                .andExpect(jsonPath("$[2].kyId").value(nullValue()));

        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", emptyTenantId);
        String emptyTenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don")
                        .header("Authorization", "Bearer " + emptyTenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void FR_POR_05_tenantReadsTwelvePeriodsWithElectricityAndWaterSeparatedAndOwnScope() throws Exception {
        Long oldInvoiceId = jdbcTemplate.queryForObject(
                "SELECT id FROM HOA_DON WHERE ma_hoa_don = 'PORTAL-A-202607'", Long.class);
        Long waterId = jdbcTemplate.queryForObject(
                "INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 'Nước cổng người thuê', 'THEO_CHI_SO', 'CO_DINH', 'm3', FALSE, TRUE) RETURNING id",
                Long.class
        );
        jdbcTemplate.update(
                "INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 18000.00)",
                ownContractId,
                waterId
        );

        themDongDichVu(oldInvoiceId, dichVuId, "90.00", "100.00", "10.00");
        themDongDichVu(latestInvoiceId, dichVuId, "100.00", "125.00", "25.00");
        themDongDichVu(latestInvoiceId, waterId, "40.00", "46.25", "6.25");
        themDongDichVu(otherInvoiceId, dichVuId, "1.00", "999.00", "998.00");

        for (int thang = 1; thang <= 11; thang++) {
            Long kyId = themKy(2025, thang, "2025-%02d-01".formatted(thang), "2025-%02d-28".formatted(thang));
            Long hoaDonId = themHoaDon(ownContractId, kyId, "PORTAL-A-101-2025%02d-CHART".formatted(thang));
            themDongDichVu(
                    hoaDonId,
                    dichVuId,
                    new java.math.BigDecimal(thang).setScale(2).toPlainString(),
                    new java.math.BigDecimal(thang + 10).setScale(2).toPlainString(),
                    "10.00"
            );
        }

        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/tieu-thu")
                        .param("soKy", "12")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dien.length()").value(12))
                .andExpect(jsonPath("$.dien[0].hoaDonId").value(latestInvoiceId))
                .andExpect(jsonPath("$.dien[0].soPhong").value("101"))
                .andExpect(jsonPath("$.dien[0].donVi").value("kWh"))
                .andExpect(jsonPath("$.dien[0].chiSoDau").value("100.00"))
                .andExpect(jsonPath("$.dien[0].chiSoCuoi").value("125.00"))
                .andExpect(jsonPath("$.dien[0].mucTieuThu").value("25.00"))
                .andExpect(jsonPath("$.dien[*].soPhong").value(not(hasItem("202"))))
                .andExpect(jsonPath("$.nuoc.length()").value(1))
                .andExpect(jsonPath("$.nuoc[0].tenDichVu").value("Nước cổng người thuê"))
                .andExpect(jsonPath("$.nuoc[0].donVi").value("m3"))
                .andExpect(jsonPath("$.nuoc[0].mucTieuThu").value("6.25"));
    }

    @Test
    void FR_POR_05_tenantWithoutMeterInvoicesGetsTwoEmptySeries() throws Exception {
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", emptyTenantId);
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/tieu-thu")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dien.length()").value(0))
                .andExpect(jsonPath("$.nuoc.length()").value(0));
    }

    @Test
    void FR_POR_04_tenantCannotReadGuessableForeignInvoicePhotoOrContract() throws Exception {
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hoa-don/" + otherInvoiceId)
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/anh/" + otherMeterPhotoId + "/lien-ket")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/cong/hop-dong/" + otherContractId)
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/anh/" + ownMeterPhotoId + "/lien-ket")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value(containsString("/api/anh/" + ownMeterPhotoId + "/xem?")));
    }

    @Test
    void FR_POR_04_settledTenantCanReadOwnContractAndWrongRolesReceive403() throws Exception {
        jdbcTemplate.update("UPDATE HOP_DONG SET trang_thai = 'DA_THANH_LY' WHERE id = ?", ownContractId);
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(get("/api/cong/hop-dong")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(ownContractId))
                .andExpect(jsonPath("$[0].trangThai").value("DA_THANH_LY"));

        mockMvc.perform(get("/api/cong/hop-dong/" + ownContractId)
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ownContractId))
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_LY"));

        mockMvc.perform(get("/api/cong/hoa-don/" + latestInvoiceId)
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoaDonId").value(latestInvoiceId));

        mockMvc.perform(get("/api/cong/hoa-don/" + settlementInvoiceId)
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoaDonId").value(settlementInvoiceId))
                .andExpect(jsonPath("$.kyId").value(nullValue()));

        assert403OnPortalEndpoints(login(1L, "0900000001"));
        assert403OnPortalEndpoints(login(4L, "0900000004"));
    }

    @Test
    void FR_POR_04_lockedTenantLosesPortalAccessImmediately() throws Exception {
        String tenantToken = login(5L, "0900000006");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET trang_thai = 'BI_KHOA' WHERE id = 5");

        mockMvc.perform(get("/api/cong/hoa-don-moi-nhat")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isUnauthorized());
    }

    private void assert403OnPortalEndpoints(String token) throws Exception {
        mockMvc.perform(get("/api/cong/hoa-don-moi-nhat")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/cong/hoa-don")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/cong/tieu-thu")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/cong/hoa-don/" + latestInvoiceId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/cong/hop-dong")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/anh/" + ownMeterPhotoId + "/lien-ket")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ?, trang_thai = 'HOAT_DONG' WHERE id = ?",
                passwordHasher.hash(runtimePassword),
                nguoiDungId
        );
        String body = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(soDienThoai, runtimePassword)))
                .andReturn()
                .getResponse()
                .getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }

    private Long themNguoiThue(String hoTen, String soDienThoai, String soGiayTo) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES (?, DATE '1990-01-01', ?, ?, 'Hà Nội') RETURNING id",
                Long.class,
                hoTen,
                soDienThoai,
                soGiayTo
        );
    }

    private Long themPhong(String soPhong) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (1, ?, 1, 25.00, 4, 3500000.00, 'Tieu chuan', 'DANG_THUE') RETURNING id",
                Long.class,
                soPhong
        );
    }

    private Long themDichVu() {
        return jdbcTemplate.queryForObject(
                "INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 'Điện cổng người thuê', 'THEO_CHI_SO', 'CO_DINH', 'kWh', TRUE, TRUE) RETURNING id",
                Long.class
        );
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, String trangThai) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (?, ?, DATE '2026-01-01', DATE '2026-12-31', 3500000.00, 3500000.00, 30, ?) RETURNING id",
                Long.class,
                phongId,
                nguoiThueId,
                trangThai
        );
    }

    private Long themKy(int nam, int thang, String ngayBatDau, String ngayKetThuc) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (1, ?, ?, ?, ?, 'DA_CHOT') RETURNING id",
                Long.class,
                nam,
                thang,
                Date.valueOf(ngayBatDau),
                Date.valueOf(ngayKetThuc)
        );
    }

    private Long themChiSo(Long kyId, Long phongId, Long dichVuId) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO CHI_SO_DICH_VU (ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, co_thay_cong_to, nguoi_ghi_id) VALUES (?, ?, ?, 100.00, 125.00, FALSE, 3) RETURNING id",
                Long.class,
                kyId,
                phongId,
                dichVuId
        );
    }

    private Long themAnhCongTo(Long chiSoId, String khoaLuuTru) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO ANH_DINH_KEM (doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc) VALUES ('CHI_SO_DICH_VU', ?, ?, NULL, 'image/jpeg', 4) RETURNING id",
                Long.class,
                chiSoId,
                khoaLuuTru
        );
    }

    private void themDongDichVu(Long hoaDonId, Long dichVuId, String chiSoDau, String chiSoCuoi, String soLuong) {
        jdbcTemplate.update(
                "INSERT INTO CHI_TIET_HOA_DON (hoa_don_id, dich_vu_id, ten_khoan, chi_so_dau, chi_so_cuoi, so_luong, don_gia, thanh_tien, loai_khoan) VALUES (?, ?, 'Dịch vụ đo chỉ số', ?, ?, ?, 3500.00, 35000.00, 'DICH_VU')",
                hoaDonId,
                dichVuId,
                new java.math.BigDecimal(chiSoDau),
                new java.math.BigDecimal(chiSoCuoi),
                new java.math.BigDecimal(soLuong)
        );
    }

    private Long themHoaDon(Long hopDongId, Long kyId, String maHoaDon) {
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai, so_nguoi_o, so_ho_quy_doi, giai_thich_so_ho) VALUES (?, ?, ?, DATE '2026-08-31', DATE '2026-09-07', 3889500.00, 0.00, 'DA_PHAT_HANH', 2, 1, 'Dữ liệu kiểm thử') RETURNING id",
                Long.class,
                maHoaDon,
                kyId,
                hopDongId
        );
        jdbcTemplate.update(
                "INSERT INTO CHI_TIET_HOA_DON (hoa_don_id, ten_khoan, so_luong, don_gia, thanh_tien, loai_khoan) VALUES (?, 'Tiền phòng', 31.00, 3500000.00, 3500000.00, 'TIEN_PHONG')",
                id
        );
        return id;
    }

    private Long themHoaDonQuyetToan(Long hopDongId, String maHoaDon) {
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai, so_nguoi_o, so_ho_quy_doi, giai_thich_so_ho) VALUES (?, NULL, ?, DATE '2026-09-30', DATE '2026-10-07', 120000.00, 0.00, 'DA_PHAT_HANH', NULL, NULL, 'Hoá đơn quyết toán') RETURNING id",
                Long.class,
                maHoaDon,
                hopDongId
        );
        jdbcTemplate.update(
                "INSERT INTO CHI_TIET_HOA_DON (hoa_don_id, ten_khoan, thanh_tien, loai_khoan) VALUES (?, 'Quyết toán hợp đồng', 120000.00, 'KHOAN_PHAT_SINH')",
                id
        );
        return id;
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

    @TestConfiguration(proxyBeanMethods = false)
    static class PortalClockTestConfiguration {
        @Bean
        @Primary
        Clock portalClock() {
            return Clock.fixed(Instant.parse("2026-09-02T00:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        }
    }
}
