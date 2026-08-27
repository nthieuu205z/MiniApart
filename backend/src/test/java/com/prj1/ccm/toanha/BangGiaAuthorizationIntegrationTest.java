package com.prj1.ccm.toanha;

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
class BangGiaAuthorizationIntegrationTest {

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
    void resetAssignmentsAndAuthState() {
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
                            trang_thai = 'HOAT_DONG'
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );
    }

    @Test
    void FR_BLD_06_forbiddenRolesReceive403OnEveryFixedPriceEndpoint() throws Exception {
        Long dichVuId = themDichVu(1L);
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");

        assert403OnAllFixedPriceEndpoints(workerToken, dichVuId);
        assert403OnAllFixedPriceEndpoints(tenantToken, dichVuId);
    }

    @Test
    void FR_BLD_06_managerReceives403OutsideAssignedBuildingScopeForFixedPriceEndpoints() throws Exception {
        Long dichVuNgoaiPhamViId = themDichVu(2L);
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/dich-vu/" + dichVuNgoaiPhamViId + "/bang-gia")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/dich-vu/" + dichVuNgoaiPhamViId + "/bang-gia")
                        .param("ngay", "2026-08-27")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/dich-vu/" + dichVuNgoaiPhamViId + "/bang-gia")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload()))
                .andExpect(status().isForbidden());
    }

    private void assert403OnAllFixedPriceEndpoints(String token, Long dichVuId) throws Exception {
        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .param("ngay", "2026-08-27")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/dich-vu/" + dichVuId + "/bang-gia")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bangGiaPayload()))
                .andExpect(status().isForbidden());
    }

    private Long themDichVu(Long toaNhaId) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, 'Dịch vụ giá cố định', 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId
        );
    }

    private String bangGiaPayload() {
        return """
                {
                  "donGia": "100000.00",
                  "ngayHieuLuc": "2026-08-01"
                }
                """;
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
