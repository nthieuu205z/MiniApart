package com.prj1.ccm.nguoidung;

import com.prj1.ccm.auth.KichHoatTaiKhoanEvent;
import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(NguoiDungQuanLyIntegrationTest.KichHoatTaiKhoanTestConfiguration.class)
class NguoiDungQuanLyIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private CapturingKichHoatTaiKhoanListener kichHoatTaiKhoanListener;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabaseState() {
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
        jdbcTemplate.update("DELETE FROM KICH_HOAT_TAI_KHOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA");
        jdbcTemplate.update("DELETE FROM NGUOI_DUNG");
        kichHoatTaiKhoanListener.xoaTatCa();
        seedNguoiDung();
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1)");
    }

    @Test
    void FR_AUT_06_taoTaiKhoanGanVaiTroVaToaNhaVaKhongTraVeMatKhau() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");
        String soDienThoai = uniquePhone();

        mockMvc.perform(post("/api/nguoi-dung")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Thợ sửa chữa mới",
                                  "soDienThoai": "%s",
                                  "vaiTro": "THO",
                                  "toaNhaIds": [1, 2]
                                }
                                """.formatted(soDienThoai)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.hoTen").value("Thợ sửa chữa mới"))
                .andExpect(jsonPath("$.soDienThoai").value(soDienThoai))
                .andExpect(jsonPath("$.vaiTro").value("THO"))
                .andExpect(jsonPath("$.trangThai").value("HOAT_DONG"))
                .andExpect(jsonPath("$.toaNhaIds[0]").value(1))
                .andExpect(jsonPath("$.toaNhaIds[1]").value(2))
                .andExpect(jsonPath("$.matKhau").doesNotExist())
                .andExpect(jsonPath("$.matKhauHash").doesNotExist())
                .andExpect(jsonPath("$.maKichHoat").doesNotExist());

        Long nguoiDungId = jdbcTemplate.queryForObject(
                "SELECT id FROM NGUOI_DUNG WHERE so_dien_thoai = ?",
                Long.class,
                soDienThoai
        );

        assertThat(nguoiDungId).isNotNull();
        assertThat(jdbcTemplate.queryForList(
                "SELECT toa_nha_id FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = ? ORDER BY toa_nha_id",
                Long.class,
                nguoiDungId
        )).containsExactly(1L, 2L);
    }

    @Test
    void FR_AUT_06_taoTaiKhoanKhongNhanMatKhauCuaNguoiTao() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");

        mockMvc.perform(post("/api/nguoi-dung")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Kế toán mẫu",
                                  "soDienThoai": "%s",
                                  "vaiTro": "CHU",
                                  "toaNhaIds": [1],
                                  "matKhau": "MatKhauBanRoKhongDuocChapNhan"
                                }
                                """.formatted(uniquePhone())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void FR_AUT_06_taoTaiKhoanTrungSoDienThoaiBiTuChoi() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");

        mockMvc.perform(post("/api/nguoi-dung")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Tài khoản trùng",
                                  "soDienThoai": "0900000003",
                                  "vaiTro": "THO",
                                  "toaNhaIds": [1]
                                }
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void FR_AUT_06_capNhatTaiKhoanCapNhatThongTinVaQuyenToaNha() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");
        String matKhauChoCapNhat = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(matKhauChoCapNhat),
                3L
        );

        String soDienThoaiMoi = uniquePhone();

        mockMvc.perform(put("/api/nguoi-dung/3")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Quản lý Toà A đã sửa",
                                  "soDienThoai": "%s",
                                  "vaiTro": "CHU",
                                  "toaNhaIds": [1, 2]
                                }
                                """.formatted(soDienThoaiMoi)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hoTen").value("Quản lý Toà A đã sửa"))
                .andExpect(jsonPath("$.soDienThoai").value(soDienThoaiMoi))
                .andExpect(jsonPath("$.vaiTro").value("CHU"))
                .andExpect(jsonPath("$.trangThai").value("HOAT_DONG"))
                .andExpect(jsonPath("$.toaNhaIds[0]").value(1))
                .andExpect(jsonPath("$.toaNhaIds[1]").value(2))
                .andExpect(jsonPath("$.matKhau").doesNotExist());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT ho_ten FROM NGUOI_DUNG WHERE id = ?",
                String.class,
                3L
        )).isEqualTo("Quản lý Toà A đã sửa");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT so_dien_thoai FROM NGUOI_DUNG WHERE id = ?",
                String.class,
                3L
        )).isEqualTo(soDienThoaiMoi);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT vai_tro FROM NGUOI_DUNG WHERE id = ?",
                String.class,
                3L
        )).isEqualTo("CHU");
        assertThat(jdbcTemplate.queryForList(
                "SELECT toa_nha_id FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = ? ORDER BY toa_nha_id",
                Long.class,
                3L
        )).containsExactly(1L, 2L);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(soDienThoaiMoi, matKhauChoCapNhat)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nguoiDung.soDienThoai").value(soDienThoaiMoi))
                .andExpect(jsonPath("$.nguoiDung.vaiTro").value("CHU"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload("0900000003", matKhauChoCapNhat)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_AUT_06_capNhatTaiKhoanTrungSoDienThoaiBiTuChoi() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");

        mockMvc.perform(put("/api/nguoi-dung/3")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Quản lý Toà A",
                                  "soDienThoai": "0900000002",
                                  "vaiTro": "QUAN_LY",
                                  "toaNhaIds": [1]
                                }
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void FR_AUT_06_capNhatSoDienThoaiGopTheoDoiDangNhapDichMaKhongXungDot() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");
        String soDienThoaiMoi = uniquePhone();
        jdbcTemplate.update(
                "INSERT INTO THEO_DOI_DANG_NHAP(so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den) VALUES (?, ?, CURRENT_TIMESTAMP - INTERVAL '2 minutes', NULL)",
                "0900000003", 2
        );
        jdbcTemplate.update(
                "INSERT INTO THEO_DOI_DANG_NHAP(so_dien_thoai_key, so_lan_sai, lan_sai_dau_tien, khoa_den) VALUES (?, ?, CURRENT_TIMESTAMP - INTERVAL '1 minute', CURRENT_TIMESTAMP + INTERVAL '5 minutes')",
                soDienThoaiMoi, 3
        );
        jdbcTemplate.update(
                "INSERT INTO LAN_DANG_NHAP_SAI(so_dien_thoai_key, nguoi_dung_id, thoi_diem) VALUES (?, ?, CURRENT_TIMESTAMP - INTERVAL '2 minutes')",
                "0900000003", 3L
        );
        jdbcTemplate.update(
                "INSERT INTO LAN_DANG_NHAP_SAI(so_dien_thoai_key, nguoi_dung_id, thoi_diem) VALUES (?, NULL, CURRENT_TIMESTAMP - INTERVAL '1 minute')",
                soDienThoaiMoi
        );

        mockMvc.perform(put("/api/nguoi-dung/3")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Quản lý Toà A",
                                  "soDienThoai": "%s",
                                  "vaiTro": "QUAN_LY",
                                  "toaNhaIds": [1]
                                }
                                """.formatted(soDienThoaiMoi)))
                .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT so_lan_sai FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?",
                Integer.class,
                soDienThoaiMoi
        )).isEqualTo(5);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?",
                Integer.class,
                "0900000003"
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LAN_DANG_NHAP_SAI WHERE so_dien_thoai_key = ?",
                Integer.class,
                soDienThoaiMoi
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT khoa_den IS NOT NULL FROM THEO_DOI_DANG_NHAP WHERE so_dien_thoai_key = ?",
                Boolean.class,
                soDienThoaiMoi
        )).isTrue();
    }

    @Test
    void FR_AUT_06_khoaTaiKhoanLamMatHieuLucTokenHienTaiNgayLapTuc() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");
        String matKhau = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(matKhau),
                3L
        );
        String tokenNguoiDung = tokenCuaNguoiDung(3L, "0900000003", matKhau);

        mockMvc.perform(post("/api/nguoi-dung/3/khoa")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("BI_KHOA"))
                .andExpect(jsonPath("$.matKhau").doesNotExist());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM NGUOI_DUNG WHERE id = ?",
                String.class,
                3L
        )).isEqualTo("BI_KHOA");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT phien_ban_token FROM NGUOI_DUNG WHERE id = ?",
                Integer.class,
                3L
        )).isEqualTo(1);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + tokenNguoiDung))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload("0900000003", matKhau)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_AUT_06_kichHoatTaiKhoanChoNguoiDungTuChonMatKhau() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");
        String soDienThoai = uniquePhone();
        String matKhauNguoiDungTuChon = "MatKhauDoNguoiDungTuChon-" + UUID.randomUUID();

        mockMvc.perform(post("/api/nguoi-dung")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Người dùng cần kích hoạt",
                                  "soDienThoai": "%s",
                                  "vaiTro": "THO",
                                  "toaNhaIds": [1]
                                }
                                """.formatted(soDienThoai)))
                .andExpect(status().isCreated());

        String maKichHoat = kichHoatTaiKhoanListener.layMaKichHoat(soDienThoai);
        assertThat(maKichHoat).isNotBlank();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT ma_bi_mat_hash FROM KICH_HOAT_TAI_KHOAN k JOIN NGUOI_DUNG n ON n.id = k.nguoi_dung_id WHERE n.so_dien_thoai = ?",
                String.class,
                soDienThoai
        )).startsWith("pbkdf2$").isNotEqualTo(maKichHoat);

        mockMvc.perform(post("/api/auth/kich-hoat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "soDienThoai": "%s",
                                  "maKichHoat": "%s",
                                  "matKhau": "%s"
                                }
                                """.formatted(soDienThoai, maKichHoat, matKhauNguoiDungTuChon)))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(soDienThoai, matKhauNguoiDungTuChon)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/kich-hoat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "soDienThoai": "%s",
                                  "maKichHoat": "%s",
                                  "matKhau": "MatKhauKhongDuocDungLai"
                                }
                                """.formatted(soDienThoai, maKichHoat)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_AUT_06_maKichHoatHetHanKhongChoDatMatKhau() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");
        String soDienThoai = uniquePhone();
        mockMvc.perform(post("/api/nguoi-dung")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Người dùng có mã hết hạn",
                                  "soDienThoai": "%s",
                                  "vaiTro": "THO",
                                  "toaNhaIds": [1]
                                }
                                """.formatted(soDienThoai)))
                .andExpect(status().isCreated());
        String maKichHoat = kichHoatTaiKhoanListener.layMaKichHoat(soDienThoai);
        jdbcTemplate.update(
                "UPDATE KICH_HOAT_TAI_KHOAN SET het_han = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE nguoi_dung_id = (SELECT id FROM NGUOI_DUNG WHERE so_dien_thoai = ?)",
                soDienThoai
        );

        mockMvc.perform(post("/api/auth/kich-hoat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "soDienThoai": "%s",
                                  "maKichHoat": "%s",
                                  "matKhau": "MatKhauKhongDuocDat"
                                }
                                """.formatted(soDienThoai, maKichHoat)))
                .andExpect(status().isUnauthorized());
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class KichHoatTaiKhoanTestConfiguration {
        @Bean
        CapturingKichHoatTaiKhoanListener kichHoatTaiKhoanListener() {
            return new CapturingKichHoatTaiKhoanListener();
        }
    }

    static final class CapturingKichHoatTaiKhoanListener implements ApplicationListener<KichHoatTaiKhoanEvent> {
        private final Map<String, String> maKichHoatTheoSoDienThoai = new ConcurrentHashMap<>();

        @Override
        public void onApplicationEvent(KichHoatTaiKhoanEvent event) {
            maKichHoatTheoSoDienThoai.put(event.soDienThoai(), event.maKichHoat());
        }

        String layMaKichHoat(String soDienThoai) {
            return maKichHoatTheoSoDienThoai.get(soDienThoai);
        }

        void xoaTatCa() {
            maKichHoatTheoSoDienThoai.clear();
        }
    }

    @Test
    void FR_AUT_06_chiQuanTriHeThongMoiDuocThemSuaKhoaTaiKhoan() throws Exception {
        String createPayload = """
                {
                  "hoTen": "Khong duoc phep",
                  "soDienThoai": "%s",
                  "vaiTro": "THO",
                  "toaNhaIds": [1]
                }
                """.formatted(uniquePhone());
        String updatePayload = """
                {
                  "hoTen": "Khong duoc phep",
                  "soDienThoai": "%s",
                  "vaiTro": "THO",
                  "toaNhaIds": [1]
                }
                """.formatted(uniquePhone());

        for (String token : List.of(
                tokenCuaNguoiDung(2L, "0900000002"),
                tokenCuaNguoiDung(3L, "0900000003"),
                tokenCuaNguoiDung(4L, "0900000004"),
                tokenCuaNguoiDung(5L, "0900000006")
        )) {
            mockMvc.perform(post("/api/nguoi-dung")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(createPayload))
                    .andExpect(status().isForbidden());

            mockMvc.perform(put("/api/nguoi-dung/3")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(updatePayload))
                    .andExpect(status().isForbidden());

            mockMvc.perform(post("/api/nguoi-dung/3/khoa")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void FR_AUT_06_khongCoEndpointXoaTaiKhoan() throws Exception {
        String adminToken = tokenCuaNguoiDung(1L, "0900000001");

        mockMvc.perform(delete("/api/nguoi-dung/3")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());
    }

    private void seedNguoiDung() {
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                1L, "Quản trị hệ thống", "0900000001",
                "pbkdf2$150000$dBvJksg+uY4X7XPHzZCGJw==$LLEsgCWlkPoD3bBs5dTXSewrPQXhxtLHR8sg99n0QqQ=",
                "QTHT", "HOAT_DONG", 0, 0, null, null
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                2L, "Chủ sở hữu mẫu", "0900000002",
                "pbkdf2$150000$pc0t5RDv/3OyspI0R4Z3EQ==$biqz2zQLERpxpvAF/n0XaZqXNJCwkn6VQ5vNwgmPiGU=",
                "CHU", "HOAT_DONG", 0, 0, null, null
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                3L, "Quản lý Toà A", "0900000003",
                "pbkdf2$150000$+aF60RUSKCLImBQfsOY6GA==$aTTa/0C03Kj9hFxepucSCVc+b0XfXl9IoCstDdFjbuQ=",
                "QUAN_LY", "HOAT_DONG", 0, 0, null, null
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                4L, "Thợ sửa chữa mẫu", "0900000004",
                "pbkdf2$150000$D9RILQhZzX1iGw1zo359Gg==$Mn7bqDlQ+IMcVI2Cz7mVWDys/A/LxSsqWCB2HD3Ljfc=",
                "THO", "HOAT_DONG", 0, 0, null, null
        );
        jdbcTemplate.update(
                """
                        INSERT INTO NGUOI_DUNG(
                            id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                5L, "Người thuê mẫu", "0900000006",
                "pbkdf2$150000$mWjKLFx22XqiFMknpYRNWA==$SlG5dhkkjfyl1JKyRqKlGn8HhBdg0B8vRcw72bXCO7o=",
                "NGUOI_THUE", "HOAT_DONG", 0, 0, null, null
        );
    }

    private String tokenCuaNguoiDung(Long nguoiDungId, String soDienThoai) throws Exception {
        return tokenCuaNguoiDung(nguoiDungId, soDienThoai, "runtime-" + nguoiDungId);
    }

    private String tokenCuaNguoiDung(Long nguoiDungId, String soDienThoai, String matKhau) throws Exception {
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?",
                passwordHasher.hash(matKhau),
                nguoiDungId
        );

        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload(soDienThoai, matKhau)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        int tokenValueStart = responseBody.indexOf("\"token\":\"") + 9;
        int tokenValueEnd = responseBody.indexOf('"', tokenValueStart);
        return responseBody.substring(tokenValueStart, tokenValueEnd);
    }

    private String uniquePhone() {
        return "0901" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private String loginPayload(String soDienThoai, String matKhau) {
        return """
                {"soDienThoai":"%s","matKhau":"%s"}
                """.formatted(soDienThoai, matKhau);
    }
}
