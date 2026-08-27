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
                                  "nguongThatThoat": "12.35"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maToa").value("TN-C"))
                .andExpect(jsonPath("$.soTang").value(3))
                .andExpect(jsonPath("$.nguongThatThoat").value("12.35"));

        Long toaNhaId = jdbcTemplate.queryForObject(
                "SELECT id FROM TOA_NHA WHERE ma_toa = 'TN-C'", Long.class);

        mockMvc.perform(get("/api/toa-nha")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(toaNhaId));

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
                                  "nguongThatThoat": "12.35"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Toà C đã sửa"))
                .andExpect(jsonPath("$.nguongThatThoat").value("12.35"));
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
                  "nguongThatThoat": "10.00"
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
                                  "nguongThatThoat": "150000.00"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Toà A do quản lý cập nhật"));
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

    @Test
    void FR_BLD_02_managerCreatesRoomAndBatchPreviewContractWritesRoomsAsEmpty() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roomPayload("201", 2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.toaNhaId").value(1))
                .andExpect(jsonPath("$.soPhong").value("201"))
                .andExpect(jsonPath("$.trangThai").value("TRONG"))
                .andExpect(jsonPath("$.tenTrangThai").value("Trống"))
                .andExpect(jsonPath("$.giaThueMacDinh").value("3500000.00"));

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tang": 2,
                                  "soPhongDau": 202,
                                  "soPhongCuoi": 204,
                                  "dienTich": 22.50,
                                  "sucChua": 4,
                                  "giaThueMacDinh": "3500000",
                                  "loaiPhong": "Tiêu chuẩn"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phong", hasSize(3)))
                .andExpect(jsonPath("$.phong[0].soPhong").value("202"))
                .andExpect(jsonPath("$.phong[2].trangThai").value("TRONG"));

        mockMvc.perform(get("/api/toa-nha/1/phong?tang=2")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)));
    }

    @Test
    void FR_BLD_02_roomNumberIsUniquePerBuildingAndCapacityOrClientStatusIsRejected() throws Exception {
        String adminToken = login(1L, "0900000001");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(roomPayload("101", 1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(roomPayload("101", 1)))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/toa-nha/2/phong")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(roomPayload("101", 1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roomPayload("102", 1).replace("\"sucChua\": 4", "\"sucChua\": 0")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roomPayload("103", 1).replace("\"loaiPhong\": \"Tiêu chuẩn\"", "\"loaiPhong\": \"Tiêu chuẩn\", \"trangThai\": \"DANG_THUE\"")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void FR_BLD_03_floorMapGroupsRoomsSortsThemAndUsesTextLabelsAndCounts() throws Exception {
        seedRoom("302", 3, "DANG_SUA");
        seedRoom("301", 3, "TRONG");
        seedRoom("201", 2, "DANG_THUE");
        seedRoom("202", 2, "DA_COC");
        seedRoom("101", 1, "NGUNG");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1/so-do")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tang", hasSize(6)))
                .andExpect(jsonPath("$.tang[0].soTang").value(6))
                .andExpect(jsonPath("$.tang[3].soTang").value(3))
                .andExpect(jsonPath("$.tang[3].phong[0].soPhong").value("301"))
                .andExpect(jsonPath("$.tang[3].phong[0].tenTrangThai").value("Trống"))
                .andExpect(jsonPath("$.tongKet.trong").value(1))
                .andExpect(jsonPath("$.tongKet.dangThue").value(1))
                .andExpect(jsonPath("$.tongKet.dangSua").value(1))
                .andExpect(jsonPath("$.tongKet.daCoc").value(1))
                .andExpect(jsonPath("$.tongKet.ngung").value(1));
    }

    @Test
    void FR_BLD_03_workerCannotReadBuildingRoomMapEvenWhenAssignedBuildingExists() throws Exception {
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (4, 1)");
        String workerToken = login(4L, "0900000004");

        mockMvc.perform(get("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/toa-nha/1/so-do")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }

    private void seedRoom(String soPhong, int tang, String trangThai) {
        jdbcTemplate.update(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (1, ?, ?, 22.50, 4, 3500000.00, 'Tiêu chuẩn', ?)
                        """,
                soPhong, tang, trangThai
        );
    }

    private String roomPayload(String soPhong, int tang) {
        return """
                {
                  "soPhong": "%s",
                  "tang": %d,
                  "dienTich": 22.5,
                  "sucChua": 4,
                  "giaThueMacDinh": "3500000.00",
                  "loaiPhong": "Tiêu chuẩn"
                }
                """.formatted(soPhong, tang);
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
                  "nguongThatThoat": "10.00"
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
