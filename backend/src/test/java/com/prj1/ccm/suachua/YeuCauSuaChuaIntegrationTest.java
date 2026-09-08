package com.prj1.ccm.suachua;

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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
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
@Import(YeuCauSuaChuaIntegrationTest.RepairClockTestConfiguration.class)
class YeuCauSuaChuaIntegrationTest {
    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant TEST_NOW = Instant.parse("2040-08-15T03:00:00Z");
    private static final Path STORAGE_ROOT = taoThuMucTam();
    private static final byte[] PNG_1X1 = taoAnh1X1();

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
        registry.add("app.anh.link-secret", () -> "slice-07-repair-request-secret");
        registry.add("app.anh.link-ttl-seconds", () -> 900);
        registry.add("spring.servlet.multipart.max-file-size", () -> "6MB");
        registry.add("spring.servlet.multipart.max-request-size", () -> "6MB");
    }

    @BeforeEach
    void resetDatabase() throws Exception {
        mutableClock.dat(TEST_NOW);
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        xoaNeuBangTonTai("YEU_CAU_SUA_CHUA");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id IN (1, 2, 3, 4, 5)");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1), (3, 1)");
        xoaThuMucCon();
    }

    @Test
    void FR_MNT_01_BR_17_nguoiThueTaoYeuCauMoiTiepNhanKemNamAnhVaLienKetKyHan() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê báo hỏng", "0907000101");
        Long phongId = themPhong(1L, "901");
        themHopDongHieuLuc(phongId, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String tenantToken = login(5L, "0900000006");

        MvcResult response = mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .file(anh("anh-1.png"))
                        .file(anh("anh-2.png"))
                        .file(anh("anh-3.png"))
                        .file(anh("anh-4.png"))
                        .file(anh("anh-5.png"))
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện nước")
                        .param("moTa", "Vòi nước nhà tắm rỉ liên tục")
                        .param("mucDo", "KHAN_CAP")
                        .param("trangThai", "DA_DONG")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maYeuCau").value(org.hamcrest.Matchers.matchesRegex("SC-[0-9]{6}-[0-9]{4,}")))
                .andExpect(jsonPath("$.trangThai").value("MOI_TIEP_NHAN"))
                .andExpect(jsonPath("$.mucDo").value("KHAN_CAP"))
                .andExpect(jsonPath("$.anh.length()").value(5))
                .andReturn();

        JsonNode body = objectMapper.readTree(response.getResponse().getContentAsString());
        long yeuCauId = body.path("id").longValue();
        long anhId = body.path("anh").get(0).path("id").longValue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ANH_DINH_KEM WHERE doi_tuong_loai = 'YEU_CAU_SUA_CHUA' AND doi_tuong_id = ?",
                Integer.class,
                yeuCauId
        )).isEqualTo(5);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'TAO_YEU_CAU_SUA_CHUA' AND doi_tuong = ?",
                Integer.class,
                "YEU_CAU_SUA_CHUA:" + yeuCauId
        )).isEqualTo(1);

        String signedUrl = mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String url = objectMapper.readTree(signedUrl).path("url").textValue();

        mockMvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG_VALUE))
                .andExpect(content().bytes(PNG_1X1));

        mutableClock.cong(Duration.ofMinutes(16));
        mockMvc.perform(get(url))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value("Liên kết ảnh không hợp lệ hoặc đã hết hạn"));
    }

    @Test
    void FR_MNT_01_BR_17_thoChiXemAnhYeuCauKhiDuocPhanCong() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê kiểm quyền thợ", "0907000104");
        Long phongId = themPhong(1L, "910");
        themHopDongHieuLuc(phongId, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String tenantToken = login(5L, "0900000006");

        MvcResult response = mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .file(anh("repair-worker-check.png"))
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Nước")
                        .param("moTa", "Kiểm tra phạm vi ảnh cho thợ")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(response.getResponse().getContentAsString());
        long yeuCauId = body.path("id").longValue();
        long anhId = body.path("anh").get(0).path("id").longValue();

        String workerToken = login(4L, "0900000004");
        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET nguoi_xu_ly_id = ?, trang_thai = 'DA_PHAN_CONG' WHERE id = ?",
                4L,
                yeuCauId
        );

        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isNotEmpty());

        String systemAdminToken = login(1L, "0900000001");
        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_01_BR_17_tuChoAnhThuSauVaKhongTaoYeuCau() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê sáu ảnh", "0907000102");
        Long phongId = themPhong(1L, "902");
        themHopDongHieuLuc(phongId, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String tenantToken = login(5L, "0900000006");

        var request = multipart("/api/yeu-cau-sua-chua")
                .param("phongId", phongId.toString())
                .param("hangMuc", "Nước")
                .param("moTa", "Có sáu ảnh")
                .param("mucDo", "THUONG")
                .header("Authorization", "Bearer " + tenantToken);
        for (int index = 1; index <= 6; index += 1) {
            request.file(anh("anh-" + index + ".png"));
        }

        mockMvc.perform(request)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Mỗi yêu cầu chỉ được đính kèm tối đa 5 ảnh"));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM YEU_CAU_SUA_CHUA", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ANH_DINH_KEM", Integer.class)).isZero();
    }

    @Test
    void FR_MNT_01_BR_17_nguoiThueChiDuocTaoChoPhongCoHopDongHieuLucCuaMinh() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê đúng phòng", "0907000103");
        Long phongCuaMinh = themPhong(1L, "903");
        Long phongCuaNguoiKhac = themPhong(1L, "904");
        themHopDongHieuLuc(phongCuaMinh, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String tenantToken = login(5L, "0900000006");

        mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongCuaNguoiKhac.toString())
                        .param("hangMuc", "Nước")
                        .param("moTa", "Không được tạo cho phòng khác")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_01_BR_17_qthtVaThoKhongDuocTaoYeuCau() throws Exception {
        Long phongId = themPhong(1L, "905");
        String systemAdminToken = login(1L, "0900000001");
        String workerToken = login(4L, "0900000004");

        for (String token : List.of(systemAdminToken, workerToken)) {
            mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                            .param("phongId", phongId.toString())
                            .param("hangMuc", "Điện")
                            .param("moTa", "Không được tạo")
                            .param("mucDo", "THUONG")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void FR_MNT_01_BR_17_quanLyVaChuDuocTaoChoPhongTrongToaDuocPhanCong() throws Exception {
        Long managerRoomId = themPhong(1L, "906");
        Long ownerRoomId = themPhong(1L, "907");
        String managerToken = login(3L, "0900000003");
        String ownerToken = login(2L, "0900000002");

        mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", managerRoomId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Quản lý tạo yêu cầu")
                        .param("mucDo", "GAP")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated());

        mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", ownerRoomId.toString())
                        .param("hangMuc", "Nước")
                        .param("moTa", "Chủ tạo yêu cầu")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isCreated());
    }

    @Test
    void FR_MNT_01_BR_17_quanLyKhongDuocTaoChoPhongNgoaiToaDuocPhanCong() throws Exception {
        Long phongNgoaiPhamViId = themPhong(2L, "908");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongNgoaiPhamViId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Ngoài phạm vi")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_01_BR_17_V36TaoDuCotPhanCongChiPhiTrangThaiVaRangBuocMaYeuCau() {
        List<String> columnNames = jdbcTemplate.queryForList(
                """
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = 'yeu_cau_sua_chua'
                        """,
                String.class
        );

        assertThat(columnNames).contains(
                "ma_yeu_cau", "phong_id", "nguoi_tao_id", "hang_muc", "mo_ta", "muc_do", "trang_thai",
                "nguoi_tiep_nhan_id", "tiep_nhan_luc", "nguoi_xu_ly_id", "phan_cong_luc", "chi_phi",
                "ben_chiu_chi_phi", "cho_xac_nhan_luc", "ly_do_huy", "tao_luc"
        );

        var moneyColumn = jdbcTemplate.queryForMap(
                """
                        SELECT data_type, numeric_precision, numeric_scale
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'yeu_cau_sua_chua'
                          AND column_name = 'chi_phi'
                        """
        );
        assertThat(moneyColumn.get("data_type")).isEqualTo("numeric");
        assertThat(((Number) moneyColumn.get("numeric_precision")).intValue()).isEqualTo(15);
        assertThat(((Number) moneyColumn.get("numeric_scale")).intValue()).isEqualTo(2);

        List<String> constraints = jdbcTemplate.queryForList(
                """
                        SELECT pg_get_constraintdef(oid)
                        FROM pg_constraint
                        WHERE conrelid = 'YEU_CAU_SUA_CHUA'::regclass
                        """,
                String.class
        );
        assertThat(constraints).anyMatch(item -> item.contains("DA_HUY"));
        assertThat(constraints).anyMatch(item -> item.contains("KHAN_CAP"));
        assertThat(constraints).anyMatch(item -> item.contains("CHU_NHA"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'YEU_CAU_SUA_CHUA'::regclass AND contype = 'u'",
                Integer.class
        )).isEqualTo(1);
    }

    private MockMultipartFile anh(String ten) {
        return new MockMultipartFile("anh", ten, MediaType.IMAGE_PNG_VALUE, PNG_1X1);
    }

    private Long themNguoiThue(String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan)
                        VALUES (?, DATE '1990-01-01', ?, ?, 'Hà Nội')
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                "079" + Math.abs(soDienThoai.hashCode())
        );
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 9, 25.00, 3, 3000000.00, 'Studio', 'TRONG')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong
        );
    }

    private Long themHopDongHieuLuc(Long phongId, Long nguoiThueId) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2040-01-01', DATE '2040-12-31', 3000000.00, 3000000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId
        );
    }

    private void ganTaiKhoanNguoiThue(Long nguoiThueId) {
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", nguoiThueId);
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
        Boolean tonTai = jdbcTemplate.queryForObject(
                "SELECT to_regclass(?) IS NOT NULL",
                Boolean.class,
                "public." + tenBang
        );
        if (Boolean.TRUE.equals(tonTai)) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    private static Path taoThuMucTam() {
        try {
            return Files.createTempDirectory("prj1-slice-07-repair-request-");
        } catch (IOException exception) {
            throw new IllegalStateException("Khong tao duoc thu muc tam", exception);
        }
    }

    private void xoaThuMucCon() throws IOException {
        if (!Files.exists(STORAGE_ROOT)) {
            return;
        }
        try (var stream = Files.list(STORAGE_ROOT)) {
            for (Path path : stream.toList()) {
                Files.deleteIfExists(path);
            }
        }
    }

    private static byte[] taoAnh1X1() {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, 0x336699);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Khong tao duoc anh kiem thu", exception);
        }
    }

    @TestConfiguration
    static class RepairClockTestConfiguration {
        @Bean
        MutableClock mutableClock() {
            return new MutableClock(TEST_NOW, TEST_ZONE);
        }

        @Bean
        @Primary
        Clock repairTestClock(MutableClock mutableClock) {
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
            this.instant = instant.plus(duration);
        }
    }
}
