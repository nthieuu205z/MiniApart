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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class MaQrChuyenKhoanIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = 3");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 2)");
        jdbcTemplate.update("UPDATE TOA_NHA SET tk_ngan_hang = '9704000000000101' WHERE id = 1");
        jdbcTemplate.update("UPDATE TOA_NHA SET tk_ngan_hang = '9704000000000202' WHERE id = 2");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET phien_ban_token = 0, trang_thai = 'HOAT_DONG' WHERE id IN (1, 3)");

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
    void FR_INV_10_decodesBuildingAccountOutstandingAmountAndInvoiceCodeFromGeneratedQr() throws Exception {
        MvcResult result = mockMvc.perform(get(qrUrl())
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG_VALUE))
                .andReturn();

        String payload = decodeQr(result.getResponse().getContentAsByteArray());

        assertThat(payload).isEqualTo("account=9704000000000202&amount=888000.00&content=TN-B-201-202608");
        assertThat(new BigDecimal(payload.split("amount=")[1].split("&")[0]))
                .isEqualByComparingTo(new BigDecimal("888000.00"));
    }

    @Test
    void FR_INV_10_refusesQrWhenInvoiceIsPaidInFullWithClearReason() throws Exception {
        jdbcTemplate.update("UPDATE HOA_DON SET da_thu = tong_tien WHERE id = ?", hoaDonId);

        mockMvc.perform(get(qrUrl())
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value(containsString("đã thanh toán đủ")));
    }

    @Test
    void FR_INV_10_systemAdminAndOutOfScopeManagerReceive403() throws Exception {
        mockMvc.perform(get(qrUrl())
                        .header("Authorization", "Bearer " + login(1L, "0900000001")))
                .andExpect(status().isForbidden());

        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = 3 AND toa_nha_id = 2");
        mockMvc.perform(get(qrUrl())
                        .header("Authorization", "Bearer " + login(3L, "0900000003")))
                .andExpect(status().isForbidden());
    }

    private String qrUrl() {
        return "/api/toa-nha/2/ky-thanh-toan/%s/hoa-don/%s/ma-qr-chuyen-khoan".formatted(kyId, hoaDonId);
    }

    private String decodeQr(byte[] png) throws Exception {
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(png));
        return new MultiFormatReader().decode(new BinaryBitmap(
                new HybridBinarizer(new BufferedImageLuminanceSource(image))
        )).getText();
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
}
