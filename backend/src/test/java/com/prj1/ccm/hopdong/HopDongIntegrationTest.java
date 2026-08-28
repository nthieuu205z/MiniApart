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

import java.sql.Date;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(HopDongIntegrationTest.HopDongClockTestConfiguration.class)
class HopDongIntegrationTest {

    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant TEST_NOW = LocalDate.of(2040, 8, 1).atStartOfDay(TEST_ZONE).toInstant();

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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
    }

    @Test
    void FR_TNT_04_CR_005_taoHopDongLuuGiaTriHopDongVaDichVuApDungKhongNhanTrangThaiTuClient() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "305");
        Long nguoiThueId = themNguoiThue("Nguyễn Văn Mẫu", "0900001001", "079123456789");
        Long internetId = themDichVuCoBangGia(1L, "Internet", "250000.00");
        Long guiXeId = themDichVuCoBangGia(1L, "Giữ xe", "100000.00");

        mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phongId": %d,
                                  "nguoiThueId": %d,
                                  "ngayBatDau": "2040-09-01",
                                  "ngayKetThuc": "2041-08-31",
                                  "giaThue": "3500000.00",
                                  "tienCoc": "3500000.00",
                                  "soNgayBaoTruoc": 30,
                                  "dichVuApDung": [
                                    { "dichVuId": %d },
                                    { "dichVuId": %d, "donGiaApDung": "90000.00" }
                                  ],
                                  "trangThai": "DA_THANH_LY"
                                }
                                """.formatted(phongId, nguoiThueId, internetId, guiXeId)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phongId": %d,
                                  "nguoiThueId": %d,
                                  "ngayBatDau": "2040-09-01",
                                  "ngayKetThuc": "2041-08-31",
                                  "giaThue": "3500000.00",
                                  "tienCoc": "3500000.00",
                                  "soNgayBaoTruoc": 30,
                                  "dichVuApDung": [
                                    { "dichVuId": %d },
                                    { "dichVuId": %d, "donGiaApDung": "90000.00" }
                                  ]
                                }
                                """.formatted(phongId, nguoiThueId, internetId, guiXeId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phongId").value(phongId))
                .andExpect(jsonPath("$.soPhong").value("305"))
                .andExpect(jsonPath("$.nguoiThueId").value(nguoiThueId))
                .andExpect(jsonPath("$.hoTenNguoiThue").value("Nguyễn Văn Mẫu"))
                .andExpect(jsonPath("$.giaThue").value("3500000.00"))
                .andExpect(jsonPath("$.tienCoc").value("3500000.00"))
                .andExpect(jsonPath("$.soNgayBaoTruoc").value(30))
                .andExpect(jsonPath("$.trangThai").value("CHO_KY"))
                .andExpect(jsonPath("$.tenTrangThai").value("Chờ ký"))
                .andExpect(jsonPath("$.sapHetHan").value(false))
                .andExpect(jsonPath("$.soNgayConLai").value(395))
                .andExpect(jsonPath("$.dichVuApDung", hasSize(2)))
                .andExpect(jsonPath("$.dichVuApDung[0].dichVuId").value(internetId))
                .andExpect(jsonPath("$.dichVuApDung[0].tenDichVu").value("Internet"))
                .andExpect(jsonPath("$.dichVuApDung[0].donGiaApDung").value("250000.00"))
                .andExpect(jsonPath("$.dichVuApDung[1].dichVuId").value(guiXeId))
                .andExpect(jsonPath("$.dichVuApDung[1].donGiaApDung").value("90000.00"));

        Map<String, Object> hopDong = jdbcTemplate.queryForMap(
                """
                        SELECT phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai
                        FROM HOP_DONG
                        """);
        assertThat(hopDong.get("phong_id")).isEqualTo(phongId);
        assertThat(hopDong.get("nguoi_thue_id")).isEqualTo(nguoiThueId);
        assertThat(String.valueOf(hopDong.get("ngay_bat_dau"))).isEqualTo("2040-09-01");
        assertThat(String.valueOf(hopDong.get("ngay_ket_thuc"))).isEqualTo("2041-08-31");
        assertThat(String.valueOf(hopDong.get("gia_thue"))).isEqualTo("3500000.00");
        assertThat(String.valueOf(hopDong.get("tien_coc"))).isEqualTo("3500000.00");
        assertThat(hopDong.get("so_ngay_bao_truoc")).isEqualTo(30);
        assertThat(hopDong.get("trang_thai")).isEqualTo("CHO_KY");

        List<Map<String, Object>> dichVuApDung = jdbcTemplate.queryForList(
                """
                        SELECT dich_vu_id, don_gia_ap_dung
                        FROM HOP_DONG_DICH_VU
                        ORDER BY dich_vu_id
                        """
        );
        assertThat(dichVuApDung).hasSize(2);
        assertThat(dichVuApDung.get(0).get("dich_vu_id")).isEqualTo(internetId);
        assertThat(String.valueOf(dichVuApDung.get(0).get("don_gia_ap_dung"))).isEqualTo("250000.00");
        assertThat(dichVuApDung.get(1).get("dich_vu_id")).isEqualTo(guiXeId);
        assertThat(String.valueOf(dichVuApDung.get(1).get("don_gia_ap_dung"))).isEqualTo("90000.00");
    }

    @Test
    void FR_TNT_04_CR_005_tuChoiHopDongCoNgayKetThucKhongSauNgayBatDau() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "306");
        Long nguoiThueId = themNguoiThue("Trần Thu Hà", "0900001002", "079123456780");

        mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phongId": %d,
                                  "nguoiThueId": %d,
                                  "ngayBatDau": "2040-09-01",
                                  "ngayKetThuc": "2040-09-01",
                                  "giaThue": "3500000.00",
                                  "tienCoc": "3500000.00",
                                  "soNgayBaoTruoc": 30,
                                  "dichVuApDung": [
                                    { "dichVuId": 1 }
                                  ]
                                }
                                """.formatted(phongId, nguoiThueId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao", containsString("Ngày kết thúc")));
    }

    @Test
    void FR_TNT_04_CR_005_taoHopDongHopLeVoiDanhSachDichVuApDungRong() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "306A");
        Long nguoiThueId = themNguoiThue("Phạm Thu Trang", "0900001006", "079123456784");

        mockMvc.perform(post("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "phongId": %d,
                                  "nguoiThueId": %d,
                                  "ngayBatDau": "2040-09-15",
                                  "ngayKetThuc": "2041-09-14",
                                  "giaThue": "3200000.00",
                                  "tienCoc": "3200000.00",
                                  "soNgayBaoTruoc": 15,
                                  "dichVuApDung": []
                                }
                                """.formatted(phongId, nguoiThueId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phongId").value(phongId))
                .andExpect(jsonPath("$.nguoiThueId").value(nguoiThueId))
                .andExpect(jsonPath("$.trangThai").value("CHO_KY"))
                .andExpect(jsonPath("$.dichVuApDung", hasSize(0)));

        Long hopDongId = jdbcTemplate.queryForObject(
                "SELECT id FROM HOP_DONG WHERE phong_id = ?",
                Long.class,
                phongId
        );
        assertThat(hopDongId).isNotNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HOP_DONG_DICH_VU WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(0);
    }

    @Test
    void FR_TNT_04_CR_005_chuyenTrangThaiHopDongBangHanhDongThayViChoSuaTay() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "307");
        Long nguoiThueId = themNguoiThue("Lê Quang Minh", "0900001003", "079123456781");
        Long internetId = themDichVuCoBangGia(1L, "Internet", "250000.00");

        Long hopDongId = taoHopDong(managerToken, phongId, nguoiThueId, internetId, "2040-07-10", "2041-08-09");

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nhan-coc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_COC"))
                .andExpect(jsonPath("$.tenTrangThai").value("Đã cọc"));

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/kich-hoat")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("HIEU_LUC"))
                .andExpect(jsonPath("$.tenTrangThai").value("Hiệu lực"));

        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/thanh-ly")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_THANH_LY"))
                .andExpect(jsonPath("$.tenTrangThai").value("Đã thanh lý"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM HOP_DONG WHERE id = ?",
                String.class,
                hopDongId
        )).isEqualTo("DA_THANH_LY");
    }

    @Test
    void FR_TNT_04_CR_005_danhSachSapHetHanTuDoiTheoClockKhongCanTacVuNen() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongA = themPhong(1L, "401");
        Long phongB = themPhong(1L, "402");
        Long nguoiThueA = themNguoiThue("Nguyễn Minh A", "0900001004", "079123456782");
        Long nguoiThueB = themNguoiThue("Nguyễn Minh B", "0900001005", "079123456783");
        Long internetId = themDichVuCoBangGia(1L, "Internet", "250000.00");

        Long hopDongSapHet = taoHopDong(managerToken, phongA, nguoiThueA, internetId, "2040-08-01", "2040-09-01");
        Long hopDongConXa = taoHopDong(managerToken, phongB, nguoiThueB, internetId, "2040-08-01", "2040-12-31");

        mockMvc.perform(post("/api/hop-dong/" + hopDongSapHet + "/nhan-coc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/hop-dong/" + hopDongSapHet + "/kich-hoat")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/hop-dong/" + hopDongConXa + "/nhan-coc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/hop-dong/" + hopDongConXa + "/kich-hoat")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("toaNhaId", "1")
                        .queryParam("trangThai", "HIEU_LUC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(hopDongConXa))
                .andExpect(jsonPath("$[0].sapHetHan").value(false))
                .andExpect(jsonPath("$[1].id").value(hopDongSapHet))
                .andExpect(jsonPath("$[1].sapHetHan").value(false));

        mutableClock.cong(Duration.ofDays(3));
        managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/hop-dong")
                        .header("Authorization", "Bearer " + managerToken)
                        .queryParam("toaNhaId", "1")
                        .queryParam("trangThai", "HIEU_LUC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(hopDongConXa))
                .andExpect(jsonPath("$[0].sapHetHan").value(false))
                .andExpect(jsonPath("$[1].id").value(hopDongSapHet))
                .andExpect(jsonPath("$[1].sapHetHan").value(true))
                .andExpect(jsonPath("$[1].soNgayConLai").value(28));
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

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 3, 22.50, 4, 3500000.00, 'Studio', 'TRONG')
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
    static class HopDongClockTestConfiguration {
        @Bean
        MutableClock mutableClock() {
            return new MutableClock(TEST_NOW, TEST_ZONE);
        }

        @Bean
        @Primary
        Clock hopDongTestClock(MutableClock mutableClock) {
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
