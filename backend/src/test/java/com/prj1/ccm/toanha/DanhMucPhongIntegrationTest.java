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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class DanhMucPhongIntegrationTest {

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
    void FR_BLD_02_listsRoomsScopedToBuildingAndFiltersByFloor() throws Exception {
        themPhong(1L, "201", 2, "22.50", 4, "3500000.00", "Thuong", "TRONG");
        themPhong(1L, "301", 3, "24.00", 5, "4100000.00", "Gac xep", "TRONG");
        themPhong(2L, "201", 2, "19.00", 3, "3200000.00", "Studio", "TRONG");

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1/phong")
                        .param("tang", "2")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].soPhong").value("201"))
                .andExpect(jsonPath("$[0].tang").value(2));
    }

    @Test
    void FR_BLD_02_createsSingleRoomWithSystemOwnedTrongStatusAndIgnoresClientStatus() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "soPhong": "305",
                                  "tang": 3,
                                  "dienTich": "22.50",
                                  "sucChua": 4,
                                  "giaThueMacDinh": "3500000.00",
                                  "loaiPhong": "Studio",
                                  "trangThai": "DANG_THUE"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.soPhong").value("305"))
                .andExpect(jsonPath("$.trangThai").value("TRONG"))
                .andExpect(jsonPath("$.tenTrangThai").value("Trống"));
    }

    @Test
    void FR_BLD_02_rejectsDuplicateRoomNumberInsideSameBuildingButAllowsAnotherBuilding() throws Exception {
        themPhong(1L, "101", 1, "20.00", 3, "3000000.00", "Studio", "TRONG");
        ganToaChoNguoiDung(2L, 1L);
        ganToaChoNguoiDung(2L, 2L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(phongPayload("101", 1, "20.00", 3, "3000000.00", "Studio")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao", containsString("Số phòng")));

        mockMvc.perform(post("/api/toa-nha/2/phong")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(phongPayload("101", 1, "20.00", 3, "3000000.00", "Studio")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.toaNhaId").value(2))
                .andExpect(jsonPath("$.soPhong").value("101"));
    }

    @Test
    void FR_BLD_02_rejectsNonPositiveCapacity() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(phongPayload("302", 3, "22.50", 0, "3500000.00", "Studio")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("Sức chứa")));
    }

    @Test
    void FR_BLD_02_batchPreviewStaysNonPersistentUntilConfirmationAndCreatesRequestedSequence() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat/xem-truoc")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload("201", "203", 2, "20.00", 3, "3200000.00", "Studio")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phong", hasSize(3)))
                .andExpect(jsonPath("$.phong[0].soPhong").value("201"))
                .andExpect(jsonPath("$.phong[2].soPhong").value("203"));

        Integer demSauPreview = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM PHONG WHERE toa_nha_id = 1", Integer.class);
        Assertions.assertEquals(0, demSauPreview);

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload("201", "203", 2, "20.00", 3, "3200000.00", "Studio")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phong", hasSize(3)))
                .andExpect(jsonPath("$.phong[1].soPhong").value("202"))
                .andExpect(jsonPath("$.phong[1].trangThai").value("TRONG"));

        List<Map<String, Object>> phongDaTao = jdbcTemplate.queryForList(
                "SELECT so_phong, tang, trang_thai FROM PHONG WHERE toa_nha_id = 1 ORDER BY so_phong"
        );
        Assertions.assertEquals(
                List.of("201", "202", "203"),
                phongDaTao.stream().map(item -> String.valueOf(item.get("so_phong"))).toList()
        );
    }

    @Test
    void FR_BLD_02_batchPreviewRejectsDuplicateConflictsBeforePersistence() throws Exception {
        themPhong(1L, "202", 2, "20.00", 3, "3200000.00", "Studio", "TRONG");
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat/xem-truoc")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(hangLoatPayload("201", "203", 2, "20.00", 3, "3200000.00", "Studio")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao", containsString("202")));
    }

    @Test
    void FR_BLD_02_returnsConflictAndRollsBackBatchWhenDatabaseRejectsMidBatchDuplicate() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");
        batCheDoGiaLapTrungSoPhong("202");

        try {
            mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                            .header("Authorization", "Bearer " + ownerToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(hangLoatPayload("201", "203", 2, "20.00", 3, "3200000.00", "Studio")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.thongBao", containsString("Số phòng")));

            Integer demSauThatBai = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM PHONG WHERE toa_nha_id = 1",
                    Integer.class
            );
            Assertions.assertEquals(0, demSauThatBai);
        } finally {
            tatCheDoGiaLapTrungSoPhong();
        }
    }

    @Test
    void FR_BLD_02_rejectsOutOfRangeBatchRoomNumbersWithBadRequest() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");
        String payload = hangLoatPayload(
                "99999999999999999999999999999999999999999999999999",
                "100000000000000000000000000000000000000000000000000",
                2,
                "20.00",
                3,
                "3200000.00",
                "Studio"
        );

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat/xem-truoc")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("Dải số phòng")));

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("Dải số phòng")));
    }

    @Test
    void FR_BLD_02_createsSingleRoomAtIntegerMaximumWithoutOverflow() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");
        String payload = hangLoatPayload(
                "2147483647",
                "2147483647",
                2,
                "20.00",
                3,
                "3200000.00",
                "Studio"
        );

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phong", hasSize(1)))
                .andExpect(jsonPath("$.phong[0].soPhong").value("2147483647"));

        List<String> soPhongDaLuu = jdbcTemplate.queryForList(
                "SELECT so_phong FROM PHONG WHERE toa_nha_id = 1",
                String.class
        );
        Assertions.assertEquals(List.of("2147483647"), soPhongDaLuu);
    }

    @Test
    void FR_BLD_02_rejectsParseableBatchAboveOneThousandWithoutPersistence() throws Exception {
        ganToaChoNguoiDung(2L, 1L);
        String ownerToken = login(2L, "0900000002");
        String payload = hangLoatPayload("1", "1001", 2, "20.00", 3, "3200000.00", "Studio");

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat/xem-truoc")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("1.000")));

        mockMvc.perform(post("/api/toa-nha/1/phong/hang-loat")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("1.000")));

        Integer demPhong = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM PHONG WHERE toa_nha_id = 1",
                Integer.class
        );
        Assertions.assertEquals(0, demPhong);
    }

    private void themPhong(
            Long toaNhaId,
            String soPhong,
            int tang,
            String dienTich,
            int sucChua,
            String giaThueMacDinh,
            String loaiPhong,
            String trangThai
    ) {
        jdbcTemplate.update(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                toaNhaId,
                soPhong,
                tang,
                new BigDecimal(dienTich),
                sucChua,
                new BigDecimal(giaThueMacDinh),
                loaiPhong,
                trangThai
        );
    }

    private void ganToaChoNguoiDung(Long nguoiDungId, Long toaNhaId) {
        jdbcTemplate.update(
                "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, ?)",
                nguoiDungId,
                toaNhaId
        );
    }

    private void batCheDoGiaLapTrungSoPhong(String soPhong) {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS tg_fr_bld_02_duplicate_conflict ON PHONG");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS fr_bld_02_duplicate_conflict()");
        jdbcTemplate.execute(
                """
                        CREATE FUNCTION fr_bld_02_duplicate_conflict()
                        RETURNS trigger
                        LANGUAGE plpgsql
                        AS $$
                        BEGIN
                            IF NEW.so_phong = '%s' THEN
                                RAISE EXCEPTION 'Simulated duplicate room number'
                                    USING ERRCODE = '23505';
                            END IF;
                            RETURN NEW;
                        END;
                        $$;
                        """.formatted(soPhong)
        );
        jdbcTemplate.execute(
                """
                        CREATE TRIGGER tg_fr_bld_02_duplicate_conflict
                        BEFORE INSERT ON PHONG
                        FOR EACH ROW
                        EXECUTE FUNCTION fr_bld_02_duplicate_conflict()
                        """
        );
    }

    private void tatCheDoGiaLapTrungSoPhong() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS tg_fr_bld_02_duplicate_conflict ON PHONG");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS fr_bld_02_duplicate_conflict()");
    }

    private String phongPayload(
            String soPhong,
            int tang,
            String dienTich,
            int sucChua,
            String giaThueMacDinh,
            String loaiPhong
    ) {
        return """
                {
                  "soPhong": "%s",
                  "tang": %d,
                  "dienTich": "%s",
                  "sucChua": %d,
                  "giaThueMacDinh": "%s",
                  "loaiPhong": "%s"
                }
                """.formatted(soPhong, tang, dienTich, sucChua, giaThueMacDinh, loaiPhong);
    }

    private String hangLoatPayload(
            String soBatDau,
            String soKetThuc,
            int tang,
            String dienTich,
            int sucChua,
            String giaThueMacDinh,
            String loaiPhong
    ) {
        return """
                {
                  "soBatDau": "%s",
                  "soKetThuc": "%s",
                  "tang": %d,
                  "dienTich": "%s",
                  "sucChua": %d,
                  "giaThueMacDinh": "%s",
                  "loaiPhong": "%s"
                }
                """.formatted(soBatDau, soKetThuc, tang, dienTich, sucChua, giaThueMacDinh, loaiPhong);
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
