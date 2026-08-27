package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.Assertions;
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

import java.util.List;
import java.util.Map;
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
class DanhMucDichVuIntegrationTest {

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
    }

    @Test
    void FR_BLD_05_listsCreatesUpdatesAndTogglesServicesWithinBuildingScope() throws Exception {
        themDichVu(1L, "Điện sinh hoạt", "THEO_CHI_SO", "CO_DINH", "kWh", true, true);
        Long internetId = themDichVu(1L, "Internet", "CO_DINH", "CO_DINH", "tháng", false, true);
        themDichVu(2L, "Giữ xe", "THEO_SO_LUONG", "CO_DINH", "chiếc", false, true);

        String managerToken = login(3L, "0900000003");
        String ownerToken = login(2L, "0900000002");
        ganToaChoNguoiDung(2L, 1L);

        mockMvc.perform(get("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].ten").value("Internet"))
                .andExpect(jsonPath("$[1].ten").value("Điện sinh hoạt"))
                .andExpect(jsonPath("$[1].cachTinh").value("THEO_CHI_SO"))
                .andExpect(jsonPath("$[1].laDien").value(true));

        mockMvc.perform(post("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dichVuPayload("Phí quản lý", "THEO_NGUOI", "người", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ten").value("Phí quản lý"))
                .andExpect(jsonPath("$.cachTinh").value("THEO_NGUOI"))
                .andExpect(jsonPath("$.donVi").value("người"))
                .andExpect(jsonPath("$.laDien").value(false))
                .andExpect(jsonPath("$.dangSuDung").value(true));

        Map<String, Object> dichVuMoi = jdbcTemplate.queryForMap(
                "SELECT che_do_gia, la_dien, dang_su_dung FROM DICH_VU WHERE toa_nha_id = 1 AND ten = 'Phí quản lý'"
        );
        Assertions.assertEquals("CO_DINH", dichVuMoi.get("che_do_gia"));
        Assertions.assertEquals(Boolean.FALSE, dichVuMoi.get("la_dien"));
        Assertions.assertEquals(Boolean.TRUE, dichVuMoi.get("dang_su_dung"));

        mockMvc.perform(put("/api/toa-nha/1/dich-vu/" + internetId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dichVuPayload("Internet cáp quang", "CO_DINH", "tháng", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(internetId))
                .andExpect(jsonPath("$.ten").value("Internet cáp quang"))
                .andExpect(jsonPath("$.donVi").value("tháng"));

        mockMvc.perform(put("/api/toa-nha/1/dich-vu/" + internetId + "/trang-thai")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dangSuDung": false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(internetId))
                .andExpect(jsonPath("$.dangSuDung").value(false));

        List<Map<String, Object>> dichVuToaMot = jdbcTemplate.queryForList(
                """
                        SELECT ten, dang_su_dung
                        FROM DICH_VU
                        WHERE toa_nha_id = 1
                        ORDER BY ten
                        """
        );
        Assertions.assertEquals(
                List.of("Internet cáp quang", "Phí quản lý", "Điện sinh hoạt"),
                dichVuToaMot.stream().map(item -> String.valueOf(item.get("ten"))).toList()
        );
        Assertions.assertEquals(Boolean.FALSE, dichVuToaMot.get(0).get("dang_su_dung"));
    }

    @Test
    void FR_BLD_05_rejectsElectricFlagForNonMeteredServices() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/dich-vu")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dichVuPayload("Internet sai cờ", "CO_DINH", "tháng", true)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("điện")));
    }

    private Long themDichVu(
            Long toaNhaId,
            String ten,
            String cachTinh,
            String cheDoGia,
            String donVi,
            boolean laDien,
            boolean dangSuDung
    ) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten,
                cachTinh,
                cheDoGia,
                donVi,
                laDien,
                dangSuDung
        );
    }

    private void ganToaChoNguoiDung(Long nguoiDungId, Long toaNhaId) {
        jdbcTemplate.update(
                "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, ?)",
                nguoiDungId,
                toaNhaId
        );
    }

    private String dichVuPayload(String ten, String cachTinh, String donVi, boolean laDien) {
        return """
                {
                  "ten": "%s",
                  "cachTinh": "%s",
                  "donVi": "%s",
                  "laDien": %s
                }
                """.formatted(ten, cachTinh, donVi, laDien);
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
