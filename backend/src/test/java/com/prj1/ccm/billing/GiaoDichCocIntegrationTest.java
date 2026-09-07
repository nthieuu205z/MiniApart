package com.prj1.ccm.billing;

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

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class GiaoDichCocIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    private Long hopDongId;
    private Long hopDongNgoaiPhamViId;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("GIAO_DICH_COC");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");

        Long phongTrongPhamViId = themPhong(1L, "501");
        Long nguoiThueTrongPhamViId = themNguoiThue("Người thuê trong phạm vi", "0900001111", "079123456701");
        hopDongId = themHopDong(phongTrongPhamViId, nguoiThueTrongPhamViId, "6000000.00");

        Long phongNgoaiPhamViId = themPhong(2L, "601");
        Long nguoiThueNgoaiPhamViId = themNguoiThue("Người thuê ngoài phạm vi", "0900002222", "079123456702");
        hopDongNgoaiPhamViId = themHopDong(phongNgoaiPhamViId, nguoiThueNgoaiPhamViId, "6000000.00");
    }

    @Test
    void CR_009_BR_07_thuCocNhieuLanXemDuocTongVaKhongTaoDongHoaDon() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("2000000.00", "2040-01-10", "Đợt cọc thứ nhất")))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.hopDongId").value(hopDongId))
                .andExpect(jsonPath("$.loai").value("THU_COC"))
                .andExpect(jsonPath("$.soTien").value("2000000.00"))
                .andExpect(jsonPath("$.nguoiThuId").value(3))
                .andExpect(jsonPath("$.maBienLai").isNotEmpty());

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("4000000.00", "2040-01-11", "Đợt cọc thứ hai")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.loai").value("THU_COC"))
                .andExpect(jsonPath("$.soTien").value("4000000.00"));

        mockMvc.perform(get(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hopDongId").value(hopDongId))
                .andExpect(jsonPath("$.tienCocThoaThuan").value("6000000.00"))
                .andExpect(jsonPath("$.tongDaThu").value("6000000.00"))
                .andExpect(jsonPath("$.conLaiChuaThu").value("0.00"))
                .andExpect(jsonPath("$.giaoDich.length()").value(2));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id = ? AND loai = 'THU_COC'",
                Integer.class,
                hopDongId
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT ma_bien_lai) FROM GIAO_DICH_COC WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'THU_COC' AND nguoi_dung_id = ?",
                Integer.class,
                3L
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM CHI_TIET_HOA_DON ct
                        JOIN HOA_DON hd ON hd.id = ct.hoa_don_id
                        WHERE hd.hop_dong_id = ?
                        """,
                Integer.class,
                hopDongId
        )).isZero();
    }

    @Test
    void CR_009_BR_07_chanTongThuCocVuotMucThoaThuanVaNoiRoHaiSoTien() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("4000000.00", "2040-01-10", "Đợt đầu")))
                .andExpect(status().isCreated());

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("3000000.00", "2040-01-11", "Đợt vượt mức")))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("4000000.00")))
                .andExpect(content().string(containsString("6000000.00")));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(1);
    }

    @Test
    void CR_009_BR_07_QTHTVaQuanLySaiToaNhan403ChoCaGhiVaXem() throws Exception {
        String systemAdminToken = login(1L, "0900000001");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + systemAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("1000000.00", "2040-01-10", "Không được phép")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post(giaoDichCocUrl(hopDongNgoaiPhamViId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("1000000.00", "2040-01-10", "Sai toà")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(giaoDichCocUrl(hopDongNgoaiPhamViId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void CR_009_BR_07_migrationTaoDungBangVaRangBuocSoTien() {
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_name = 'giao_dich_coc'
                        )
                        """,
                Boolean.class
        )).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT data_type
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'giao_dich_coc'
                          AND column_name = 'so_tien'
                        """,
                String.class
        )).isEqualTo("numeric");

        String checkDefinition = jdbcTemplate.queryForObject(
                """
                        SELECT pg_get_constraintdef(oid)
                        FROM pg_constraint
                        WHERE conrelid = 'giao_dich_coc'::regclass
                          AND contype = 'c'
                          AND pg_get_constraintdef(oid) LIKE '%loai%'
                        """,
                String.class
        );
        assertThat(checkDefinition).contains("THU_COC", "HOAN_COC", "KHAU_TRU_COC");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM pg_constraint
                        WHERE conrelid = 'giao_dich_coc'::regclass
                          AND contype = 'u'
                          AND pg_get_constraintdef(oid) LIKE '%ma_bien_lai%'
                        """,
                Integer.class
        )).isEqualTo(1);
    }

    private String giaoDichCocUrl() {
        return giaoDichCocUrl(hopDongId);
    }

    private String giaoDichCocUrl(Long id) {
        return "/api/hop-dong/%s/giao-dich-coc".formatted(id);
    }

    private String thuCocPayload(String soTien, String ngay, String lyDo) {
        return """
                {
                  "soTien": "%s",
                  "ngay": "%s",
                  "lyDo": "%s"
                }
                """.formatted(soTien, ngay, lyDo);
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 5, 22.50, 4, 3500000.00, 'Studio', 'TRONG')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong
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

    private Long themHopDong(Long phongId, Long nguoiThueId, String tienCoc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2040-01-01', DATE '2040-12-31', 3500000.00, ?, 30, 'CHO_KY')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                new BigDecimal(tienCoc)
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

    private void xoaNeuBangTonTai(String tenBang) {
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_name = ?
                        )
                        """,
                Boolean.class,
                tenBang.toLowerCase()
        ))) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }
}
