package com.prj1.ccm.nguoithue;

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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(NguoiThueAnhGiayToIntegrationTest.AnhClockTestConfiguration.class)
class NguoiThueAnhGiayToIntegrationTest {

    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant TEST_NOW = Instant.parse("2040-08-15T03:00:00Z");
    private static final Path STORAGE_ROOT = taoThuMucTam();

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

    @Autowired
    private MutableClock mutableClock;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.anh.storage-root", () -> STORAGE_ROOT.toString());
        registry.add("app.anh.link-secret", () -> "slice-02-anh-giay-to-secret");
        registry.add("app.anh.link-ttl-seconds", () -> 900);
        registry.add("spring.servlet.multipart.max-file-size", () -> "6MB");
        registry.add("spring.servlet.multipart.max-request-size", () -> "6MB");
    }

    @BeforeEach
    void resetDatabase() throws Exception {
        mutableClock.dat(TEST_NOW);
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
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
        xoaThuMucCon();
    }

    @Test
    void FR_TNT_01_NFR_SEC_04_taiLenAnhGiayToXinLienKetKyVaTuChoiSauKhiHetHan() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Lâm Bảo An", "1996-07-20", "0907000111", "079123456789", "Hà Tĩnh");

        MockMultipartFile matTruoc = new MockMultipartFile(
                "tep",
                "mat-truoc.png",
                MediaType.IMAGE_PNG_VALUE,
                png1x1()
        );
        MockMultipartFile matSau = new MockMultipartFile(
                "tep",
                "mat-sau.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                jpeg1x1()
        );

        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(matTruoc)
                        .param("ghiChu", "mat truoc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.doiTuongLoai").value("NGUOI_THUE"))
                .andExpect(jsonPath("$.doiTuongId").value(nguoiThueId))
                .andExpect(jsonPath("$.ghiChu").value("mat truoc"))
                .andExpect(jsonPath("$.loaiNoiDung").value(MediaType.IMAGE_PNG_VALUE))
                .andExpect(jsonPath("$.kichThuoc").value(png1x1().length));

        MvcResult uploadMatSau = mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(matSau)
                        .param("ghiChu", "mat sau")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ghiChu").value("mat sau"))
                .andReturn();

        Long anhId = objectMapper.readTree(uploadMatSau.getResponse().getContentAsString()).path("id").asLong();

        List<Map<String, Object>> anhDaLuu = jdbcTemplate.queryForList(
                """
                        SELECT doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu
                        FROM ANH_DINH_KEM
                        WHERE doi_tuong_loai = 'NGUOI_THUE' AND doi_tuong_id = ?
                        ORDER BY id
                        """,
                nguoiThueId
        );
        assertThat(anhDaLuu).hasSize(2);
        assertThat(anhDaLuu)
                .extracting(record -> record.get("ghi_chu"))
                .containsExactly("mat truoc", "mat sau");
        assertThat(anhDaLuu)
                .extracting(record -> String.valueOf(record.get("khoa_luu_tru")))
                .allMatch(khoa -> !khoa.contains("/api/"))
                .allMatch(khoa -> !khoa.contains("mat-truoc"))
                .allMatch(khoa -> !khoa.contains("mat-sau"));

        String signedUrl = xinLienKet(managerToken, anhId);

        mockMvc.perform(get(signedUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG_VALUE))
                .andExpect(content().bytes(jpeg1x1()));

        mutableClock.cong(Duration.ofMinutes(16));

        mockMvc.perform(get(signedUrl))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value("Liên kết ảnh không hợp lệ hoặc đã hết hạn"));
    }

    @Test
    void FR_TNT_01_NFR_SEC_04_thoVaNguoiThueKhongTheTaiLenHoacXinLienKetAnhGiayTo() throws Exception {
        Long nguoiThueId = themNguoiThue("Hồ sơ bị chặn", "1998-11-03", "0907000222", "001122334455", "Phú Thọ");
        Long anhId = themAnhDinhKem(nguoiThueId, "mat truoc", "existing-key.png", MediaType.IMAGE_PNG_VALUE, 68L);
        String workerToken = login(4L, "0900000004");
        String tenantToken = login(5L, "0900000006");
        MockMultipartFile tep = new MockMultipartFile("tep", "mat-truoc.png", MediaType.IMAGE_PNG_VALUE, png1x1());

        for (String token : List.of(workerToken, tenantToken)) {
            mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                            .file(tep)
                            .param("ghiChu", "mat truoc")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void FR_TNT_01_NFR_SEC_04_tuChoiTepKhongPhaiAnhTheoNoiDungVaBaoLoiKichThuocVuotGioiHan() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Nguyễn Hữu Trí", "1997-01-14", "0907000333", "667788990011", "Bình Định");

        MockMultipartFile giaAnh = new MockMultipartFile(
                "tep",
                "nguy-trang.png",
                MediaType.IMAGE_PNG_VALUE,
                "khong-phai-anh".getBytes()
        );
        MockMultipartFile quaLon = new MockMultipartFile(
                "tep",
                "qua-lon.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                jpegCoKichThuoc(5 * 1024 * 1024 + 1)
        );

        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(giaAnh)
                        .param("ghiChu", "mat truoc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Tệp tải lên phải là ảnh PNG hoặc JPEG hợp lệ"));

        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(quaLon)
                        .param("ghiChu", "mat sau")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Tệp tải lên không được vượt quá 5 MB"));

        Integer soLuongAnh = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ANH_DINH_KEM", Integer.class);
        assertThat(soLuongAnh).isZero();
    }

    private String xinLienKet(String token, Long anhId) throws Exception {
        MvcResult lienKetResponse = mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isString())
                .andReturn();
        return objectMapper.readTree(lienKetResponse.getResponse().getContentAsString()).path("url").asText();
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

    private Long themAnhDinhKem(Long nguoiThueId, String ghiChu, String khoaLuuTru, String loaiNoiDung, Long kichThuoc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO ANH_DINH_KEM(doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc)
                        VALUES ('NGUOI_THUE', ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                nguoiThueId,
                khoaLuuTru,
                ghiChu,
                loaiNoiDung,
                kichThuoc
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

    private static Path taoThuMucTam() {
        try {
            return Files.createTempDirectory("prj1-task2-anh-");
        } catch (Exception exception) {
            throw new IllegalStateException("Khong tao duoc thu muc tam", exception);
        }
    }

    private void xoaThuMucCon() throws Exception {
        if (!Files.exists(STORAGE_ROOT)) {
            return;
        }
        try (var stream = Files.list(STORAGE_ROOT)) {
            for (Path path : stream.toList()) {
                Files.deleteIfExists(path);
            }
        }
    }

    private static byte[] png1x1() {
        return new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53,
                (byte) 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
                0x08, (byte) 0xD7, 0x63, (byte) 0xF8, 0x0F, 0x00, 0x01, 0x01,
                0x01, 0x00, 0x18, (byte) 0xDD, (byte) 0x8D, (byte) 0xB1, 0x00,
                0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
                0x42, 0x60, (byte) 0x82
        };
    }

    private static byte[] jpeg1x1() {
        return new byte[]{
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10,
                0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
                0x00, 0x01, 0x00, 0x00, (byte) 0xFF, (byte) 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07,
                0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B,
                0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F,
                0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
                0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30,
                0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
                0x3C, 0x2E, 0x33, 0x34, 0x32, (byte) 0xFF, (byte) 0xC0, 0x00,
                0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x03, 0x01, 0x22, 0x00,
                0x02, 0x11, 0x01, 0x03, 0x11, 0x01, (byte) 0xFF, (byte) 0xC4,
                0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08,
                (byte) 0xFF, (byte) 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, (byte) 0xFF, (byte) 0xDA, 0x00, 0x0C,
                0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00,
                (byte) 0xD2, (byte) 0xCF, 0x20, (byte) 0xFF, (byte) 0xD9
        };
    }

    private static byte[] jpegCoKichThuoc(int kichThuoc) {
        byte[] raw = jpeg1x1();
        byte[] duLieu = new byte[kichThuoc];
        System.arraycopy(raw, 0, duLieu, 0, raw.length - 2);
        for (int index = raw.length - 2; index < kichThuoc - 2; index++) {
            duLieu[index] = 0x11;
        }
        duLieu[kichThuoc - 2] = (byte) 0xFF;
        duLieu[kichThuoc - 1] = (byte) 0xD9;
        return duLieu;
    }

    @TestConfiguration
    static class AnhClockTestConfiguration {
        @Bean
        MutableClock mutableClock() {
            return new MutableClock(TEST_NOW, TEST_ZONE);
        }

        @Bean
        @Primary
        Clock anhGiayToTestClock(MutableClock mutableClock) {
            return mutableClock;
        }
    }

    static final class MutableClock extends Clock {
        private final ZoneId zoneId;
        private Instant instant;

        private MutableClock(Instant instant, ZoneId zoneId) {
            this.instant = instant;
            this.zoneId = zoneId;
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

        void dat(Instant instant) {
            this.instant = instant;
        }

        void cong(Duration duration) {
            this.instant = this.instant.plus(duration);
        }
    }
}
