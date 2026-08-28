package com.prj1.ccm.hopdong;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(GiaHanHopDongIntegrationTest.GiaHanHopDongClockTestConfiguration.class)
class GiaHanHopDongIntegrationTest {

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
        xoaNeuBangTonTai("NGUOI_O_CUNG");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("HOP_DONG");
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
                            trang_thai = 'HOAT_DONG',
                            nguoi_thue_id = NULL
                        WHERE id IN (1, 2, 3, 4, 5)
                        """
        );
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
    }

    @Test
    void FR_TNT_07_giaHanTaoHopDongKeTiepGiuLichSuVaKeThuaDieuKhoanDichVuNguoiOCung() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "801");
        Long nguoiThueId = themNguoiThue("Người thuê gia hạn", "0900008101", "079123456801");
        Long nguoiOCungConOId = themNguoiThue("Người ở cùng còn ở", "0900008102", "079123456802");
        Long nguoiOCungDaRoiId = themNguoiThue("Người ở cùng đã rời", "0900008103", "079123456803");
        Long internetId = themDichVuCoBangGia(1L, "Internet", "250000.00");
        Long guiXeId = themDichVuCoBangGia(1L, "Giữ xe", "100000.00");
        Long hopDongCuId = themHopDong(phongId, nguoiThueId, "2040-01-01", "2040-09-01", "3500000.00", "3500000.00", "HIEU_LUC");
        themDichVuApDung(hopDongCuId, internetId, "250000.00");
        themDichVuApDung(hopDongCuId, guiXeId, "90000.00");
        themNguoiOCung(hopDongCuId, nguoiOCungConOId, "Bạn", "2040-03-01", null);
        themNguoiOCung(hopDongCuId, nguoiOCungDaRoiId, "Anh chị em", "2040-03-01", "2040-08-20");

        String body = mockMvc.perform(post("/api/hop-dong/" + hopDongCuId + "/gia-han")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ngayKetThuc\":\"2041-09-01\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hopDong.phongId").value(phongId))
                .andExpect(jsonPath("$.hopDong.nguoiThueId").value(nguoiThueId))
                .andExpect(jsonPath("$.hopDong.ngayBatDau").value("2040-09-02"))
                .andExpect(jsonPath("$.hopDong.ngayKetThuc").value("2041-09-01"))
                .andExpect(jsonPath("$.hopDong.giaThue").value("3500000.00"))
                .andExpect(jsonPath("$.hopDong.tienCoc").value("3500000.00"))
                .andExpect(jsonPath("$.hopDong.soNgayBaoTruoc").value(30))
                .andExpect(jsonPath("$.hopDong.trangThai").value("DA_COC"))
                .andExpect(jsonPath("$.hopDong.dichVuApDung.length()").value(2))
                .andExpect(jsonPath("$.hopDong.dichVuApDung[0].dichVuId").value(internetId))
                .andExpect(jsonPath("$.hopDong.dichVuApDung[0].donGiaApDung").value("250000.00"))
                .andExpect(jsonPath("$.hopDong.dichVuApDung[1].dichVuId").value(guiXeId))
                .andExpect(jsonPath("$.hopDong.dichVuApDung[1].donGiaApDung").value("90000.00"))
                .andExpect(jsonPath("$.tienCocCanThu").value("0.00"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Long hopDongMoiId = layIdHopDongMoi(body);

        Map<String, Object> hopDongCu = jdbcTemplate.queryForMap(
                "SELECT ngay_ket_thuc, gia_thue, tien_coc, trang_thai FROM HOP_DONG WHERE id = ?", hopDongCuId);
        assertThat(hopDongCu).containsEntry("ngay_ket_thuc", java.sql.Date.valueOf("2040-09-01"));
        assertThat(hopDongCu).containsEntry("gia_thue", new BigDecimal("3500000.00"));
        assertThat(hopDongCu).containsEntry("tien_coc", new BigDecimal("3500000.00"));
        assertThat(hopDongCu).containsEntry("trang_thai", "HIEU_LUC");

        List<Map<String, Object>> nguoiOCungMoi = jdbcTemplate.queryForList(
                "SELECT nguoi_thue_id, quan_he, tu_ngay, den_ngay FROM NGUOI_O_CUNG WHERE hop_dong_id = ? ORDER BY id", hopDongMoiId);
        assertThat(nguoiOCungMoi).hasSize(1);
        assertThat(nguoiOCungMoi.getFirst())
                .containsEntry("nguoi_thue_id", nguoiOCungConOId)
                .containsEntry("quan_he", "Bạn")
                .containsEntry("tu_ngay", java.sql.Date.valueOf("2040-09-02"))
                .containsEntry("den_ngay", null);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NGUOI_O_CUNG WHERE hop_dong_id = ?", Integer.class, hopDongCuId))
                .isEqualTo(2);
    }

    @Test
    void FR_TNT_07_giaHanGiaThueTangChiYeuCauThuThemPhanChenhTienCoc() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "802");
        Long nguoiThueId = themNguoiThue("Người thuê tăng giá", "0900008201", "079123456821");
        Long hopDongCuId = themHopDong(phongId, nguoiThueId, "2040-01-01", "2040-09-01", "3500000.00", "3500000.00", "HIEU_LUC");

        mockMvc.perform(post("/api/hop-dong/" + hopDongCuId + "/gia-han")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ngayKetThuc\":\"2041-09-01\",\"giaThue\":\"4000000.00\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.hopDong.giaThue").value("4000000.00"))
                .andExpect(jsonPath("$.hopDong.tienCoc").value("3500000.00"))
                .andExpect(jsonPath("$.hopDong.trangThai").value("CHO_KY"))
                .andExpect(jsonPath("$.tienCocCanThu").value("500000.00"))
                .andExpect(jsonPath("$.canhBaoThongBaoGiaThue").value(true));
    }

    @Test
    void FR_TNT_07_giaHanLanHaiTraVe409VaChiTaoMotHopDongKeTiep() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "804");
        Long nguoiThueId = themNguoiThue("Người thuê gửi lại", "0900008401", "079123456841");
        Long hopDongCuId = themHopDong(phongId, nguoiThueId, "2040-01-01", "2040-09-01", "3500000.00", "3500000.00", "HIEU_LUC");
        String yeuCauGiaHan = "{\"ngayKetThuc\":\"2041-09-01\"}";

        mockMvc.perform(post("/api/hop-dong/" + hopDongCuId + "/gia-han")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(yeuCauGiaHan))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/hop-dong/" + hopDongCuId + "/gia-han")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(yeuCauGiaHan))
                .andExpect(status().isConflict());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HOP_DONG WHERE phong_id = ?", Integer.class, phongId))
                .isEqualTo(2);
    }

    @Test
    void FR_TNT_07_thoNhan403KhiGiaHanHopDong() throws Exception {
        Long phongId = themPhong(1L, "803");
        Long nguoiThueId = themNguoiThue("Người thuê cấm quyền", "0900008301", "079123456831");
        Long hopDongCuId = themHopDong(phongId, nguoiThueId, "2040-01-01", "2040-09-01", "3500000.00", "3500000.00", "HIEU_LUC");
        String workerToken = login(4L, "0900000004");

        mockMvc.perform(post("/api/hop-dong/" + hopDongCuId + "/gia-han")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ngayKetThuc\":\"2041-09-01\"}"))
                .andExpect(status().isForbidden());
    }

    private Long layIdHopDongMoi(String body) {
        int start = body.indexOf("\"id\":") + 5;
        int end = body.indexOf(',', start);
        return Long.valueOf(body.substring(start, end));
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 8, 22.50, 4, 3500000.00, 'Studio', 'TRONG')
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

    private Long themDichVuCoBangGia(Long toaNhaId, String ten, String donGia) {
        Long dichVuId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'CO_DINH', 'CO_DINH', 'tháng', FALSE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten
        );
        jdbcTemplate.update(
                "INSERT INTO BANG_GIA(dich_vu_id, don_gia, ngay_hieu_luc) VALUES (?, ?, DATE '2040-01-01')",
                dichVuId,
                new BigDecimal(donGia)
        );
        return dichVuId;
    }

    private Long themHopDong(
            Long phongId,
            Long nguoiThueId,
            String ngayBatDau,
            String ngayKetThuc,
            String giaThue,
            String tienCoc,
            String trangThai
    ) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?, 30, ?)
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc),
                new BigDecimal(giaThue),
                new BigDecimal(tienCoc),
                trangThai
        );
    }

    private void themDichVuApDung(Long hopDongId, Long dichVuId, String donGiaApDung) {
        jdbcTemplate.update(
                "INSERT INTO HOP_DONG_DICH_VU(hop_dong_id, dich_vu_id, don_gia_ap_dung) VALUES (?, ?, ?)",
                hopDongId,
                dichVuId,
                new BigDecimal(donGiaApDung)
        );
    }

    private void themNguoiOCung(Long hopDongId, Long nguoiThueId, String quanHe, String tuNgay, String denNgay) {
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                hopDongId,
                nguoiThueId,
                quanHe,
                java.sql.Date.valueOf(tuNgay),
                denNgay == null ? null : java.sql.Date.valueOf(denNgay)
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

    @TestConfiguration(proxyBeanMethods = false)
    static class GiaHanHopDongClockTestConfiguration {
        @Bean
        @Primary
        Clock giaHanHopDongTestClock() {
            return Clock.fixed(Instant.parse("2040-08-20T00:00:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
        }
    }
}
