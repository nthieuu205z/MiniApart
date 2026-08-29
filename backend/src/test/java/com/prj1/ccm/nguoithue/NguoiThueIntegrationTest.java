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

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class NguoiThueIntegrationTest {

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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
    }

    @Test
    void FR_TNT_01_taoNguoiThueVaTimTheoTenHoacSoDienThoaiChiTraVeSoGiayToDaChe() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Phan Minh Khoa",
                                  "ngaySinh": "1998-05-20",
                                  "soDienThoai": "090 123 4567",
                                  "soGiayTo": "079123456789",
                                  "queQuan": "Nam Định"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.hoTen").value("Phan Minh Khoa"))
                .andExpect(jsonPath("$.ngaySinh").value("1998-05-20"))
                .andExpect(jsonPath("$.soDienThoai").value("0901234567"))
                .andExpect(jsonPath("$.soGiayToChe").value("********6789"))
                .andExpect(jsonPath("$.soGiayTo").doesNotExist())
                .andExpect(jsonPath("$.queQuan").value("Nam Định"))
                .andExpect(jsonPath("$.canhBao", hasSize(0)));

        Long nguoiThueId = jdbcTemplate.queryForObject(
                "SELECT id FROM NGUOI_THUE WHERE so_dien_thoai = ?",
                Long.class,
                "0901234567"
        );

        assertThat(nguoiThueId).isNotNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT so_giay_to FROM NGUOI_THUE WHERE id = ?",
                String.class,
                nguoiThueId
        )).isEqualTo("079123456789");

        mockMvc.perform(get("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("q", "Minh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(nguoiThueId))
                .andExpect(jsonPath("$[0].soGiayToChe").value("********6789"))
                .andExpect(jsonPath("$[0].soGiayTo").doesNotExist());

        mockMvc.perform(get("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("q", "090 123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(nguoiThueId));
    }

    @Test
    void FR_TNT_01_xemChiTietNguoiThueTraVeSoGiayToDayDuVaGhiNhatKyKhongLamLoSoGiayToTrongAudit() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Lê Thu Hà", "1995-02-11", "0912345678", "001234567890", "Hải Dương");

        mockMvc.perform(get("/api/nguoi-thue/" + nguoiThueId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(nguoiThueId))
                .andExpect(jsonPath("$.hoTen").value("Lê Thu Hà"))
                .andExpect(jsonPath("$.soGiayTo").value("001234567890"))
                .andExpect(jsonPath("$.soGiayToChe").value("********7890"));

        List<Map<String, Object>> nhatKy = jdbcTemplate.queryForList(
                """
                        SELECT nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau
                        FROM NHAT_KY_THAO_TAC
                        WHERE doi_tuong = ?
                        """,
                "NGUOI_THUE:" + nguoiThueId
        );

        assertThat(nhatKy).hasSize(1);
        Map<String, Object> banGhi = nhatKy.getFirst();
        assertThat(banGhi.get("nguoi_dung_id")).isEqualTo(3L);
        assertThat(banGhi.get("hanh_dong")).isEqualTo("XEM_SO_GIAY_TO_NGUOI_THUE");
        assertThat(banGhi.get("gia_tri_truoc")).isNull();
        assertThat(String.valueOf(banGhi.get("gia_tri_sau"))).contains("********7890");
        assertThat(String.valueOf(banGhi.get("gia_tri_sau"))).doesNotContain("001234567890");
    }

    @Test
    void FR_TNT_01_trungSoGiayToChiCanhBaoKhongChanTaoVaCapNhatHoSo() throws Exception {
        String managerToken = login(3L, "0900000003");
        themNguoiThue("Ngô Mai Anh", "1997-09-09", "0907777001", "012345678901", "Bắc Ninh");
        Long nguoiThueCanCapNhat = themNguoiThue("Tạ Quốc Vinh", "1996-01-01", "0907777002", "099988887777", "Huế");

        mockMvc.perform(post("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Người thuê trùng giấy tờ",
                                  "ngaySinh": "1999-03-21",
                                  "soDienThoai": "0907777003",
                                  "soGiayTo": "012345678901",
                                  "queQuan": "Nghệ An"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.canhBao", hasSize(1)))
                .andExpect(jsonPath("$.canhBao[0]").value("Số giấy tờ đang trùng với hồ sơ khác."))
                .andExpect(jsonPath("$.soGiayTo").doesNotExist());

        mockMvc.perform(put("/api/nguoi-thue/" + nguoiThueCanCapNhat)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Tạ Quốc Vinh đã sửa",
                                  "ngaySinh": "1996-01-01",
                                  "soDienThoai": "0907777002",
                                  "soGiayTo": "012345678901",
                                  "queQuan": "Huế"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoTen").value("Tạ Quốc Vinh đã sửa"))
                .andExpect(jsonPath("$.canhBao", hasSize(1)))
                .andExpect(jsonPath("$.canhBao[0]").value("Số giấy tờ đang trùng với hồ sơ khác."));
    }

    @Test
    void FR_TNT_01_thongBaoLoiKhongLamLoSoGiayToTuThanTrongPhanHoi() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/nguoi-thue")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Người thuê lỗi ngày sinh",
                                  "ngaySinh": "20-05-1998",
                                  "soDienThoai": "0901239999",
                                  "soGiayTo": "123456789999",
                                  "queQuan": "Đà Nẵng"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Yêu cầu không hợp lệ"))
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("123456789999"))));
    }

    private Long themNguoiThue(String hoTen, String ngaySinh, String soDienThoai, String soGiayTo, String queQuan) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, ?, ?, ?, ?, NULL)
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                java.sql.Date.valueOf(ngaySinh),
                soDienThoai,
                soGiayTo,
                queQuan
        );
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
