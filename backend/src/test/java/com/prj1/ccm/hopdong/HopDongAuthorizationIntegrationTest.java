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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class HopDongAuthorizationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long hopDongId;
    private Long hopDongNgoaiPhamViId;
    private Long phongNgoaiPhamViId;
    private Long nguoiThueNgoaiPhamViId;
    private Long dichVuNgoaiPhamViId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM BANG_GIA_BAC_THANG");
        jdbcTemplate.update("DELETE FROM BANG_GIA");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
        Long phongTrongPhamViId = themPhong(1L, "501");
        Long nguoiThueTrongPhamViId = themNguoiThue("Người thuê trong phạm vi", "0900001111", "079123456701");
        Long dichVuTrongPhamViId = themDichVuCoBangGia(1L, "Internet", "250000.00");
        phongNgoaiPhamViId = themPhong(2L, "601");
        nguoiThueNgoaiPhamViId = themNguoiThue("Người thuê ngoài phạm vi", "0900002222", "079123456702");
        dichVuNgoaiPhamViId = themDichVuCoBangGia(2L, "Internet ngoài phạm vi", "260000.00");
        hopDongId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2040-01-01', DATE '2040-12-31', 3500000.00, 3500000.00, 30, 'CHO_KY')
                        RETURNING id
                        """,
                Long.class,
                phongTrongPhamViId,
                nguoiThueTrongPhamViId
        );
        jdbcTemplate.update(
                "INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, 250000.00)",
                hopDongId,
                dichVuTrongPhamViId
        );
        hopDongNgoaiPhamViId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2040-01-01', DATE '2040-12-31', 3600000.00, 3600000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongNgoaiPhamViId,
                nguoiThueNgoaiPhamViId
        );
    }

    @Test
    void FR_TNT_04_CR_005_thoVaNguoiThueNhan403ChoTatCaHopDongEndpoints() throws Exception {
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");

        assert403OnAllContractEndpoints(workerToken);
        assert403OnAllContractEndpoints(tenantToken);
    }

    @Test
    void FR_AUT_04_systemAdminReceives403OnEveryContractEndpoint() throws Exception {
        assert403OnAllContractEndpoints(login(1L, "0900000001"));
    }

    @Test
    void FR_TNT_04_CR_005_quanLyNhan403KhiVuotPhamViToaNhaDuocGan() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("toaNhaId", "2"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hopDongPayload(phongNgoaiPhamViId, nguoiThueNgoaiPhamViId, dichVuNgoaiPhamViId)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hop-dong/" + hopDongNgoaiPhamViId + "/khoan-phat-sinh")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(khoanPhatSinhPayload()))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_INV_05_CR_008_forbiddenRolesReceive403OnPendingExtraCreationEndpoint() throws Exception {
        assert403OnPendingExtraCreationEndpoint(login(4L, "0900000004"));
        assert403OnPendingExtraCreationEndpoint(login(5L, "0900000006"));
    }

    @Test
    void FR_INV_05_CR_008_missingAuthenticationReturns401OnPendingExtraCreationEndpoint() throws Exception {
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/khoan-phat-sinh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(khoanPhatSinhPayload()))
                .andExpect(status().isUnauthorized());
    }

    private void assert403OnAllContractEndpoints(String token) throws Exception {
        mockMvc.perform(get("/api/hop-dong")
                        .header("Authorization", "Bearer " + token)
                        .queryParam("toaNhaId", "1"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hopDongPayload(phongNgoaiPhamViId, nguoiThueNgoaiPhamViId, dichVuNgoaiPhamViId)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/hop-dong/" + hopDongId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nhan-coc")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/kich-hoat")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/thanh-ly")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        assert403OnPendingExtraCreationEndpoint(token);
    }

    private void assert403OnPendingExtraCreationEndpoint(String token) throws Exception {
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/khoan-phat-sinh")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(khoanPhatSinhPayload()))
                .andExpect(status().isForbidden());
    }

    private String hopDongPayload(Long phongId, Long nguoiThueId, Long dichVuId) {
        return """
                {
                  "phongId": %d,
                  "nguoiThueId": %d,
                  "ngayBatDau": "2040-09-01",
                  "ngayKetThuc": "2041-08-31",
                  "giaThue": "3500000.00",
                  "tienCoc": "3500000.00",
                  "soNgayBaoTruoc": 30,
                  "dichVuApDung": [
                    { "dichVuId": %d }
                  ]
                }
                """.formatted(phongId, nguoiThueId, dichVuId);
    }

    private String khoanPhatSinhPayload() {
        return """
                {
                  "nguonLoai": "SUA_CHUA",
                  "nguonId": 101,
                  "tenKhoan": "Tien sua den",
                  "soTien": "120000.00",
                  "loai": "PHAT_SINH"
                }
                """;
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 5, 22.50, 4, 3500000.00, 'Studio', 'TRONG')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong
        );
    }

    private Long themNguoiThue(String hoTen, String soDienThoai, String soGiayTo) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, DATE '2000-01-01', ?, ?, 'Nam Định', NULL)
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                soGiayTo
        );
    }

    private Long themDichVuCoBangGia(Long toaNhaId, String ten, String donGia) {
        Long dichVuId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten
        );
        jdbcTemplate.update(
                "INSERT INTO BANG_GIA(dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, ?, DATE '2040-01-01')",
                dichVuId,
                new java.math.BigDecimal(donGia)
        );
        return dichVuId;
    }

    private void xoaNeuBangTonTai(String tenBang) {
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                              AND table_name = ?
                        )
                        """,
                Boolean.class,
                tenBang.toLowerCase()
        ))) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
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
