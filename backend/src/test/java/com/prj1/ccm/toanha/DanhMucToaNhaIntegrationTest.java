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

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class DanhMucToaNhaIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM BANG_GIA_BAC_THANG");
        jdbcTemplate.update("DELETE FROM BANG_GIA");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
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
        jdbcTemplate.update(
                """
                        UPDATE TOA_NHA
                        SET ma_toa = CASE id WHEN 1 THEN 'TN-A' ELSE 'TN-B' END,
                            ten = CASE id WHEN 1 THEN 'Toà A — Ngõ Hoà Bình' ELSE 'Toà B — Bến Vân Đồn' END,
                            dia_chi = CASE id WHEN 1 THEN 'Số 12 ngõ 34 đường Hoà Bình, Phường Mẫu, Hà Nội'
                                              ELSE 'Số 8 đường Bến Vân Đồn, Phường Mẫu, Thành phố Hồ Chí Minh' END,
                            so_tang = CASE id WHEN 1 THEN 6 ELSE 5 END,
                            ngay_chot_so = CASE id WHEN 1 THEN 25 ELSE 26 END,
                            so_ngay_han_tt = 7,
                            tk_ngan_hang = CASE id WHEN 1 THEN '9704-0000-0000-0101' ELSE '9704-0000-0000-0202' END,
                            nguong_that_thoat = CASE id WHEN 1 THEN 150000.00 ELSE 175000.00 END
                        WHERE id IN (1, 2)
                        """);
    }

    @Test
    void FR_BLD_01_ownerCreatesAndUpdatesBuildingAndKeepsDecimalThreshold() throws Exception {
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maToa": "TN-C",
                                  "ten": "Toà C",
                                  "diaChi": "Địa chỉ mẫu",
                                  "soTang": 3,
                                  "ngayChotSo": 28,
                                  "soNgayHanTt": 5,
                                  "tkNganHang": "0123456789",
                                  "nguongThatThoat": "12.35",
                                  "batBuocAnhCongTo": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maToa").value("TN-C"))
                .andExpect(jsonPath("$.soTang").value(3))
                .andExpect(jsonPath("$.nguongThatThoat").value("12.35"))
                .andExpect(jsonPath("$.batBuocAnhCongTo").value(true));

        Long toaNhaId = jdbcTemplate.queryForObject(
                "SELECT id FROM TOA_NHA WHERE ma_toa = 'TN-C'", Long.class);

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(toaNhaId))
                .andExpect(jsonPath("$[0].batBuocAnhCongTo").value(true));

        mockMvc.perform(put("/api/toa-nha/" + toaNhaId)
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maToa": "TN-C",
                                  "ten": "Toà C đã sửa",
                                  "diaChi": "Địa chỉ mới",
                                  "soTang": 4,
                                  "ngayChotSo": 27,
                                  "soNgayHanTt": 8,
                                  "tkNganHang": "0123456789 — Ngân hàng Mẫu",
                                  "nguongThatThoat": "12.35",
                                  "batBuocAnhCongTo": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Toà C đã sửa"))
                .andExpect(jsonPath("$.nguongThatThoat").value("12.35"))
                .andExpect(jsonPath("$.batBuocAnhCongTo").value(false));
    }

    @Test
    void FR_BLD_01_onlyOwnerAndSystemAdminCreateAndManagerUpdatesOwnBuilding() throws Exception {
        String adminToken = login(1L, "0900000001");
        String managerToken = login(3L, "0900000003");
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");

        String createPayload = """
                {
                  "maToa": "TN-NEW",
                  "ten": "Toà mới",
                  "diaChi": "Địa chỉ mới",
                  "soTang": 3,
                  "ngayChotSo": 1,
                  "soNgayHanTt": 5,
                  "tkNganHang": "0123",
                  "nguongThatThoat": "10.00",
                  "batBuocAnhCongTo": false
                }
                """;

        mockMvc.perform(post("/api/toa-nha").header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(createPayload))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/toa-nha").header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(createPayload))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/toa-nha").header("Authorization", "Bearer " + tenantToken)
                        .contentType(MediaType.APPLICATION_JSON).content(createPayload))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/toa-nha").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(createPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maToa").value("TN-NEW"));

        mockMvc.perform(put("/api/toa-nha/1").header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maToa": "TN-A",
                                  "ten": "Toà A do quản lý cập nhật",
                                  "diaChi": "Địa chỉ A",
                                  "soTang": 6,
                                  "ngayChotSo": 25,
                                  "soNgayHanTt": 7,
                                  "tkNganHang": "9704",
                                  "nguongThatThoat": "150000.00",
                                  "batBuocAnhCongTo": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Toà A do quản lý cập nhật"))
                .andExpect(jsonPath("$.batBuocAnhCongTo").value(true));

        String updatePayload = """
                {
                  "maToa": "TN-A",
                  "ten": "Toà A bị từ chối cập nhật",
                  "diaChi": "Địa chỉ A",
                  "soTang": 6,
                  "ngayChotSo": 25,
                  "soNgayHanTt": 7,
                  "tkNganHang": "9704",
                  "nguongThatThoat": "150000.00"
                }
                """;

        mockMvc.perform(put("/api/toa-nha/1").header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(updatePayload))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/toa-nha/1").header("Authorization", "Bearer " + tenantToken)
                        .contentType(MediaType.APPLICATION_JSON).content(updatePayload))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_BLD_01_managerCannotUpdateBuildingOutsideAssignedScope() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(put("/api/toa-nha/2")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "maToa": "TN-B",
                                  "ten": "Toà B bị quản lý ngoài phạm vi sửa",
                                  "diaChi": "Địa chỉ B",
                                  "soTang": 5,
                                  "ngayChotSo": 26,
                                  "soNgayHanTt": 7,
                                  "tkNganHang": "9704",
                                  "nguongThatThoat": "175000.00"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_BLD_01_invalidClosingDayExplainsFebruaryAndDuplicateCodeIsReadable() throws Exception {
        String adminToken = login(1L, "0900000001");

        mockMvc.perform(post("/api/toa-nha").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildingPayload("TN-INVALID", 29)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("tháng hai")));

        mockMvc.perform(post("/api/toa-nha").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(buildingPayload("TN-A", 1)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao", containsString("Mã toà")));
    }

    private String buildingPayload(String maToa, int ngayChotSo) {
        return """
                {
                  "maToa": "%s",
                  "ten": "Toà kiểm thử",
                  "diaChi": "Địa chỉ kiểm thử",
                  "soTang": 3,
                  "ngayChotSo": %d,
                  "soNgayHanTt": 5,
                  "tkNganHang": "0123",
                  "nguongThatThoat": "10.00",
                  "batBuocAnhCongTo": false
                }
                """.formatted(maToa, ngayChotSo);
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(runtimePassword), nguoiDungId
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
