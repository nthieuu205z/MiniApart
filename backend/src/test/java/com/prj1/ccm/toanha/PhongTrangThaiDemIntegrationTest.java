package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.hopdong.HopDong;
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
import java.sql.Date;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(PhongTrangThaiDemIntegrationTest.PhongTrangThaiClockTestConfiguration.class)
class PhongTrangThaiDemIntegrationTest {

    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate HOM_NAY = LocalDate.of(2040, 8, 1);
    private static final Instant TEST_NOW = HOM_NAY.atStartOfDay(TEST_ZONE).toInstant();

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private MutableClock mutableClock;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        mutableClock.dat(TEST_NOW);
        jdbcTemplate.update("DELETE FROM NGUOI_O_CUNG");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1) ON CONFLICT DO NOTHING");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
    }

    @Test
    void FR_BLD_04_CR_012_hanhDongHopDongCapNhatNgayTrangThaiDemChoPhongVaDanhSachPhong() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "701", "TRONG");
        Long nguoiThueId = themNguoiThue("Nguyễn Hồng Mai", "0900003001", "079123456901");
        Long dichVuId = themDichVuCoBangGia(1L, "Internet", "250000.00");

        Long hopDongId = taoHopDong(managerToken, phongId, nguoiThueId, dichVuId, "2040-08-15", "2041-08-14");

        assertTrangThaiPhongTrongDanhSach(managerToken, phongId, "TRONG");

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nhan-coc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        assertTrangThaiPhongTrongCoSoDuLieu(phongId, "DA_COC");
        assertTrangThaiPhongTrongDanhSach(managerToken, phongId, "DA_COC");

        mutableClock.cong(Duration.ofDays(14));
        managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/kich-hoat")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        assertTrangThaiPhongTrongCoSoDuLieu(phongId, "DANG_THUE");
        assertTrangThaiPhongTrongDanhSach(managerToken, phongId, "DANG_THUE");

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/thanh-ly")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        assertTrangThaiPhongTrongCoSoDuLieu(phongId, "TRONG");
        assertTrangThaiPhongTrongDanhSach(managerToken, phongId, "TRONG");
    }

    @Test
    void FR_BLD_04_CR_012_lenhTinhLaiTrangThaiPhongSuaGiaTriDemVaDoiChieuDungVoiHamTinhLai() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongKhongHopDong = themPhong(1L, "711", "NGUNG");
        Long phongChoKy = themPhong(1L, "712", "DANG_THUE");
        Long phongDaCoc = themPhong(1L, "713", "TRONG");
        Long phongDaCocQuaNgayBatDau = themPhong(1L, "714", "DA_COC");
        Long phongDangThue = themPhong(1L, "715", "TRONG");
        Long phongDaThanhLy = themPhong(1L, "716", "DA_COC");
        Long phongDangSuaKhongHopDong = themPhong(1L, "717", "DANG_SUA");

        Long nguoiThueChoKy = themNguoiThue("Người thuê chờ ký", "0900003011", "079123456911");
        Long nguoiThueDaCoc = themNguoiThue("Người thuê đã cọc", "0900003012", "079123456912");
        Long nguoiThueQuaNgayBatDau = themNguoiThue("Người thuê quá ngày", "0900003013", "079123456913");
        Long nguoiThueDangThue = themNguoiThue("Người thuê đang thuê", "0900003014", "079123456914");
        Long nguoiThueDaThanhLy = themNguoiThue("Người thuê đã thanh lý", "0900003015", "079123456915");

        themHopDong(phongChoKy, nguoiThueChoKy, "2040-08-20", "2041-08-19", "CHO_KY");
        themHopDong(phongDaCoc, nguoiThueDaCoc, "2040-08-20", "2041-08-19", "DA_COC");
        themHopDong(phongDaCocQuaNgayBatDau, nguoiThueQuaNgayBatDau, "2040-08-01", "2041-07-31", "DA_COC");
        themHopDong(phongDangThue, nguoiThueDangThue, "2040-07-01", "2041-06-30", "HIEU_LUC");
        themHopDong(phongDaThanhLy, nguoiThueDaThanhLy, "2040-07-01", "2041-06-30", "DA_THANH_LY");

        assertThat(taiPhongTuDuLieuGoc(phongKhongHopDong).tinhLaiTrangThai(HOM_NAY))
                .isEqualTo(TrangThaiPhong.NGUNG);
        assertThat(taiPhongTuDuLieuGoc(phongDangSuaKhongHopDong).tinhLaiTrangThai(HOM_NAY))
                .isEqualTo(TrangThaiPhong.DANG_SUA);

        mockMvc.perform(post("/api/toa-nha/1/phong/tinh-lai-trang-thai")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        assertThat(trangThaiPhong(phongKhongHopDong)).isEqualTo("NGUNG");
        assertThat(trangThaiPhong(phongChoKy)).isEqualTo("TRONG");
        assertThat(trangThaiPhong(phongDaCoc)).isEqualTo("DA_COC");
        assertThat(trangThaiPhong(phongDaCocQuaNgayBatDau)).isEqualTo("TRONG");
        assertThat(trangThaiPhong(phongDangThue)).isEqualTo("DANG_THUE");
        assertThat(trangThaiPhong(phongDaThanhLy)).isEqualTo("TRONG");
        assertThat(trangThaiPhong(phongDangSuaKhongHopDong)).isEqualTo("DANG_SUA");

        for (Long phongId : List.of(
                phongKhongHopDong,
                phongChoKy,
                phongDaCoc,
                phongDaCocQuaNgayBatDau,
                phongDangThue,
                phongDaThanhLy,
                phongDangSuaKhongHopDong
        )) {
            Phong phong = taiPhongTuDuLieuGoc(phongId);
            assertThat(phong.trangThaiDem().name()).isEqualTo(phong.tinhLaiTrangThai(HOM_NAY).name());
        }

        mockMvc.perform(get("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(7)))
                .andExpect(jsonPath("$[0].trangThai").value("NGUNG"))
                .andExpect(jsonPath("$[1].trangThai").value("TRONG"))
                .andExpect(jsonPath("$[2].trangThai").value("DA_COC"))
                .andExpect(jsonPath("$[3].trangThai").value("TRONG"))
                .andExpect(jsonPath("$[4].trangThai").value("DANG_THUE"))
                .andExpect(jsonPath("$[5].trangThai").value("TRONG"))
                .andExpect(jsonPath("$[6].trangThai").value("DANG_SUA"));
    }

    @Test
    void FR_BLD_04_CR_012_lenhTinhLaiTrangThaiPhongDungNgayKinhDoanhDuocYeuCau() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "718", "TRONG");
        Long nguoiThueId = themNguoiThue("Người thuê ngày yêu cầu", "0900003016", "079123456916");
        themHopDong(phongId, nguoiThueId, "2040-08-20", "2041-08-19", "HIEU_LUC");

        mockMvc.perform(post("/api/toa-nha/1/phong/tinh-lai-trang-thai")
                        .param("ngay", "2040-08-20")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        assertThat(trangThaiPhong(phongId)).isEqualTo("DANG_THUE");
        Phong phong = taiPhongTuDuLieuGoc(phongId);
        assertThat(phong.trangThaiDem()).isEqualTo(phong.tinhLaiTrangThai(LocalDate.of(2040, 8, 20)));
    }

    private void assertTrangThaiPhongTrongCoSoDuLieu(Long phongId, String trangThai) {
        assertThat(trangThaiPhong(phongId)).isEqualTo(trangThai);
    }

    private String trangThaiPhong(Long phongId) {
        return jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM PHONG WHERE id = ?",
                String.class,
                phongId
        );
    }

    private void assertTrangThaiPhongTrongDanhSach(String token, Long phongId, String trangThai) throws Exception {
        mockMvc.perform(get("/api/toa-nha/1/phong")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==%d)].trangThai".formatted(phongId)).value(trangThai));
    }

    private Phong taiPhongTuDuLieuGoc(Long phongId) {
        Map<String, Object> dongPhong = jdbcTemplate.queryForMap(
                """
                        SELECT id, toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai
                        FROM PHONG
                        WHERE id = ?
                        """,
                phongId
        );
        List<HopDong> hopDong = jdbcTemplate.query(
                """
                        SELECT id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai
                        FROM HOP_DONG
                        WHERE phong_id = ?
                        ORDER BY id
                        """,
                (resultSet, rowNum) -> new HopDong(
                        resultSet.getLong("id"),
                        resultSet.getLong("phong_id"),
                        resultSet.getLong("nguoi_thue_id"),
                        resultSet.getObject("ngay_bat_dau", LocalDate.class),
                        resultSet.getObject("ngay_ket_thuc", LocalDate.class),
                        resultSet.getBigDecimal("gia_thue"),
                        resultSet.getBigDecimal("tien_coc"),
                        resultSet.getInt("so_ngay_bao_truoc"),
                        com.prj1.ccm.hopdong.TrangThaiHopDong.valueOf(resultSet.getString("trang_thai"))
                ),
                phongId
        );
        return new Phong(
                ((Number) dongPhong.get("id")).longValue(),
                ((Number) dongPhong.get("toa_nha_id")).longValue(),
                String.valueOf(dongPhong.get("so_phong")),
                ((Number) dongPhong.get("tang")).intValue(),
                (BigDecimal) dongPhong.get("dien_tich"),
                ((Number) dongPhong.get("suc_chua")).intValue(),
                (BigDecimal) dongPhong.get("gia_thue_mac_dinh"),
                String.valueOf(dongPhong.get("loai_phong")),
                TrangThaiPhong.valueOf(String.valueOf(dongPhong.get("trang_thai"))),
                hopDong
        );
    }

    private Long taoHopDong(String token, Long phongId, Long nguoiThueId, Long dichVuId, String ngayBatDau, String ngayKetThuc)
            throws Exception {
        String body = mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phongId": %d,
                                  "nguoiThueId": %d,
                                  "ngayBatDau": "%s",
                                  "ngayKetThuc": "%s",
                                  "giaThue": "3500000.00",
                                  "tienCoc": "3500000.00",
                                  "soNgayBaoTruoc": 30,
                                  "dichVuApDung": [
                                    { "dichVuId": %d }
                                  ]
                                }
                                """.formatted(phongId, nguoiThueId, ngayBatDau, ngayKetThuc, dichVuId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        int start = body.indexOf("\"id\":") + 5;
        int end = body.indexOf(',', start);
        return Long.parseLong(body.substring(start, end).trim());
    }

    private Long themPhong(Long toaNhaId, String soPhong, String trangThai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 7, 22.50, 4, 3500000.00, 'Studio', ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                trangThai
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
                """
                        INSERT INTO BANG_GIA(dich_vu_id, don_gia, ngay_hieu_luc)
                        VALUES (?, ?, ?)
                        """,
                dichVuId,
                new BigDecimal(donGia),
                Date.valueOf("2040-01-01")
        );
        return dichVuId;
    }

    private void themHopDong(Long phongId, Long nguoiThueId, String ngayBatDau, String ngayKetThuc, String trangThai) {
        jdbcTemplate.update(
                """
                        INSERT INTO HOP_DONG(
                            phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai
                        )
                        VALUES (?, ?, ?, ?, 3500000.00, 3500000.00, 30, ?)
                        """,
                phongId,
                nguoiThueId,
                Date.valueOf(ngayBatDau),
                Date.valueOf(ngayKetThuc),
                trangThai
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

    @TestConfiguration(proxyBeanMethods = false)
    static class PhongTrangThaiClockTestConfiguration {
        @Bean
        MutableClock mutableClock() {
            return new MutableClock(TEST_NOW, TEST_ZONE);
        }

        @Bean
        @Primary
        Clock phongTrangThaiClock(MutableClock mutableClock) {
            return mutableClock;
        }
    }

    static final class MutableClock extends Clock {
        private Instant instant;
        private final ZoneId zoneId;

        private MutableClock(Instant instant, ZoneId zoneId) {
            this.instant = instant;
            this.zoneId = zoneId;
        }

        void dat(Instant instantMoi) {
            this.instant = instantMoi;
        }

        void cong(Duration khoangThoiGian) {
            this.instant = instant.plus(khoangThoiGian);
        }

        @Override
        public ZoneId getZone() {
            return zoneId;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
