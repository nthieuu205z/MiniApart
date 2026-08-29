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
class PhongAuthorizationIntegrationTest {

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
    void FR_BLD_02_forbiddenRolesReceive403OnEveryRoomEndpoint() throws Exception {
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");

        assert403OnAllRoomEndpoints(workerToken);
        assert403OnAllRoomEndpoints(tenantToken);
    }

    @Test
    void FR_BLD_02_managerReceives403OutsideAssignedBuildingScope() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/2/phong")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(phongPayload()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/phong/hang-loat/xem-truoc")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/phong/hang-loat")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload()))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_BLD_04_CR_012_thoVaNguoiThueNhan403ChoLenhTinhLaiTrangThaiPhong() throws Exception {
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(post("/api/toa-nha/1/phong/tinh-lai-trang-thai")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/phong/tinh-lai-trang-thai")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_BLD_04_CR_012_quanLyNhan403ChoLenhTinhLaiTrangThaiPhongNgoaiPhamVi() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/2/phong/tinh-lai-trang-thai")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    private void assert403OnAllRoomEndpoints(String token) throws Exception {
        mockMvc.perform(get("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(phongPayload()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat/xem-truoc")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload()))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload()))
                .andExpect(status().isForbidden());
    }

    private String phongPayload() {
        return """
                {
                  "soPhong": "305",
                  "tang": 3,
                  "dienTich": "22.50",
                  "sucChua": 4,
                  "giaThueMacDinh": "3500000.00",
                  "loaiPhong": "Studio"
                }
                """;
    }

    private String hangLoatPayload() {
        return """
                {
                  "soBatDau": "201",
                  "soKetThuc": "203",
                  "tang": 2,
                  "dienTich": "20.00",
                  "sucChua": 3,
                  "giaThueMacDinh": "3200000.00",
                  "loaiPhong": "Studio"
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
