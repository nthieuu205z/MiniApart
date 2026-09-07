package com.prj1.ccm.billing;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
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

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(MaQrChuyenKhoanIntegrationTest.QrClockConfiguration.class)
class MaQrChuyenKhoanIntegrationTest {

    private static final Instant TEST_NOW = Instant.parse("2026-09-06T05:00:00Z");
    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private MutableClock clock;

    private Long kyId;
    private Long hoaDonId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.anh.link-secret", () -> "qr-review-round-1-secret");
    }

    @BeforeEach
    void resetDatabase() {
        clock.dat(TEST_NOW);
        xoaNeuBangTonTai("THANH_TOAN");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON_BAC_THANG");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("HOA_DON");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        xoaNeuBangTonTai("NGUOI_THUE");
        xoaNeuBangTonTai("PHONG");
        xoaNeuBangTonTai("KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 2), (3, 2)");
        jdbcTemplate.update("UPDATE TOA_NHA SET tk_ngan_hang = '000000000101' WHERE id = 1");
        jdbcTemplate.update("UPDATE TOA_NHA SET tk_ngan_hang = '000000000202' WHERE id = 2");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET phien_ban_token = 0, trang_thai = 'HOAT_DONG' WHERE id IN (1, 2, 3)");

        Long phongId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (2, '201', 2, 25.00, 4, 3500000.00, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class
        );
        Long nguoiThueId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan)
                        VALUES ('Nguoi thue ma QR', DATE '1990-01-01', '0906000101', 'CC600101', 'Da Nang')
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
                        VALUES (2, 2026, 8, DATE '2026-07-02', DATE '2026-08-01', 'DA_CHOT')
                        RETURNING id
                        """,
                Long.class
        );
        hoaDonId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON (ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES ('TN-B-201-202608', ?, ?, DATE '2026-08-02', DATE '2026-09-30', 1888000.00, 1000000.00, 'DA_THU_MOT_PHAN')
                        RETURNING id
                        """,
                Long.class,
                kyId,
                hopDongId
        );
    }

    @Test
    void FR_INV_10_scopedOwnerAndManagerReceive900SecondSignedLinkAndAnonymousImageIsRendered() throws Exception {
        String ownerLink = requestQrLink(2L, "0900000002");
        String managerLink = requestQrLink(3L, "0900000003");

        assertThat(queryParameters(ownerLink).get("hetHan"))
                .isEqualTo(Long.toString(TEST_NOW.getEpochSecond() + 900));
        assertThat(ownerLink).contains("/ma-qr-chuyen-khoan/xem");
        assertThat(managerLink).contains("/ma-qr-chuyen-khoan/xem");

        MvcResult image = mockMvc.perform(get(ownerLink))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG_VALUE))
                .andReturn();

        Map<String, String> fields = decodeVietQr(decodeQr(image.getResponse().getContentAsByteArray()));
        assertThat(fields).containsEntry("bin", "970422")
                .containsEntry("account", "000000000202")
                .containsEntry("amount", "888000.00")
                .containsEntry("content", "TN-B-201-202608");
    }

    @Test
    void FR_INV_10_preservesAccentedInvoiceCodeExactlyThroughUtf8TlvAndQrRendering() throws Exception {
        String accentedInvoiceCode = "HĐ-TN-B-201-202608";
        jdbcTemplate.update("UPDATE HOA_DON SET ma_hoa_don = ? WHERE id = ?", accentedInvoiceCode, hoaDonId);

        String link = requestQrLink(3L, "0900000003");
        MvcResult image = mockMvc.perform(get(link))
                .andExpect(status().isOk())
                .andReturn();

        Map<String, String> fields = decodeVietQr(decodeQr(image.getResponse().getContentAsByteArray()));
        assertThat(fields.get("content")).isEqualTo(accentedInvoiceCode);
    }

    @Test
    void FR_INV_10_disablesCachingForSignedLinkIssuanceAndDynamicImageResponses() throws Exception {
        MvcResult issuance = mockMvc.perform(get(qrIssueUrl())
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn();

        mockMvc.perform(get(linkFrom(issuance)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void FR_INV_10_signedImageRegeneratesPayloadFromCurrentOutstandingAmountWithoutStorage() throws Exception {
        String link = requestQrLink(3L, "0900000003");
        jdbcTemplate.update("UPDATE HOA_DON SET da_thu = 1500000.00 WHERE id = ?", hoaDonId);

        MvcResult image = mockMvc.perform(get(link))
                .andExpect(status().isOk())
                .andReturn();

        Map<String, String> fields = decodeVietQr(decodeQr(image.getResponse().getContentAsByteArray()));
        assertThat(new BigDecimal(fields.get("amount"))).isEqualByComparingTo(new BigDecimal("388000.00"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%qr%'",
                Integer.class
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND column_name LIKE '%qr%'",
                Integer.class
        )).isZero();
    }

    @Test
    void FR_INV_10_refusesQrForPaidInFullAndOverpaidInvoicesAtBothLinkAndImageStages() throws Exception {
        jdbcTemplate.update("UPDATE HOA_DON SET da_thu = tong_tien WHERE id = ?", hoaDonId);
        mockMvc.perform(get(qrIssueUrl()).header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value(containsString("đã thanh toán đủ")));

        jdbcTemplate.update("UPDATE HOA_DON SET da_thu = 1000000.00 WHERE id = ?", hoaDonId);
        String link = requestQrLink(3L, "0900000003");
        jdbcTemplate.update("UPDATE HOA_DON SET da_thu = 1888001.00 WHERE id = ?", hoaDonId);
        mockMvc.perform(get(link))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value(containsString("đã thanh toán đủ")));
    }

    @Test
    void FR_INV_10_rejectsInvalidSignatureAndExpiredSignedLinkWithoutJwt() throws Exception {
        String link = requestQrLink(3L, "0900000003");
        Map<String, String> params = queryParameters(link);
        String invalidSignature = link.replace(params.get("chuKy"), params.get("chuKy") + "x");
        mockMvc.perform(get(invalidSignature))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value(containsString("không hợp lệ hoặc đã hết hạn")));

        String tamperedPath = link.replace("/hoa-don/" + hoaDonId + "/", "/hoa-don/" + (hoaDonId + 1) + "/");
        mockMvc.perform(get(tamperedPath))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value(containsString("không hợp lệ hoặc đã hết hạn")));

        clock.cong(Duration.ofSeconds(900));
        mockMvc.perform(get(link))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value(containsString("không hợp lệ hoặc đã hết hạn")));
    }

    @Test
    void FR_INV_10_systemAdminAndOutOfScopeManagerReceive403OnLinkEndpoint() throws Exception {
        mockMvc.perform(get(qrIssueUrl())
                        .header("Authorization", "Bearer " + login(1L, "0900000001")))
                .andExpect(status().isForbidden());

        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = 3 AND toa_nha_id = 2");
        mockMvc.perform(get(qrIssueUrl())
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isForbidden());
    }

    private String requestQrLink(Long nguoiDungId, String soDienThoai) throws Exception {
        return linkFrom(mockMvc.perform(get(qrIssueUrl())
                        .header("Authorization", "Bearer " + login(nguoiDungId, soDienThoai)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isNotEmpty())
                .andReturn());
    }

    private String qrIssueUrl() {
        return "/api/toa-nha/2/ky-thanh-toan/%s/hoa-don/%s/ma-qr-chuyen-khoan".formatted(kyId, hoaDonId);
    }

    private String linkFrom(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString();
        String marker = "\"url\":\"";
        int start = body.indexOf(marker) + marker.length();
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }

    private Map<String, String> queryParameters(String link) {
        Map<String, String> parameters = new HashMap<>();
        String query = URI.create(link).getQuery();
        for (String parameter : query.split("&")) {
            String[] pair = parameter.split("=", 2);
            parameters.put(pair[0], pair[1]);
        }
        return parameters;
    }

    private String decodeQr(byte[] png) throws Exception {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(png));
        return new MultiFormatReader().decode(new BinaryBitmap(
                new HybridBinarizer(new BufferedImageLuminanceSource(image))
        )).getText();
    }

    private Map<String, String> decodeVietQr(String payload) {
        assertThat(tlvValue(payload, "00")).isEqualTo("01");
        assertThat(tlvValue(payload, "01")).isEqualTo("12");
        assertThat(payload).contains("6304");
        assertThat(payload.substring(payload.length() - 4)).matches("[0-9A-F]{4}");
        assertThat(payload.substring(payload.length() - 4))
                .isEqualTo(crc16Ccitt(payload.substring(0, payload.length() - 4)));

        Map<String, String> fields = new HashMap<>();
        String merchantAccount = tlvValue(payload, "38");
        assertThat(tlvValue(merchantAccount, "00")).isEqualTo("A000000727");
        String beneficiary = tlvValue(merchantAccount, "01");
        fields.put("bin", tlvValue(beneficiary, "00"));
        fields.put("account", tlvValue(beneficiary, "01"));
        assertThat(tlvValue(merchantAccount, "02")).isEqualTo("QRIBFTTA");
        assertThat(tlvValue(payload, "53")).isEqualTo("704");
        assertThat(tlvValue(payload, "58")).isEqualTo("VN");
        fields.put("amount", tlvValue(payload, "54"));
        fields.put("content", tlvValue(tlvValue(payload, "62"), "08"));
        return fields;
    }

    private String crc16Ccitt(String value) {
        int crc = 0xFFFF;
        for (byte current : value.getBytes(StandardCharsets.UTF_8)) {
            crc ^= (current & 0xFF) << 8;
            for (int bit = 0; bit < 8; bit++) {
                crc = (crc & 0x8000) != 0 ? (crc << 1) ^ 0x1021 : crc << 1;
                crc &= 0xFFFF;
            }
        }
        return "%04X".formatted(crc);
    }

    private String tlvValue(String payload, String wantedTag) {
        return new String(tlvValue(payload.getBytes(StandardCharsets.UTF_8), wantedTag), StandardCharsets.UTF_8);
    }

    private byte[] tlvValue(byte[] payload, String wantedTag) {
        int offset = 0;
        while (offset < payload.length) {
            String tag = new String(payload, offset, 2, StandardCharsets.US_ASCII);
            int length = Integer.parseInt(new String(payload, offset + 2, 2, StandardCharsets.US_ASCII));
            if (tag.equals(wantedTag)) {
                return java.util.Arrays.copyOfRange(payload, offset + 4, offset + 4 + length);
            }
            offset += 4 + length;
        }
        throw new AssertionError("Missing TLV tag " + wantedTag + " in " + new String(payload, StandardCharsets.UTF_8));
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
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?)",
                Boolean.class,
                tenBang.toLowerCase()
        );
        if (Boolean.TRUE.equals(tonTai)) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class QrClockConfiguration {
        @Bean
        @Primary
        MutableClock qrClock() {
            return new MutableClock(TEST_NOW, TEST_ZONE);
        }
    }

    static final class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zone;

        MutableClock(Instant instant, ZoneId zone) {
            this.instant = instant;
            this.zone = zone;
        }

        void dat(Instant instant) {
            this.instant = instant;
        }

        void cong(Duration duration) {
            this.instant = this.instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
