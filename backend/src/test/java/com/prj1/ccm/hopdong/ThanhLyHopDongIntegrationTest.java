package com.prj1.ccm.hopdong;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.springframework.dao.DataIntegrityViolationException;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ThanhLyHopDongIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long hopDongId;
    private Long hopDongNgoaiToaId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoa("GIAO_DICH_COC");
        xoa("SO_DU_KHA_DUNG");
        xoa("THANH_TOAN");
        xoa("CHI_TIET_HOA_DON_BAC_THANG");
        xoa("CHI_TIET_HOA_DON");
        xoa("HOA_DON");
        xoa("NHAN_KHAU_KY");
        xoa("CHI_SO_DICH_VU");
        xoa("HOP_DONG_DICH_VU");
        xoa("HOP_DONG");
        xoa("NGUOI_THUE");
        xoa("BANG_GIA");
        xoa("DICH_VU");
        xoa("PHONG");
        xoa("KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL, phien_ban_token = 0 WHERE id IN (1, 2, 3, 4, 5)");

        Long phongId = themPhong(1L, "901");
        Long nguoiThueId = themNguoiThue("0909010001", "0799010001");
        Long dichVuId = themDichVuCoDinh(1L);
        hopDongId = themHopDong(phongId, nguoiThueId, dichVuId, "HIEU_LUC", "10000000.00");
        themKyMo(1L);

        Long phongNgoaiToaId = themPhong(2L, "902");
        Long nguoiThueNgoaiToaId = themNguoiThue("0909020002", "0799020002");
        hopDongNgoaiToaId = themHopDong(phongNgoaiToaId, nguoiThueNgoaiToaId, null, "HIEU_LUC", "10000000.00");
    }

    @Test
    void FR_TNT_08_FR_TNT_09_BR_07_createsFinalInvoiceThenRefundsOnlyCollectedDeposit() throws Exception {
        thuCoc(hopDongId, "7000000.00");

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_LY"))
                .andExpect(jsonPath("$.quyetToan.hoaDonCuoiId").isNumber())
                .andExpect(jsonPath("$.quyetToan.tongHoaDonCuoi").value("307000.00"))
                .andExpect(jsonPath("$.quyetToan.daThuCoc").value("7000000.00"))
                .andExpect(jsonPath("$.quyetToan.congNo").value("307000.00"))
                .andExpect(jsonPath("$.quyetToan.khauTru").value("0.00"))
                .andExpect(jsonPath("$.quyetToan.hoanCoc").value("6693000.00"))
                .andExpect(jsonPath("$.quyetToan.hoaDonQuyetToanId").doesNotExist());

        BigDecimal hoaDonKyCuoi = jdbcTemplate.queryForObject(
                "SELECT tong_tien FROM HOA_DON WHERE hop_dong_id = ? AND ky_id IS NOT NULL", BigDecimal.class, hopDongId);
        BigDecimal hoanCoc = jdbcTemplate.queryForObject(
                "SELECT so_tien FROM GIAO_DICH_COC WHERE hop_dong_id = ? AND loai = 'HOAN_COC'", BigDecimal.class, hopDongId);
        assertThat(hoaDonKyCuoi).isPositive();
        assertThat(hoanCoc).isEqualByComparingTo(new BigDecimal("7000000.00").subtract(hoaDonKyCuoi));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE doi_tuong = ? AND hanh_dong = 'THANH_LY_HOP_DONG'",
                Integer.class, "HOP_DONG:" + hopDongId)).isEqualTo(1);
        String audit = jdbcTemplate.queryForObject("SELECT gia_tri_sau FROM NHAT_KY_THAO_TAC WHERE doi_tuong = ? AND hanh_dong = 'THANH_LY_HOP_DONG'", String.class, "HOP_DONG:" + hopDongId);
        assertThat(audit).contains("hoaDonCuoi=" + jdbcTemplate.queryForObject("SELECT id FROM HOA_DON WHERE hop_dong_id=? AND ky_id IS NOT NULL", Long.class, hopDongId), "tong=307000.00", "daThuCoc=7000000.00", "congNo=307000.00", "khauTru=0.00", "hoan=6693000.00", "hoaDonQT=null");
    }

    @Test
    void FR_TNT_08_recordsFinalMeterReadingBeforeCalculatingFinalInvoice() throws Exception {
        Long phongId = jdbcTemplate.queryForObject("SELECT phong_id FROM HOP_DONG WHERE id = ?", Long.class, hopDongId);
        Long dichVuId = jdbcTemplate.queryForObject("INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (1, 'Điện', 'THEO_CHI_SO', 'CO_DINH', 'kWh', TRUE, TRUE) RETURNING id", Long.class);
        jdbcTemplate.update("INSERT INTO BANG_GIA(dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, 3000.00, DATE '2026-01-01')", dichVuId);
        jdbcTemplate.update("INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 3000.00)", hopDongId, dichVuId);
        thuCoc(hopDongId, "7000000.00");

        mockMvc.perform(post(thanhLyUrl(hopDongId)).header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"chiSoCuoi\":[{\"phongId\":" + phongId + ",\"dichVuId\":" + dichVuId + ",\"chiSoCuoi\":\"50.00\",\"coThayCongTo\":false}]}"))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT chi_so_cuoi FROM CHI_SO_DICH_VU WHERE phong_id = ? AND dich_vu_id = ?", BigDecimal.class, phongId, dichVuId)).isEqualByComparingTo("50.00");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CHI_TIET_HOA_DON c JOIN HOA_DON h ON h.id=c.hoa_don_id WHERE h.hop_dong_id=? AND c.dich_vu_id=? AND c.chi_so_cuoi=50.00", Integer.class, hopDongId, dichVuId)).isEqualTo(1);
    }

    @Test
    void FR_TNT_09_BR_07_zeroSettlementCreatesNeitherRefundNorSettlementInvoiceAndRejectsInvalidDeductionMoney() throws Exception {
        thuCoc(hopDongId, "307000.00");
        mockMvc.perform(post(thanhLyUrl(hopDongId)).header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"khauTruHuHong\":\"1.001\",\"lyDo\":\"x\"}"))
                .andExpect(status().isBadRequest());
        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOP_DONG WHERE id=?", String.class, hopDongId)).isEqualTo("HIEU_LUC");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id=?", Integer.class, hopDongId)).isZero();
        mockMvc.perform(post(thanhLyUrl(hopDongId)).header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id=? AND loai='HOAN_COC'", Integer.class, hopDongId)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id=? AND ky_id IS NULL", Integer.class, hopDongId)).isZero();
    }

    @Test
    void FR_TNT_08_BR_08_V30_preservesOrdinaryInvoiceUniquenessAndAllowsDistinctSettlementInvoices() {
        Long kyId = jdbcTemplate.queryForObject("SELECT id FROM KY_THANH_TOAN WHERE toa_nha_id=1", Long.class);
        String ordinary = "INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES (?, ?, ?, DATE '2040-08-01', DATE '2040-09-01', 100.00, 0.00, 'DA_PHAT_HANH')";
        jdbcTemplate.update(ordinary, "ORD-1", kyId, hopDongId);
        assertThatThrownBy(() -> jdbcTemplate.update(ordinary, "ORD-2", kyId, hopDongId))
                .isInstanceOf(DataIntegrityViolationException.class);
        jdbcTemplate.update(ordinary.replace("?, ?,", "?, NULL,"), "SETTLE-1", hopDongId);
        jdbcTemplate.update(ordinary.replace("?, ?,", "?, NULL,"), "SETTLE-2", hopDongId);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id=? AND ky_id IS NULL", Integer.class, hopDongId)).isEqualTo(2);
    }

    @Test
    void FR_TNT_08_FR_TNT_09_BR_07_createsPayableSettlementInvoiceForNegativeBalanceAndBlocksSecondSettlement() throws Exception {
        thuCoc(hopDongId, "100.00");

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk());

        Long hoaDonQuyetToanId = jdbcTemplate.queryForObject(
                "SELECT id FROM HOA_DON WHERE hop_dong_id = ? AND ky_id IS NULL", Long.class, hopDongId);
        BigDecimal tongHoaDonKyCuoi = jdbcTemplate.queryForObject(
                "SELECT tong_tien FROM HOA_DON WHERE hop_dong_id = ? AND ky_id IS NOT NULL", BigDecimal.class, hopDongId);
        assertThat(jdbcTemplate.queryForObject("SELECT tong_tien FROM HOA_DON WHERE id = ?", BigDecimal.class, hoaDonQuyetToanId))
                .isEqualByComparingTo(tongHoaDonKyCuoi.subtract(new BigDecimal("100.00")));
        assertThat(jdbcTemplate.queryForObject("SELECT ma_hoa_don FROM HOA_DON WHERE id = ?", String.class, hoaDonQuyetToanId))
                .startsWith("QT-");
        String audit = jdbcTemplate.queryForObject("SELECT gia_tri_sau FROM NHAT_KY_THAO_TAC WHERE doi_tuong=? AND hanh_dong='THANH_LY_HOP_DONG'", String.class, "HOP_DONG:" + hopDongId);
        assertThat(audit).contains("hoaDonCuoi=" + jdbcTemplate.queryForObject("SELECT id FROM HOA_DON WHERE hop_dong_id=? AND ky_id IS NOT NULL", Long.class, hopDongId), "tong=307000.00", "daThuCoc=100.00", "congNo=307000.00", "khauTru=0.00", "hoan=0.00", "hoaDonQT=" + hoaDonQuyetToanId);
        assertThat(jdbcTemplate.queryForObject("SELECT nguoi_dung_id FROM NHAT_KY_THAO_TAC WHERE doi_tuong=? AND hanh_dong='THANH_LY_HOP_DONG'", Long.class, "HOP_DONG:" + hopDongId)).isEqualTo(3L);

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/hoa-don-quyet-toan/" + hoaDonQuyetToanId + "/thanh-toan")
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soTien\": \"" + tongHoaDonKyCuoi.subtract(new BigDecimal("100.00")) + "\", \"hinhThuc\": \"TIEN_MAT\", \"ngayThu\": \"2026-09-07\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_TOAN"));

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isConflict());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id = ?", Integer.class, hopDongId))
                .isEqualTo(2);
    }

    @Test
    void FR_TNT_08_BR_07_settlementTransfersOrdinaryDebtIntoImmutableLedgerAndRejectsRecollection() throws Exception {
        thuCoc(hopDongId, "307000.00");

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk());

        Long kyId = jdbcTemplate.queryForObject("SELECT id FROM KY_THANH_TOAN WHERE toa_nha_id = 1", Long.class);
        Long hoaDonId = jdbcTemplate.queryForObject(
                "SELECT id FROM HOA_DON WHERE hop_dong_id = ? AND ky_id = ?", Long.class, hopDongId, kyId);
        assertThat(jdbcTemplate.queryForObject("SELECT da_thu FROM HOA_DON WHERE id = ?", BigDecimal.class, hoaDonId))
                .isEqualByComparingTo("307000.00");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM THANH_TOAN WHERE hoa_don_id = ? AND loai = 'QUYET_TOAN' AND so_tien = 307000.00",
                Integer.class, hoaDonId)).isEqualTo(1);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyId + "/hoa-don/" + hoaDonId + "/thanh-toan")
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soTien\":\"1.00\",\"hinhThuc\":\"TIEN_MAT\",\"ngayThu\":\"2026-09-07\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void FR_TNT_08_reusesExistingDraftOrdinaryInvoiceAndPublishesZeroTotalForSettlement() throws Exception {
        Long kyId = jdbcTemplate.queryForObject("SELECT id FROM KY_THANH_TOAN WHERE toa_nha_id = 1", Long.class);
        jdbcTemplate.update("INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES ('HD-DRAFT', ?, ?, DATE '2026-09-07', DATE '2026-10-07', 0.00, 0.00, 'NHAP')", kyId, hopDongId);

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id = ? AND ky_id = ?", Integer.class, hopDongId, kyId)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOA_DON WHERE hop_dong_id = ? AND ky_id = ?", String.class, hopDongId, kyId)).isEqualTo("DA_PHAT_HANH");
    }

    @Test
    void FR_TNT_08_BR_07_rollsBackInvoiceDepositLedgerAndContractWhenSettlementFailsAfterAllocation() throws Exception {
        thuCoc(hopDongId, "7000000.00");
        jdbcTemplate.execute("CREATE FUNCTION fail_contract_settlement() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced settlement failure'; END; $$");
        jdbcTemplate.execute("CREATE TRIGGER fail_contract_settlement BEFORE UPDATE OF trang_thai ON HOP_DONG FOR EACH ROW WHEN (NEW.trang_thai = 'DA_THANH_LY') EXECUTE FUNCTION fail_contract_settlement()");

        try {
            assertThatThrownBy(() -> mockMvc.perform(post(thanhLyUrl(hopDongId))
                    .header("Authorization", "Bearer " + login(3L, "0900000003"))))
                    .isInstanceOf(Exception.class);
        } finally {
            jdbcTemplate.execute("DROP TRIGGER IF EXISTS fail_contract_settlement ON HOP_DONG");
            jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_contract_settlement()");
        }

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id = ?", Integer.class, hopDongId)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id = ?", Integer.class, hopDongId)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOP_DONG WHERE id = ?", String.class, hopDongId)).isEqualTo("HIEU_LUC");
    }

    @Test
    void BR_07_excludesDraftAndCancelledInvoicesFromSettlementDebt() throws Exception {
        thuCoc(hopDongId, "7000000.00");
        Long kyNhap = jdbcTemplate.queryForObject("INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (1, 2026, 8, DATE '2026-08-01', DATE '2026-08-30', 'DA_CHOT') RETURNING id", Long.class);
        Long kyHuy = jdbcTemplate.queryForObject("INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (1, 2026, 7, DATE '2026-07-01', DATE '2026-07-30', 'DA_CHOT') RETURNING id", Long.class);
        jdbcTemplate.update("INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES ('HD-NHAP', ?, ?, DATE '2026-08-01', DATE '2026-08-31', 999.00, 0.00, 'NHAP')", kyNhap, hopDongId);
        jdbcTemplate.update("INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES ('HD-HUY', ?, ?, DATE '2026-07-01', DATE '2026-07-31', 888.00, 0.00, 'DA_HUY')", kyHuy, hopDongId);

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quyetToan.congNo").value("307000.00"));
    }

    @Test
    void FR_TNT_08_FR_TNT_09_BR_07_recordsDamageDeductionOnlyWithNonBlankReason() throws Exception {
        thuCoc(hopDongId, "1000.00");

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"khauTruHuHong\": \"1.00\", \"lyDo\": \"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("lý do")));
        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM HOP_DONG WHERE id = ?", String.class, hopDongId))
                .isEqualTo("HIEU_LUC");

        mockMvc.perform(post(thanhLyUrl(hopDongId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"khauTruHuHong\": \"1.00\", \"lyDo\": \"Vỡ kính\"}"))
                .andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id = ? AND loai = 'KHAU_TRU_COC' AND ly_do = 'Vỡ kính'",
                Integer.class, hopDongId)).isEqualTo(1);
    }

    @Test
    void FR_TNT_08_FR_TNT_09_forbiddenRolesAndOutOfScopeManagerReceive403() throws Exception {
        mockMvc.perform(post(thanhLyUrl(hopDongId)).header("Authorization", "Bearer " + login(1L, "0900000001")))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(thanhLyUrl(hopDongNgoaiToaId)).header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_TNT_08_wrongRoleIsRejectedBeforeSettlementInvoiceLookup() throws Exception {
        mockMvc.perform(post("/api/hop-dong/999999/hoa-don-quyet-toan/999999/thanh-toan")
                        .header("Authorization", "Bearer " + login(1L, "0900000001"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soTien\":\"1.00\",\"hinhThuc\":\"TIEN_MAT\",\"ngayThu\":\"2026-09-07\"}"))
                .andExpect(status().isForbidden());
    }

    private void thuCoc(Long id, String soTien) {
        jdbcTemplate.update("INSERT INTO GIAO_DICH_COC(hop_dong_id, loai, so_tien, ngay, nguoi_thu_id) VALUES (?, 'THU_COC', ?, DATE '2026-09-01', 3)", id, new BigDecimal(soTien));
    }

    private String thanhLyUrl(Long id) { return "/api/hop-dong/" + id + "/thanh-ly"; }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject("INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai) VALUES (?, ?, 1, 20.00, 2, 100.00, 'Studio', 'DANG_THUE') RETURNING id", Long.class, toaNhaId, soPhong);
    }

    private Long themNguoiThue(String soDienThoai, String soGiayTo) {
        return jdbcTemplate.queryForObject("INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan) VALUES ('Người thuê', DATE '1990-01-01', ?, ?, 'HN') RETURNING id", Long.class, soDienThoai, soGiayTo);
    }

    private Long themDichVuCoDinh(Long toaNhaId) {
        Long dichVuId = jdbcTemplate.queryForObject("INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung) VALUES (?, 'Internet', 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE) RETURNING id", Long.class, toaNhaId);
        jdbcTemplate.update("INSERT INTO BANG_GIA(dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, 100000.00, DATE '2026-01-01')", dichVuId);
        return dichVuId;
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, Long dichVuId, String trangThai, String tienCoc) {
        Long id = jdbcTemplate.queryForObject("INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai) VALUES (?, ?, DATE '2026-09-01', DATE '2026-09-30', 1000000.00, ?, 30, ?) RETURNING id", Long.class, phongId, nguoiThueId, new BigDecimal(tienCoc), trangThai);
        if (dichVuId != null) jdbcTemplate.update("INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 100000.00)", id, dichVuId);
        return id;
    }

    private void themKyMo(Long toaNhaId) {
        Long kyId = jdbcTemplate.queryForObject("INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES (?, 2026, 9, DATE '2026-09-01', DATE '2026-09-30', 'DANG_MO') RETURNING id", Long.class, toaNhaId);
        Long phongId = jdbcTemplate.queryForObject("SELECT phong_id FROM HOP_DONG WHERE id = ?", Long.class, hopDongId);
        jdbcTemplate.update("INSERT INTO NHAN_KHAU_KY(ky_id, phong_id, so_nguoi, thoi_diem_chot) VALUES (?, ?, 1, CURRENT_TIMESTAMP)", kyId, phongId);
    }

    private void xoa(String bang) { jdbcTemplate.update("DELETE FROM " + bang); }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String matKhau = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET mat_khau_hash = ?, trang_thai = 'HOAT_DONG' WHERE id = ?", passwordHasher.hash(matKhau), nguoiDungId);
        return mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"soDienThoai\":\"" + soDienThoai + "\",\"matKhau\":\"" + matKhau + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString().replaceAll(".*\\\"token\\\":\\\"([^\\\"]+)\\\".*", "$1");
    }
}
