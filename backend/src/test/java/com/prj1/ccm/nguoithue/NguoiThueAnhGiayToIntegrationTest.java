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
    private static final byte[] PNG_1X1 = taoAnh1X1("png");
    private static final byte[] JPEG_1X1 = taoAnh1X1("jpeg");

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
        jdbcTemplate.update("DELETE FROM HOP_DONG");
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
        Long phongId = themPhong(1L, "901");
        themHopDong(phongId, nguoiThueId, LocalDate.of(2039, 1, 1), LocalDate.of(2039, 12, 31));

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

        mockMvc.perform(get(signedUrl + "&hetHan=1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value("Liên kết ảnh không hợp lệ hoặc đã hết hạn"));

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
    void BR_17_xinLienKetAnhGiayToGhiMotNhatKyVoiDungNguoiDungVaNguoiThue() throws Exception {
        String ownerToken = login(2L, "0900000002");
        Long nguoiThueId = themNguoiThue("Hồ sơ nhật ký bịa", "1995-02-14", "0907000444", "112233445566", "Quảng Nam");
        Long phongId = themPhong(1L, "901");
        themHopDong(phongId, nguoiThueId, LocalDate.of(2039, 1, 1), LocalDate.of(2039, 12, 31));
        ganToaChoNguoiDung(2L, 1L);
        Long anhId = themAnhDinhKem(nguoiThueId, "mat truoc", "audit-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);

        xinLienKet(ownerToken, anhId);

        List<Map<String, Object>> nhatKy = jdbcTemplate.queryForList(
                """
                        SELECT nguoi_dung_id, hanh_dong, doi_tuong, gia_tri_truoc, gia_tri_sau
                        FROM NHAT_KY_THAO_TAC
                        WHERE hanh_dong = 'XEM_ANH_GIAY_TO'
                        """
        );

        assertThat(nhatKy).singleElement().satisfies(record -> {
            assertThat(record.get("nguoi_dung_id")).isEqualTo(2L);
            assertThat(record.get("hanh_dong")).isEqualTo("XEM_ANH_GIAY_TO");
            assertThat(record.get("doi_tuong")).isEqualTo("NGUOI_THUE:" + nguoiThueId);
            assertThat(record.get("gia_tri_truoc")).isNull();
            assertThat(record.get("gia_tri_sau")).isNull();
        });
    }

    @Test
    void BR_17_quanLyChiXinLienKetAnhGiayToCuaNguoiThueThuocToaDuocPhanCong() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueToaA = themNguoiThue("Hồ sơ toà A bịa", "1994-06-10", "0907000555", "223344556677", "Đồng Nai");
        Long nguoiThueToaB = themNguoiThue("Hồ sơ toà B bịa", "1993-07-11", "0907000666", "334455667788", "Gia Lai");
        Long phongToaA = themPhong(1L, "902");
        Long phongToaB = themPhong(2L, "903");
        themHopDong(phongToaA, nguoiThueToaA, LocalDate.of(2039, 1, 1), LocalDate.of(2039, 12, 31));
        themHopDong(phongToaB, nguoiThueToaB, LocalDate.of(2039, 1, 1), LocalDate.of(2039, 12, 31));
        Long anhToaAId = themAnhDinhKem(nguoiThueToaA, "mat truoc A", "building-a-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);
        Long anhToaBId = themAnhDinhKem(nguoiThueToaB, "mat truoc B", "building-b-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);

        xinLienKet(managerToken, anhToaAId);

        mockMvc.perform(get("/api/anh/" + anhToaBId + "/lien-ket")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        MockMultipartFile tepNgoaiPhamVi = new MockMultipartFile(
                "tep",
                "foreign-building-document.png",
                MediaType.IMAGE_PNG_VALUE,
                png1x1()
        );
        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueToaB + "/anh")
                        .file(tepNgoaiPhamVi)
                        .param("ghiChu", "không được phép")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ANH_DINH_KEM WHERE doi_tuong_id = ?",
                Integer.class,
                nguoiThueToaB
        )).isEqualTo(1);
    }

    @Test
    void FR_AUT_04_BR_17_wrongRoleCannotRequestIdentityDocumentLinkEvenWhenAssignedToBuilding() throws Exception {
        Long nguoiThueId = themNguoiThue("Hồ sơ thợ bịa", "1991-04-12", "0907000888", "556677889900", "Lâm Đồng");
        Long phongId = themPhong(1L, "904");
        themHopDong(phongId, nguoiThueId, LocalDate.of(2039, 1, 1), LocalDate.of(2039, 12, 31));
        ganToaChoNguoiDung(4L, 1L);
        Long anhId = themAnhDinhKem(nguoiThueId, "mat truoc", "worker-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);
        String workerToken = login(4L, "0900000004");

        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'XEM_ANH_GIAY_TO'",
                Integer.class
        )).isZero();
    }

    @Test
    void FR_AUT_04_BR_17_systemAdminCannotRequestIdentityDocumentLink() throws Exception {
        String systemAdminToken = login(1L, "0900000001");
        Long nguoiThueId = themNguoiThue("Hồ sơ QTHT bịa", "1992-08-12", "0907000777", "445566778899", "Bình Thuận");
        Long anhId = themAnhDinhKem(nguoiThueId, "mat truoc", "system-admin-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);

        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_AUT_04_BR_17_systemAdminCannotUploadIdentityDocument() throws Exception {
        String systemAdminToken = login(1L, "0900000001");
        Long nguoiThueId = themNguoiThue("Hồ sơ QTHT upload bịa", "1992-08-13", "0900000778", "445566778880", "Bình Thuận");
        MockMultipartFile tep = new MockMultipartFile(
                "tep",
                "system-admin-upload.png",
                MediaType.IMAGE_PNG_VALUE,
                png1x1()
        );

        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(tep)
                        .param("ghiChu", "không được phép")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ANH_DINH_KEM", Integer.class)).isZero();
    }

    @Test
    void FR_TNT_01_managerCanUploadIdentityDocumentForOnboardingTenantWithoutContract() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Hồ sơ onboarding bịa", "1990-02-02", "0900000998", "778899001123", "Ninh Bình");
        MockMultipartFile tep = new MockMultipartFile(
                "tep",
                "onboarding-document.png",
                MediaType.IMAGE_PNG_VALUE,
                png1x1()
        );

        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(tep)
                        .param("ghiChu", "ảnh onboarding")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.doiTuongLoai").value("NGUOI_THUE"))
                .andExpect(jsonPath("$.doiTuongId").value(nguoiThueId))
                .andExpect(jsonPath("$.ghiChu").value("ảnh onboarding"));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ANH_DINH_KEM WHERE doi_tuong_loai = 'NGUOI_THUE' AND doi_tuong_id = ?",
                Integer.class,
                nguoiThueId
        )).isEqualTo(1);
    }

    @Test
    void FR_AUT_05_ownerCannotUploadIdentityDocumentForTenantOnlyInForeignBuilding() throws Exception {
        String ownerToken = login(2L, "0900000002");
        Long nguoiThueId = themNguoiThue("Hồ sơ chủ ngoài phạm vi", "1990-03-03", "0900000997", "778899001124", "Ninh Bình");
        Long phongToaB = themPhong(2L, "909");
        themHopDong(phongToaB, nguoiThueId, LocalDate.of(2039, 1, 1), LocalDate.of(2039, 12, 31));
        ganToaChoNguoiDung(2L, 1L);
        MockMultipartFile tep = new MockMultipartFile(
                "tep",
                "owner-foreign-building.png",
                MediaType.IMAGE_PNG_VALUE,
                png1x1()
        );

        mockMvc.perform(multipart("/api/nguoi-thue/" + nguoiThueId + "/anh")
                        .file(tep)
                        .param("ghiChu", "không được phép")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ANH_DINH_KEM", Integer.class)).isZero();
    }

    @Test
    void BR_17_khongChoXinLienKetAnhGiayToCuaHoSoKhongTonTai() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long anhId = themAnhDinhKem(999999L, "ảnh mồ côi", "orphan-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);

        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void BR_17_khongChoXinLienKetAnhGiayToCuaHoSoDangOnboardingChuaCoHopDong() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Hồ sơ chờ ký", "1990-01-01", "0907000999", "778899001122", "Ninh Bình");
        Long anhId = themAnhDinhKem(nguoiThueId, "ảnh chờ ký", "pending-contract-document.png", MediaType.IMAGE_PNG_VALUE, (long) png1x1().length);

        mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
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

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'XEM_ANH_GIAY_TO'",
                Integer.class
        )).isZero();
    }

    @Test
    void FR_TNT_01_NFR_SEC_04_tuChoiTepKhongPhaiAnhTheoNoiDungVaBaoLoiKichThuocVuotGioiHan() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Nguyễn Hữu Trí", "1997-01-14", "0907000333", "667788990011", "Bình Định");

        MockMultipartFile giaAnh = new MockMultipartFile(
                "tep",
                "nguy-trang.png",
                MediaType.IMAGE_PNG_VALUE,
                pngGiaVo()
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

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 9, 22.50, 4, 3500000.00, 'Studio', 'TRONG')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong
        );
    }

    private void themHopDong(Long phongId, Long nguoiThueId, LocalDate ngayBatDau, LocalDate ngayKetThuc) {
        jdbcTemplate.update(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?, ?, 3500000.00, 3500000.00, 30, 'HIEU_LUC')
                        """,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc)
        );
    }

    private void ganToaChoNguoiDung(Long nguoiDungId, Long toaNhaId) {
        jdbcTemplate.update(
                "INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                nguoiDungId,
                toaNhaId
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
        return PNG_1X1.clone();
    }

    private static byte[] pngGiaVo() {
        return new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x6B, 0x68, 0x6F, 0x6E, 0x67, 0x2D, 0x67, 0x69, 0x61
        };
    }

    private static byte[] jpeg1x1() {
        return JPEG_1X1.clone();
    }

    private static byte[] taoAnh1X1(String dinhDang) {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, 0x336699);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (!ImageIO.write(image, dinhDang, output)) {
                throw new IllegalStateException("Khong co bo ghi anh cho " + dinhDang);
            }
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Khong tao duoc anh kiem thu", exception);
        }
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
