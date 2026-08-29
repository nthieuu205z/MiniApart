package com.prj1.ccm.hopdong;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class NguoiOCungIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long hopDongId;
    private Long phongId;
    private Long nguoiThueDaiDienId;
    private Long nguoiThueKhacId;
    private Long nguoiThueThuBaId;
    private Long phongNgoaiPhamViId;
    private Long hopDongNgoaiPhamViId;
    private Long nguoiThueNgoaiPhamViId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("NGUOI_O_CUNG");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET phien_ban_token = 0,
                            so_lan_sai = 0,
                            lan_sai_dau_tien = NULL,
                            khoa_den = NULL,
                            trang_thai = 'HOAT_DONG',
                            nguoi_thue_id = NULL
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1)");

        phongId = themPhong(1L, "501", 4);
        nguoiThueDaiDienId = themNguoiThue("Người thuê đại diện", "0900001111", "079123456701");
        nguoiThueKhacId = themNguoiThue("Người ở cùng", "0900002222", "079123456702");
        nguoiThueThuBaId = themNguoiThue("Người ở cùng thứ ba", "0900004444", "079123456704");
        hopDongId = themHopDong(phongId, nguoiThueDaiDienId);

        phongNgoaiPhamViId = themPhong(2L, "601", 4);
        nguoiThueNgoaiPhamViId = themNguoiThue("Người thuê ngoài phạm vi", "0900003333", "079123456703");
        hopDongNgoaiPhamViId = themHopDong(phongNgoaiPhamViId, nguoiThueNgoaiPhamViId);
    }

    @Test
    void FR_TNT_02_CR_002_taoDanhSachNguoiOCungBaoGomNguoiThueDaiDienVaHoSoKhac() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(nguoiThueDaiDienId, "Đại diện", "2040-03-01", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nguoiThueId").value(nguoiThueDaiDienId))
                .andExpect(jsonPath("$.tuNgay").value("2040-03-01"))
                .andExpect(jsonPath("$.denNgay").doesNotExist())
                .andExpect(jsonPath("$.canhBaoQuaSucChua").value(false));

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(nguoiThueKhacId, "Bạn", "2040-03-15", "2040-03-20")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nguoiThueId").value(nguoiThueKhacId))
                .andExpect(jsonPath("$.hoTenNguoiThue").value("Người ở cùng"))
                .andExpect(jsonPath("$.denNgay").value("2040-03-20"));

        mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].nguoiThueId").value(nguoiThueDaiDienId))
                .andExpect(jsonPath("$[1].nguoiThueId").value(nguoiThueKhacId));
    }

    @Test
    void FR_TNT_02_CR_002_truyVanSoNguoiTheoNgayDungBienVaThayDoiGiuaKy() throws Exception {
        String managerToken = login(3L, "0900000003");
        themNguoiOCung(managerToken, nguoiThueDaiDienId, "Đại diện", "2040-03-01", null);
        themNguoiOCung(managerToken, nguoiThueKhacId, "Bạn", "2040-03-15", "2040-03-20");

        mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/so-luong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("ngay", "2040-03-14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoi").value(1));

        mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/so-luong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("ngay", "2040-03-15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoi").value(2));

        mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/so-luong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("ngay", "2040-03-20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoi").value(2));

        mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/so-luong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("ngay", "2040-03-21"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoi").value(1));
    }

    @Test
    void FR_TNT_03_CR_002_canhBaoQuaSucChuaNhungVanLuuVaHienThiSoNguoiTrenSucChua() throws Exception {
        String managerToken = login(3L, "0900000003");
        themNguoiOCung(managerToken, nguoiThueDaiDienId, "Đại diện", "2040-03-01", null);

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(nguoiThueThuBaId, "Bạn", "2040-03-15", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.canhBaoQuaSucChua").value(false));

        jdbcTemplate.update("UPDATE PHONG SET suc_chua = 1 WHERE id = ?", phongId);

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(nguoiThueKhacId, "Bạn", "2040-03-15", null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.canhBaoQuaSucChua").value(true))
                .andExpect(jsonPath("$.soNguoiHienTai").value(3))
                .andExpect(jsonPath("$.sucChua").value(1))
                .andExpect(jsonPath("$.thongBaoCanhBao").value(containsString("3 người trên sức chứa 1")));
    }

    @Test
    void FR_TNT_02_CR_002_CR_003_vaiTroVaPhamViKhongDuocPhepNhan403() throws Exception {
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");
        String managerToken = login(3L, "0900000003");

        assert403ForNguoiOCungEndpoints(workerToken, hopDongId, nguoiThueKhacId);
        assert403ForNguoiOCungEndpoints(tenantToken, hopDongId, nguoiThueKhacId);

        mockMvc.perform(get("/api/hop-dong/" + hopDongNgoaiPhamViId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/hop-dong/" + hopDongNgoaiPhamViId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(nguoiThueNgoaiPhamViId, "Bạn", "2040-03-15", null)))
                .andExpect(status().isForbidden());
    }

    private void assert403ForNguoiOCungEndpoints(String token, Long idHopDong, Long idNguoiThue) throws Exception {
        mockMvc.perform(get("/api/hop-dong/" + idHopDong + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/hop-dong/" + idHopDong + "/nguoi-o-cung/so-luong")
                        .header("Authorization", "Bearer " + token)
                        .queryParam("ngay", "2040-03-15"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/hop-dong/" + idHopDong + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(idNguoiThue, "Bạn", "2040-03-15", null)))
                .andExpect(status().isForbidden());
    }

    private void themNguoiOCung(String token, Long nguoiThueId, String quanHe, String tuNgay, String denNgay) throws Exception {
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nguoiOCungPayload(nguoiThueId, quanHe, tuNgay, denNgay)))
                .andExpect(status().isCreated());
    }

    private String nguoiOCungPayload(Long nguoiThueId, String quanHe, String tuNgay, String denNgay) {
        String ngayKetThuc = denNgay == null ? "null" : "\"" + denNgay + "\"";
        return """
                {
                  "nguoiThueId": %d,
                  "quanHe": "%s",
                  "tuNgay": "%s",
                  "denNgay": %s
                }
                """.formatted(nguoiThueId, quanHe, tuNgay, ngayKetThuc);
    }

    private Long themHopDong(Long idPhong, Long idNguoiThue) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2040-03-01', DATE '2040-12-31', 3500000.00, 3500000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                idPhong,
                idNguoiThue
        );
    }

    private Long themPhong(Long toaNhaId, String soPhong, int sucChua) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 5, 22.50, ?, 3500000.00, 'Studio', 'TRONG')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                sucChua
        );
    }

    private Long themNguoiThue(String hoTen, String soDienThoai, String soGiayTo) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, DATE '2000-01-01', ?, ?, 'Nam Định', NULL)
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                soGiayTo
        );
    }

    private void xoaNeuBangTonTai(String tenBang) {
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                              AND table_name = ?
                        )
                        """,
                Boolean.class,
                tenBang.toLowerCase()
        ))) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
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
