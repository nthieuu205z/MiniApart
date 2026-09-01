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

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ToaNhaAuthorizationIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (1, 2, 4, 5)");
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
    void FR_AUT_05_managerListShowsOnlyAssignedBuildings() throws Exception {
        String token = loginAndExtractToken(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].maToa").value("TN-A"))
                .andExpect(jsonPath("$[0].ten").value("Toà A — Ngõ Hoà Bình"));
    }

    @Test
    void FR_AUT_05_TC_002_02_managerDetailReturns403ForForeignAssignedBuildingId() throws Exception {
        String token = loginAndExtractToken(3L, "0900000003");

        ToaNhaScopeAuthorizationTestHelper.assertChiTietEndpointScope(
                mockMvc,
                token,
                1L,
                2L,
                9999L,
                toaNhaId -> get("/api/toa-nha/" + toaNhaId)
        );
    }

    @Test
    void FR_AUT_05_managerDetailReturnsAssignedBuildingData() throws Exception {
        String token = loginAndExtractToken(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.maToa").value("TN-A"))
                .andExpect(jsonPath("$.ngayChotSo").value(25))
                .andExpect(jsonPath("$.soNgayHanTt").value(7))
                .andExpect(jsonPath("$.nguongThatThoat").value("150000.00"));
    }

    @Test
    void FR_AUT_05_systemAdminSeesAllBuildings() throws Exception {
        String token = loginAndExtractToken(1L, "0900000001");

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void FR_AUT_05_BR_17_systemAdminCanListBuildingsButCannotOpenBuildingData() throws Exception {
        ganToaChoNguoiDung(1L, 1L);
        String token = loginAndExtractToken(1L, "0900000001");

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        mockMvc.perform(get("/api/toa-nha/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_AUT_05_ownerSeesOnlyAssignedBuildingsFromPhanQuyenToa() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        ganToaChoNguoiDung(2L, 2L);
        String token = loginAndExtractToken(2L, "0900000002");

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void FR_AUT_05_workerAndTenantSeeOnlyTheirAssignedBuildings() throws Exception {
        ganToaChoNguoiDung(4L, 2L);
        ganToaChoNguoiDung(5L, 1L);

        String workerToken = loginAndExtractToken(4L, "0900000004");
        String tenantToken = loginAndExtractToken(5L, "0900000006");

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(2));

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(1));
    }

    @Test
    void FR_AUT_05_missingAuthenticationStillReturns401() throws Exception {
        mockMvc.perform(get("/api/toa-nha"))
                .andExpect(status().isUnauthorized());
    }

    private void ganToaChoNguoiDung(Long nguoiDungId, Long toaNhaId) {
        jdbcTemplate.update(
                "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, ?)",
                nguoiDungId,
                toaNhaId
        );
    }

    private String loginAndExtractToken(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(runtimePassword),
                nguoiDungId
        );

        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(soDienThoai, runtimePassword)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        int tokenValueStart = responseBody.indexOf("\"token\":\"") + 9;
        int tokenValueEnd = responseBody.indexOf('"', tokenValueStart);
        return responseBody.substring(tokenValueStart, tokenValueEnd);
    }

    private String loginPayload(String soDienThoai, String matKhau) {
        return """
                {"soDienThoai":"%s","matKhau":"%s"}
                """.formatted(soDienThoai, matKhau);
    }
}
