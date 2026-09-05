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
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(ThanhToanIntegrationTest.FixedClockConfiguration.class)
class ThanhToanIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long kyId;
    private Long hoaDonId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("THANH_TOAN");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON_BAC_THANG");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("HOA_DON");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("NGUOI_THUE");
        xoaNeuBangTonTai("PHONG");
        xoaNeuBangTonTai("KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id = 5");
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

        Long phongId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (1, '101', 1, 25.00, 4, 3500000.00, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class
        );
        Long nguoiThueId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan)
                        VALUES ('Nguoi thue thanh toan', DATE '1990-01-01', '0905000101', 'CC500101', 'Ha Noi')
                        RETURNING id
                        """,
                Long.class
        );
        Long hopDongId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2026-07-01', DATE '2026-09-30', 3500000.00, 3500000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId
        );
        kyId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                        VALUES (1, 2026, 8, DATE '2026-07-02', DATE '2026-08-01', 'DA_CHOT')
                        RETURNING id
                        """,
                Long.class
        );
        hoaDonId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES ('TN-A-101-202608', ?, ?, DATE '2026-08-02', DATE '2026-09-30', 1888000.00, 0.00, 'DA_PHAT_HANH')
                        RETURNING id
                        """,
                Long.class,
                kyId,
                hopDongId
        );
    }

    @Test
    void FR_INV_11_FR_INV_12_FR_INV_13_recordsMultiplePaymentsAndReconcilesCachedPaidTotal() throws Exception {
        String managerToken = login(3L, "0900000003");

        MvcResult firstPayment = mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("1000000.00", "2026-09-01", false)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.trangThai").value("DA_THU_MOT_PHAN"))
                .andExpect(jsonPath("$.daThu").value("1000000.00"))
                .andExpect(jsonPath("$.conLai").value("888000.00"))
                .andExpect(jsonPath("$.maBienLai").isNotEmpty())
                .andReturn();

        String firstReceipt = firstPayment.getResponse().getContentAsString();

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("888000.00", "2026-09-02", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_TOAN"))
                .andExpect(jsonPath("$.daThu").value("1888000.00"))
                .andExpect(jsonPath("$.conLai").value("0.00"))
                .andExpect(jsonPath("$.maBienLai").isNotEmpty());

        List<String> receipts = jdbcTemplate.queryForList(
                "SELECT ma_bien_lai FROM THANH_TOAN WHERE hoa_don_id = ? ORDER BY id",
                String.class,
                hoaDonId
        );
        assertThat(receipts).hasSize(2).doesNotHaveDuplicates();
        assertThat(firstReceipt).contains(receipts.get(0));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT da_thu FROM HOA_DON WHERE id = ?",
                BigDecimal.class,
                hoaDonId
        )).isEqualByComparingTo(jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(so_tien), 0.00) FROM THANH_TOAN WHERE hoa_don_id = ?",
                BigDecimal.class,
                hoaDonId
        ));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE doi_tuong = ? AND hanh_dong = 'GHI_NHAN_THANH_TOAN'",
                Integer.class,
                "HOA_DON:" + hoaDonId
        )).isEqualTo(2);
    }

    @Test
    void FR_INV_11_E1_rejectsNonPositiveThuWithoutPersistingPayment() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("0.00", "2026-09-01", false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value(containsString("lớn hơn 0")));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT da_thu FROM HOA_DON WHERE id = ?", BigDecimal.class, hoaDonId))
                .isEqualByComparingTo("0.00");
    }

    @Test
    void FR_INV_11_rejectsAmountOutsideNumericPrecisionWithoutPersistingPayment() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("10000000000000.00", "2026-09-01", false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value(containsString("không hợp lệ")));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN", Integer.class)).isZero();
    }

    @Test
    void FR_INV_12_BR_12_usesInvoiceStoredDueDateInsteadOfPaymentPeriodEnd() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("1000000.00", "2026-09-02", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("DA_THU_MOT_PHAN"));
    }

    @Test
    void FR_INV_11_E2_warnsBeforeRecordingAdditionalPaymentAfterInvoiceIsFullyPaid() throws Exception {
        String managerToken = login(3L, "0900000003");
        String fullPayment = paymentPayload("1888000.00", "2026-09-01", false);

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(fullPayment))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_TOAN"));

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("10000.00", "2026-09-02", false)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value(containsString("đã thanh toán đủ")))
                .andExpect(jsonPath("$.thongBao").value(containsString("số dư")));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN", Integer.class)).isEqualTo(1);

        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("10000.00", "2026-09-02", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_TOAN"))
                .andExpect(jsonPath("$.daThu").value("1898000.00"))
                .andExpect(jsonPath("$.soTienThanhSoDu").value("10000.00"));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conLai").value("0.00"));
    }

    @Test
    void FR_INV_14_BR_18_doesNotExposePhysicalDeleteForPaymentRecords() throws Exception {
        String managerToken = login(3L, "0900000003");

        MvcResult result = mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("1000000.00", "2026-09-01", false)))
                .andExpect(status().isCreated())
                .andReturn();
        Long paymentId = jdbcTemplate.queryForObject("SELECT id FROM THANH_TOAN LIMIT 1", Long.class);

        mockMvc.perform(delete("/api/thanh-toan/" + paymentId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound());

        assertThat(result.getResponse().getContentAsString()).contains("maBienLai");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN", Integer.class)).isEqualTo(1);
    }

    @Test
    void FR_INV_14_CR_010_BR_18_recordsNegativeCounterEntryPreservesOriginalAndRecalculatesInvoice() throws Exception {
        Long originalPaymentId = ghiNhanThu("1888000.00");
        Map<String, Object> original = jdbcTemplate.queryForMap(
                "SELECT hoa_don_id, so_tien, loai, dieu_chinh_cho_id, ly_do, hinh_thuc, ngay_thu, nguoi_thu_id, ma_bien_lai, thoi_diem_tao FROM THANH_TOAN WHERE id = ?",
                originalPaymentId
        );

        mockMvc.perform(post(counterEntryUrl(originalPaymentId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("888000.00", "Gõ nhầm số tiền đã thu")))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.loai").value("DOI_UNG"))
                .andExpect(jsonPath("$.soTien").value("-888000.00"))
                .andExpect(jsonPath("$.daThu").value("1000000.00"))
                .andExpect(jsonPath("$.trangThai").value("DA_THU_MOT_PHAN"));

        assertThat(jdbcTemplate.queryForMap(
                "SELECT hoa_don_id, so_tien, loai, dieu_chinh_cho_id, ly_do, hinh_thuc, ngay_thu, nguoi_thu_id, ma_bien_lai, thoi_diem_tao FROM THANH_TOAN WHERE id = ?",
                originalPaymentId
        )).isEqualTo(original);
        assertThat(jdbcTemplate.queryForMap(
                "SELECT loai, so_tien, dieu_chinh_cho_id, ly_do FROM THANH_TOAN WHERE id <> ?",
                originalPaymentId
        )).containsEntry("loai", "DOI_UNG")
                .containsEntry("dieu_chinh_cho_id", originalPaymentId)
                .containsEntry("ly_do", "Gõ nhầm số tiền đã thu");
        assertThat(jdbcTemplate.queryForObject("SELECT da_thu FROM HOA_DON WHERE id = ?", BigDecimal.class, hoaDonId))
                .isEqualByComparingTo("1000000.00");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(so_tien), 0.00) FROM THANH_TOAN WHERE hoa_don_id = ?", BigDecimal.class, hoaDonId
        )).isEqualByComparingTo("1000000.00");
        assertThat(jdbcTemplate.queryForMap(
                "SELECT nguoi_dung_id, ly_do FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'LAP_BUT_TOAN_DOI_UNG'"
        )).containsEntry("nguoi_dung_id", 3L).containsEntry("ly_do", "Gõ nhầm số tiền đã thu");
    }

    @Test
    void FR_INV_14_BR_18_rejectsBlankCounterEntryReasonWithoutPersistingEntry() throws Exception {
        Long originalPaymentId = ghiNhanThu("1000000.00");

        mockMvc.perform(post(counterEntryUrl(originalPaymentId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("100000.00", "   ")))
                .andExpect(status().isBadRequest());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THANH_TOAN", Integer.class)).isEqualTo(1);
    }

    @Test
    void FR_INV_14_managerMayCreateCounterEntryAtExactly24HoursButMustAskOwnerAfterward() throws Exception {
        Long originalPaymentId = ghiNhanThu("1000000.00");
        jdbcTemplate.update("UPDATE THANH_TOAN SET thoi_diem_tao = TIMESTAMP '2026-09-01 12:00:00' WHERE id = ?", originalPaymentId);

        mockMvc.perform(post(counterEntryUrl(originalPaymentId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("100000.00", "Điều chỉnh đúng biên 24 giờ")))
                .andExpect(status().isCreated());

        Long laterPaymentId = ghiNhanThu("100000.00");
        jdbcTemplate.update("UPDATE THANH_TOAN SET thoi_diem_tao = TIMESTAMP '2026-09-01 11:59:59' WHERE id = ?", laterPaymentId);
        mockMvc.perform(post(counterEntryUrl(laterPaymentId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("10000.00", "Điều chỉnh quá hạn")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value(containsString("Chủ sở hữu")));
    }

    @Test
    void FR_INV_14_ownerMayCreateCounterEntryAfter24HoursButSystemAdminAndOutOfScopeManagerReceive403() throws Exception {
        Long originalPaymentId = ghiNhanThu("1000000.00");
        jdbcTemplate.update("UPDATE THANH_TOAN SET thoi_diem_tao = TIMESTAMP '2020-01-01 00:00:00' WHERE id = ?", originalPaymentId);

        mockMvc.perform(post(counterEntryUrl(originalPaymentId))
                        .header("Authorization", "Bearer " + login(2L, "0900000002"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("100000.00", "Chủ sở hữu điều chỉnh lịch sử")))
                .andExpect(status().isCreated());

        Long anotherPaymentId = ghiNhanThu("100000.00");
        mockMvc.perform(post(counterEntryUrl(anotherPaymentId))
                        .header("Authorization", "Bearer " + login(1L, "0900000001"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("10000.00", "QTHT không được phép")))
                .andExpect(status().isForbidden());

        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = 3 AND toa_nha_id = 1");
        mockMvc.perform(post(counterEntryUrl(anotherPaymentId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("10000.00", "Quản lý sai toà")))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_INV_14_rejectsCounterEntryAgainstAnotherCounterEntry() throws Exception {
        Long originalPaymentId = ghiNhanThu("1000000.00");
        mockMvc.perform(post(counterEntryUrl(originalPaymentId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("100000.00", "Điều chỉnh ban đầu")))
                .andExpect(status().isCreated());
        Long counterEntryId = jdbcTemplate.queryForObject(
                "SELECT id FROM THANH_TOAN WHERE loai = 'DOI_UNG'", Long.class
        );

        mockMvc.perform(post(counterEntryUrl(counterEntryId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(counterEntryPayload("10000.00", "Không được lồng đối ứng")))
                .andExpect(status().isConflict());
    }

    @Test
    void FR_AUT_04_systemAdminReceives403OnPaymentRecording() throws Exception {
        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + login(1L, "0900000001"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("1000000.00", "2026-09-01", false)))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_AUT_05_managerReceives403ForPaymentRecordingOutsideAssignedBuildingScope() throws Exception {
        mockMvc.perform(post("/api/toa-nha/2/ky-thanh-toan/%s/hoa-don/%s/thanh-toan".formatted(kyId, hoaDonId))
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload("1000000.00", "2026-09-01", false)))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_INV_13_CR_010_paymentSchemaHasSignedMoneyAndUniqueAutomaticReceiptCode() {
        Boolean tableExists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'thanh_toan')",
                Boolean.class
        );
        assertThat(tableExists).isTrue();

        Map<String, Object> moneyColumn = jdbcTemplate.queryForMap(
                """
                        SELECT data_type, numeric_precision, numeric_scale
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = 'thanh_toan' AND column_name = 'so_tien'
                        """
        );
        assertThat(moneyColumn.get("data_type")).isEqualTo("numeric");
        assertThat(moneyColumn.get("numeric_precision")).isEqualTo(15);
        assertThat(moneyColumn.get("numeric_scale")).isEqualTo(2);

        List<String> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'thanh_toan'",
                String.class
        );
        assertThat(columns).contains("hoa_don_id", "so_tien", "loai", "dieu_chinh_cho_id", "ly_do",
                "hinh_thuc", "ngay_thu", "nguoi_thu_id", "ma_bien_lai", "thoi_diem_tao");

        Integer uniqueReceiptConstraints = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM pg_constraint c
                        JOIN pg_class t ON t.oid = c.conrelid
                        WHERE t.relname = 'thanh_toan' AND c.contype = 'u'
                          AND pg_get_constraintdef(c.oid) LIKE '%(ma_bien_lai)%'
                        """,
                Integer.class
        );
        assertThat(uniqueReceiptConstraints).isEqualTo(1);
    }

    private String paymentUrl() {
        return "/api/toa-nha/1/ky-thanh-toan/%s/hoa-don/%s/thanh-toan".formatted(kyId, hoaDonId);
    }

    private Long ghiNhanThu(String soTien) throws Exception {
        mockMvc.perform(post(paymentUrl())
                        .header("Authorization", "Bearer " + login(3L, "0900000003"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(paymentPayload(soTien, "2026-09-01", false)))
                .andExpect(status().isCreated());
        return jdbcTemplate.queryForObject("SELECT id FROM THANH_TOAN ORDER BY id DESC LIMIT 1", Long.class);
    }

    private String counterEntryUrl(Long paymentId) {
        return "/api/thanh-toan/%s/doi-ung".formatted(paymentId);
    }

    private String counterEntryPayload(String soTien, String lyDo) {
        return """
                {
                  "soTien": "%s",
                  "lyDo": "%s"
                }
                """.formatted(soTien, lyDo);
    }

    private String paymentPayload(String soTien, String ngayThu, boolean xacNhanThuThem) {
        return """
                {
                  "soTien": "%s",
                  "hinhThuc": "TIEN_MAT",
                  "ngayThu": "%s",
                  "xacNhanThuThem": %s
                }
                """.formatted(soTien, ngayThu, xacNhanThuThem);
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?", passwordHasher.hash(runtimePassword), nguoiDungId);
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

    private void xoaNeuBangTonTai(String tenBang) {
        Boolean tonTai = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_name = ?
                        )
                        """,
                Boolean.class,
                tenBang.toLowerCase()
        );
        if (Boolean.TRUE.equals(tonTai)) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClockConfiguration {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-09-02T05:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        }
    }
}
