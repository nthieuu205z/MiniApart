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
class KyThanhToanAuthorizationIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
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
    void FR_MTR_01_forbiddenRolesReceive403OnPaymentPeriodReadAndWrite() throws Exception {
        assert403OnKyThanhToanEndpoints(login(4L, "0900000004"));
        assert403OnKyThanhToanEndpoints(login(5L, "0900000006"));
    }

    @Test
    void FR_AUT_05_managerReceives403ForPaymentPeriodsOutsideAssignedBuildingScope() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/2/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/ky-thanh-toan")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(kyThanhToanPayload()))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MTR_01_missingAuthenticationReturns401OnPaymentPeriodEndpoints() throws Exception {
        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(kyThanhToanPayload()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_MTR_08_forbiddenRolesReceive403OnClosingEndpoints() throws Exception {
        assert403OnKyThanhToanClosingEndpoints(login(4L, "0900000004"));
        assert403OnKyThanhToanClosingEndpoints(login(5L, "0900000006"));
    }

    @Test
    void FR_MTR_08_managerReceives403ForClosingEndpointsOutsideAssignedBuildingScope() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/2/ky-thanh-toan/1/thieu-chi-so")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/ky-thanh-toan/1/chot")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    private void assert403OnKyThanhToanEndpoints(String token) throws Exception {
        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(kyThanhToanPayload()))
                .andExpect(status().isForbidden());
    }

    private void assert403OnKyThanhToanClosingEndpoints(String token) throws Exception {
        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/1/thieu-chi-so")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/1/chot")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    private String kyThanhToanPayload() {
        return """
                {
                  "nam": 2026,
                  "thang": 8
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
