package com.prj1.ccm.nguoithue;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class NguoiThueAuthorizationIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long nguoiThueId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
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
                            trang_thai = 'HOAT_DONG'
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES ('Hồ sơ mẫu', DATE '1999-01-01', '0908123123', '012312312312', 'Thanh Hóa', NULL)
                        """
        );
        nguoiThueId = jdbcTemplate.queryForObject(
                "SELECT id FROM NGUOI_THUE WHERE so_dien_thoai = '0908123123'",
                Long.class
        );
    }

    @Test
    void FR_TNT_01_thoVaNguoiThueNhan403ChoTatCaNguoiThueEndpoints() throws Exception {
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");

        assert403OnAllTenantEndpoints(workerToken);
        assert403OnAllTenantEndpoints(tenantToken);
    }

    private void assert403OnAllTenantEndpoints(String token) throws Exception {
        mockMvc.perform(get("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tenantPayload()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/nguoi-thue/" + nguoiThueId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/nguoi-thue/" + nguoiThueId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tenantPayload()))
                .andExpect(status().isForbidden());
    }

    private String tenantPayload() {
        return """
                {
                  "hoTen": "Người thuê bị chặn",
                  "ngaySinh": "1998-05-20",
                  "soDienThoai": "0901555666",
                  "soGiayTo": "079123456789",
                  "queQuan": "Phú Yên"
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
