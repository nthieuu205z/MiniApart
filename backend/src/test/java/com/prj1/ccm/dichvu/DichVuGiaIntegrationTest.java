package com.prj1.ccm.dichvu;

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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

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
class DichVuGiaIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private ObjectMapper objectMapper;

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
                        """);
    }

    @Test
    void FR_BLD_05_declaresAllFourCalculationModesAndKeepsServiceToggleWithoutDelete() throws Exception {
        String managerToken = login(3L, "0900000003");
        taoDichVu(managerToken, "Điện", "THEO_CHI_SO", "CO_DINH", "kWh", true);
        taoDichVu(managerToken, "Internet", "CO_DINH", "CO_DINH", "tháng", false);
        taoDichVu(managerToken, "Nước theo người", "THEO_NGUOI", "CO_DINH", "người/tháng", false);
        String soLuongService = taoDichVu(managerToken, "Chỗ để xe", "THEO_SO_LUONG", "CO_DINH", "chiếc", false);

        mockMvc.perform(put("/api/dich-vu/" + soLuongService)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(servicePayload("Chỗ để xe", "THEO_SO_LUONG", "CO_DINH", "chiếc", false, false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dangSuDung").value(false));

        mockMvc.perform(get("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].cachTinh").value("THEO_CHI_SO"))
                .andExpect(jsonPath("$[0].laDien").value(true))
                .andExpect(jsonPath("$[3].dangSuDung").value(false));

        Integer serviceCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM DICH_VU", Integer.class);
        org.assertj.core.api.Assertions.assertThat(serviceCount).isEqualTo(4);
    }

    @Test
    void FR_BLD_05_forbiddenRoleCannotReadOrChangeServiceCatalog() throws Exception {
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (4, 1)");
        String workerToken = login(4L, "0900000004");

        mockMvc.perform(get("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(servicePayload("Điện", "THEO_CHI_SO", "CO_DINH", "kWh", true, true)))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_BLD_06_fixedPriceUsesLargestEffectiveDateNotLatestInsertedAndReportsNoEarlierPriceClearly() throws Exception {
        String managerToken = login(3L, "0900000003");
        String serviceId = taoDichVu(managerToken, "Internet", "CO_DINH", "CO_DINH", "tháng", false);

        themBangGia(managerToken, serviceId, "100.00", "2026-01-01");
        themBangGia(managerToken, serviceId, "120.00", "2026-03-01");

        mockMvc.perform(get("/api/dich-vu/" + serviceId + "/bang-gia")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].donGia").value("120.00"));

        mockMvc.perform(get("/api/dich-vu/" + serviceId + "/bang-gia/ap-dung?ngay=2026-02-01")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donGia").value("100.00"));

        mockMvc.perform(get("/api/dich-vu/" + serviceId + "/bang-gia/ap-dung?ngay=2025-12-31")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.thongBao", containsString("Chưa có")));

        mockMvc.perform(put("/api/dich-vu/" + serviceId + "/bang-gia/1")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"donGia\":\"999.00\",\"ngayHieuLuc\":\"2026-01-01\"}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void FR_BLD_07_FR_BLD_08_savesFiveTierRowsWithDerivedPricesAndKeepsMultipleEffectiveSets() throws Exception {
        String managerToken = login(3L, "0900000003");
        String serviceId = taoDichVu(managerToken, "Điện", "THEO_CHI_SO", "BAC_THANG", "kWh", true);

        mockMvc.perform(post("/api/dich-vu/" + serviceId + "/bac-thang")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tierPayload("2026-01-01", "2204.0655", "90.00", "108.00", "136.00", "162.00", "180.00")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ngayHieuLuc").value("2026-01-01"))
                .andExpect(jsonPath("$.cacBac", hasSize(5)))
                .andExpect(jsonPath("$.cacBac[0].donGia").value("1984.00"))
                .andExpect(jsonPath("$.cacBac[4].denSoLuong").doesNotExist());

        mockMvc.perform(post("/api/dich-vu/" + serviceId + "/bac-thang")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tierPayload("2026-03-01", "2400", "90.00", "108.00", "136.00", "162.00", "180.00")))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/dich-vu/" + serviceId + "/bac-thang")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)));

        mockMvc.perform(get("/api/dich-vu/" + serviceId + "/bac-thang/ap-dung?ngay=2026-02-01")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ngayHieuLuc").value("2026-01-01"))
                .andExpect(jsonPath("$.cacBac[0].donGia").value("1984.00"));

        mockMvc.perform(put("/api/dich-vu/" + serviceId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(servicePayload("Điện", "THEO_CHI_SO", "CO_DINH", "kWh", true, true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cheDoGia").value("CO_DINH"));

        mockMvc.perform(get("/api/dich-vu/" + serviceId + "/bac-thang")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)));
    }

    @Test
    void FR_BLD_07_FR_BLD_08_rejectsTierGapsOverlapsAndNonElectricTierMode() throws Exception {
        String managerToken = login(3L, "0900000003");
        String serviceId = taoDichVu(managerToken, "Điện", "THEO_CHI_SO", "BAC_THANG", "kWh", true);

        mockMvc.perform(post("/api/dich-vu/" + serviceId + "/bac-thang")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tierPayloadWithBounds("2026-01-01", "2204.0655", "0", "100", "102", "200")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("liền nhau")));

        mockMvc.perform(post("/api/dich-vu/" + serviceId + "/bac-thang")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tierPayloadWithBounds("2026-01-01", "2204.0655", "0", "100", "100", "200")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("liền nhau")));

        String internetId = taoDichVu(managerToken, "Internet", "CO_DINH", "CO_DINH", "tháng", false);
        mockMvc.perform(put("/api/dich-vu/" + internetId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(servicePayload("Internet", "CO_DINH", "BAC_THANG", "tháng", false, true)))
                .andExpect(status().isBadRequest());
    }

    private String taoDichVu(
            String token,
            String ten,
            String cachTinh,
            String cheDoGia,
            String donViTinh,
            boolean laDien
    ) throws Exception {
        String body = mockMvc.perform(post("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(servicePayload(ten, cachTinh, cheDoGia, donViTinh, laDien, true)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        return json.get("id").toString();
    }

    private void themBangGia(String token, String serviceId, String donGia, String ngay) throws Exception {
        mockMvc.perform(post("/api/dich-vu/" + serviceId + "/bang-gia")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"donGia\":\"%s\",\"ngayHieuLuc\":\"%s\"}".formatted(donGia, ngay)))
                .andExpect(status().isCreated());
    }

    private String servicePayload(
            String ten,
            String cachTinh,
            String cheDoGia,
            String donViTinh,
            boolean laDien,
            boolean dangSuDung
    ) {
        return """
                {
                  "ten": "%s",
                  "cachTinh": "%s",
                  "cheDoGia": "%s",
                  "donViTinh": "%s",
                  "laDien": %s,
                  "dangSuDung": %s
                }
                """.formatted(ten, cachTinh, cheDoGia, donViTinh, laDien, dangSuDung);
    }

    private String tierPayload(
            String ngay,
            String giaBinhQuan,
            String tyLe1,
            String tyLe2,
            String tyLe3,
            String tyLe4,
            String tyLe5
    ) {
        return """
                {
                  "ngayHieuLuc": "%s",
                  "giaBanLeBinhQuan": "%s",
                  "cacBac": [
                    {"bac": 1, "tuSoLuong": 0, "denSoLuong": 100, "tyLe": "%s"},
                    {"bac": 2, "tuSoLuong": 101, "denSoLuong": 200, "tyLe": "%s"},
                    {"bac": 3, "tuSoLuong": 201, "denSoLuong": 400, "tyLe": "%s"},
                    {"bac": 4, "tuSoLuong": 401, "denSoLuong": 700, "tyLe": "%s"},
                    {"bac": 5, "tuSoLuong": 701, "denSoLuong": null, "tyLe": "%s"}
                  ]
                }
                """.formatted(ngay, giaBinhQuan, tyLe1, tyLe2, tyLe3, tyLe4, tyLe5);
    }

    private String tierPayloadWithBounds(
            String ngay,
            String giaBinhQuan,
            String tu1,
            String den1,
            String tu2,
            String den2
    ) {
        return """
                {
                  "ngayHieuLuc": "%s",
                  "giaBanLeBinhQuan": "%s",
                  "cacBac": [
                    {"bac": 1, "tuSoLuong": %s, "denSoLuong": %s, "tyLe": "90.00"},
                    {"bac": 2, "tuSoLuong": %s, "denSoLuong": %s, "tyLe": "108.00"},
                    {"bac": 3, "tuSoLuong": 201, "denSoLuong": 400, "tyLe": "136.00"},
                    {"bac": 4, "tuSoLuong": 401, "denSoLuong": 700, "tyLe": "162.00"},
                    {"bac": 5, "tuSoLuong": 701, "denSoLuong": null, "tyLe": "180.00"}
                  ]
                }
                """.formatted(ngay, giaBinhQuan, tu1, den1, tu2, den2);
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
