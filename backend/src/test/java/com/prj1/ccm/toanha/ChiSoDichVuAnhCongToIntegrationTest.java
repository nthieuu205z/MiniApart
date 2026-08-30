package com.prj1.ccm.toanha;

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
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
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
@Import(ChiSoDichVuAnhCongToIntegrationTest.AnhClockTestConfiguration.class)
class ChiSoDichVuAnhCongToIntegrationTest {

    private static final ZoneId TEST_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Instant TEST_NOW = Instant.parse("2040-08-15T03:00:00Z");
    private static final Path STORAGE_ROOT = taoThuMucTam();
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
        registry.add("app.anh.link-secret", () -> "slice-03-anh-cong-to-secret");
        registry.add("app.anh.link-ttl-seconds", () -> 900);
        registry.add("spring.servlet.multipart.max-file-size", () -> "6MB");
        registry.add("spring.servlet.multipart.max-request-size", () -> "6MB");
        registry.add("app.toa-nha.canh-bao-tieu-thu-nguong", () -> "1.75");
    }

    @BeforeEach
    void resetDatabase() throws Exception {
        mutableClock.dat(TEST_NOW);
        jdbcTemplate.update("DELETE FROM XAC_NHAN_CANH_BAO_CHI_SO");
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
        jdbcTemplate.update("DELETE FROM CHI_SO_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbcTemplate.update("DELETE FROM THEO_DOI_DANG_NHAP");
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
        jdbcTemplate.update(
                """
                        UPDATE TOA_NHA
                        SET bat_buoc_anh_cong_to = FALSE
                        WHERE id IN (1, 2)
                        """
        );
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA (nguoi_dung_id, toa_nha_id) VALUES (3, 1)");
        xoaThuMucCon();
    }

    @Test
    void FR_MTR_06_NFR_SEC_04_managerSavesMeterReadingWithPhotoAndUsesSignedLink() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000090");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");
        MockMultipartFile tep = new MockMultipartFile("tep", "cong-to.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1());

        MvcResult luuResponse = mockMvc.perform(multipart("/api/toa-nha/1/ky-thanh-toan/" + kyHienTaiId + "/chi-so")
                        .file(tep)
                        .param("phongId", String.valueOf(phongId))
                        .param("dichVuId", String.valueOf(dienId))
                        .param("chiSoCuoi", "1252.75")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chiSoCuoi").value("1252.75"))
                .andExpect(jsonPath("$.anhCongToId").isNumber())
                .andReturn();

        Long anhId = objectMapper.readTree(luuResponse.getResponse().getContentAsString()).path("anhCongToId").asLong();
        Long chiSoId = jdbcTemplate.queryForObject(
                "SELECT id FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Long.class,
                kyHienTaiId,
                phongId,
                dienId
        );

        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM ANH_DINH_KEM
                        WHERE id = ?
                          AND doi_tuong_loai = 'CHI_SO_DICH_VU'
                          AND doi_tuong_id = ?
                        """,
                Integer.class,
                anhId,
                chiSoId
        )).isEqualTo(1);

        String signedUrl = xinLienKet(managerToken, anhId);

        mockMvc.perform(get(signedUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_JPEG_VALUE))
                .andExpect(content().bytes(jpeg1x1()));

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/" + kyHienTaiId + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phong[0].dichVu[0].anhCongToId").value(anhId));
    }

    @Test
    void FR_MTR_09_CR_004_BR_09_mapsReplacementReadingsThroughMultipartMeterPhotoSave() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê thay công tơ", "0900000086");
        themHopDongVaDichVu(phongId, nguoiThueId, dienId);
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(multipart("/api/toa-nha/1/ky-thanh-toan/" + kyHienTaiId + "/chi-so")
                        .file(new MockMultipartFile("tep", "cong-to.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1()))
                        .param("phongId", String.valueOf(phongId))
                        .param("dichVuId", String.valueOf(dienId))
                        .param("chiSoCuoi", "15.25")
                        .param("coThayCongTo", "true")
                        .param("chiSoCuoiCongToCu", "1275.50")
                        .param("chiSoDauCongToMoi", "0.00")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mucTieuThu").value("50.75"))
                .andExpect(jsonPath("$.chiSoCuoiCongToCu").value("1275.50"))
                .andExpect(jsonPath("$.chiSoDauCongToMoi").value("0.00"))
                .andExpect(jsonPath("$.anhCongToId").isNumber());
    }

    @Test
    void FR_MTR_07_serverRejectsSavingWithoutPhotoWhenBuildingPolicyIsEnabled() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyTruocId = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyHienTaiId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000089");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");
        themChiSo(kyTruocId, phongId, dienId, "1234.50", "1240.00", 3L);
        jdbcTemplate.update("UPDATE TOA_NHA SET bat_buoc_anh_cong_to = TRUE WHERE id = 1");

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyHienTaiId + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1252.75"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Toà nhà này yêu cầu ảnh công tơ trước khi lưu chỉ số."));

        mockMvc.perform(multipart("/api/toa-nha/1/ky-thanh-toan/" + kyHienTaiId + "/chi-so")
                        .file(new MockMultipartFile("tep", "cong-to.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1()))
                        .param("phongId", String.valueOf(phongId))
                        .param("dichVuId", String.valueOf(dienId))
                        .param("chiSoCuoi", "1252.75")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.anhCongToId").isNumber());

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyHienTaiId + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "1253.00"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Toà nhà này yêu cầu ảnh công tơ trước khi lưu chỉ số."));
    }

    @Test
    void FR_MTR_06_FR_MTR_07_wrongRoleAndForeignScopeReceive403OnMeterPhotoFlows() throws Exception {
        Long toaAServiceId = themDichVu(1L, "Điện Toà A", "kWh");
        Long toaAPhongId = themPhong(1L, "101", 1);
        Long toaAKyId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long toaANguoiThueId = themNguoiThue("Người thuê Toà A", "0900000088");
        Long toaAHopDongId = themHopDong(toaAPhongId, toaANguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(toaAHopDongId, toaAServiceId, "3500.00");
        Long toaAChiSoId = themChiSo(toaAKyId, toaAPhongId, toaAServiceId, "0.00", "1.00", 3L);
        Long toaAAnhId = themAnhDinhKemChiSo(toaAChiSoId, "toa-a.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1().length);

        Long toaBServiceId = themDichVu(2L, "Điện Toà B", "kWh");
        Long toaBPhongId = themPhong(2L, "101", 1);
        Long toaBKyId = themKyThanhToan(2L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long toaBNguoiThueId = themNguoiThue("Người thuê Toà B", "0900000087");
        Long toaBHopDongId = themHopDong(toaBPhongId, toaBNguoiThueId, "2026-07-01", "2026-08-31");
        themDichVuHopDong(toaBHopDongId, toaBServiceId, "3500.00");
        Long toaBChiSoId = themChiSo(toaBKyId, toaBPhongId, toaBServiceId, "0.00", "1.00", 3L);
        Long toaBAnhId = themAnhDinhKemChiSo(toaBChiSoId, "toa-b.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1().length);

        String workerToken = login(4L, "0900000004");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(multipart("/api/toa-nha/1/ky-thanh-toan/" + toaAKyId + "/chi-so")
                        .file(new MockMultipartFile("tep", "cong-to.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1()))
                        .param("phongId", String.valueOf(toaAPhongId))
                        .param("dichVuId", String.valueOf(toaAServiceId))
                        .param("chiSoCuoi", "2.00")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/anh/" + toaAAnhId + "/lien-ket")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(multipart("/api/toa-nha/2/ky-thanh-toan/" + toaBKyId + "/chi-so")
                        .file(new MockMultipartFile("tep", "cong-to.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1()))
                        .param("phongId", String.valueOf(toaBPhongId))
                        .param("dichVuId", String.valueOf(toaBServiceId))
                        .param("chiSoCuoi", "2.00")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/anh/" + toaBAnhId + "/lien-ket")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MTR_04_listsSameRoomHistoryOnlyAndSkipsWarningWhenHistoryIsInsufficient() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongCanhBaoId = themPhong(1L, "101", 1);
        Long phongNhieuHonId = themPhong(1L, "102", 1);
        Long phongKhongDuLichSuId = themPhong(1L, "103", 1);

        Long kyThang5Id = themKyThanhToan(1L, 2026, 5, "2026-04-26", "2026-05-25", "DA_CHOT");
        Long kyThang6Id = themKyThanhToan(1L, 2026, 6, "2026-05-26", "2026-06-25", "DA_CHOT");
        Long kyThang7Id = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyThang8Id = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");

        Long nguoiThueId = themNguoiThue("Người thuê ghi chỉ số", "0900000091");
        themHopDongVaDichVu(phongCanhBaoId, nguoiThueId, dienId);
        themHopDongVaDichVu(phongNhieuHonId, nguoiThueId, dienId);
        themHopDongVaDichVu(phongKhongDuLichSuId, nguoiThueId, dienId);

        themChiSo(kyThang5Id, phongCanhBaoId, dienId, "100.00", "110.00", 3L);
        themChiSo(kyThang6Id, phongCanhBaoId, dienId, "110.00", "122.00", 3L);
        themChiSo(kyThang7Id, phongCanhBaoId, dienId, "122.00", "136.00", 3L);

        themChiSo(kyThang5Id, phongNhieuHonId, dienId, "200.00", "350.00", 3L);
        themChiSo(kyThang6Id, phongNhieuHonId, dienId, "350.00", "520.00", 3L);
        themChiSo(kyThang7Id, phongNhieuHonId, dienId, "520.00", "710.00", 3L);

        themChiSo(kyThang6Id, phongKhongDuLichSuId, dienId, "50.00", "60.00", 3L);
        themChiSo(kyThang7Id, phongKhongDuLichSuId, dienId, "60.00", "70.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(get("/api/toa-nha/1/ky-thanh-toan/" + kyThang8Id + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phong[0].dichVu[0].thongTinCanhBaoTieuThu.trungBinhBaKyTruoc").value("12.00"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].thongTinCanhBaoTieuThu.nguongCanhBao").value("1.75"))
                .andExpect(jsonPath("$.phong[0].dichVu[0].thongTinCanhBaoTieuThu.soKyLichSu").value(3))
                .andExpect(jsonPath("$.phong[2].dichVu[0].thongTinCanhBaoTieuThu").doesNotExist());
    }

    @Test
    void FR_MTR_04_doesNotSaveAnomalyUntilTheAuthenticatedManagerAcknowledgesIt() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);

        Long kyThang5Id = themKyThanhToan(1L, 2026, 5, "2026-04-26", "2026-05-25", "DA_CHOT");
        Long kyThang6Id = themKyThanhToan(1L, 2026, 6, "2026-05-26", "2026-06-25", "DA_CHOT");
        Long kyThang7Id = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyThang8Id = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");

        Long nguoiThueId = themNguoiThue("Người thuê cảnh báo", "0900000092");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-05-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dienId, "3500.00");

        themChiSo(kyThang5Id, phongId, dienId, "100.00", "110.00", 3L);
        themChiSo(kyThang6Id, phongId, dienId, "110.00", "122.00", 3L);
        themChiSo(kyThang7Id, phongId, dienId, "122.00", "136.00", 3L);

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyThang8Id + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "160.00"}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value("Mức tiêu thụ kỳ này là 24.00, trung bình ba kỳ trước là 12.00, gấp 2.00 lần."));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Integer.class,
                kyThang8Id,
                phongId,
                dienId
        )).isZero();

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyThang8Id + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"phongId": %d, "dichVuId": %d, "chiSoCuoi": "160.00", "xacNhanCanhBao": true}
                                """.formatted(phongId, dienId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.chiSoCuoi").value("160.00"))
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.coCanhBao").value(true))
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.thongBaoCanhBao").value("Mức tiêu thụ kỳ này là 24.00, trung bình ba kỳ trước là 12.00, gấp 2.00 lần."))
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.trungBinhBaKyTruoc").value("12.00"))
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.gapTrungBinh").value("2.00"));

        Long chiSoId = jdbcTemplate.queryForObject(
                "SELECT id FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Long.class,
                kyThang8Id,
                phongId,
                dienId
        );

        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM XAC_NHAN_CANH_BAO_CHI_SO
                        WHERE chi_so_dich_vu_id = ?
                          AND nguoi_xac_nhan_id = ?
                          AND muc_tieu_thu_ky_nay = 24.00
                          AND trung_binh_ba_ky_truoc = 12.00
                        """,
                Integer.class,
                chiSoId,
                3L
        )).isEqualTo(1);
    }

    @Test
    void FR_MTR_04_rejectsWrongRoleAndForeignBuildingScopeBeforeAnomalyAcknowledgement() throws Exception {
        Long kyToaAId = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long kyToaBId = themKyThanhToan(2L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        String workerToken = login(4L, "0900000004");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyToaAId + "/chi-so")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phongId\": 1, \"dichVuId\": 1, \"chiSoCuoi\": \"10.00\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/toa-nha/2/ky-thanh-toan/" + kyToaBId + "/chi-so")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phongId\": 1, \"dichVuId\": 1, \"chiSoCuoi\": \"10.00\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MTR_04_savesAcknowledgedAnomalyThroughMandatoryPhotoMultipartFlow() throws Exception {
        Long dienId = themDichVu(1L, "Điện sinh hoạt", "kWh");
        Long phongId = themPhong(1L, "101", 1);
        Long kyThang5Id = themKyThanhToan(1L, 2026, 5, "2026-04-26", "2026-05-25", "DA_CHOT");
        Long kyThang6Id = themKyThanhToan(1L, 2026, 6, "2026-05-26", "2026-06-25", "DA_CHOT");
        Long kyThang7Id = themKyThanhToan(1L, 2026, 7, "2026-06-26", "2026-07-25", "DA_CHOT");
        Long kyThang8Id = themKyThanhToan(1L, 2026, 8, "2026-07-26", "2026-08-25", "DANG_MO");
        Long nguoiThueId = themNguoiThue("Người thuê multipart", "0900000093");
        themHopDongVaDichVu(phongId, nguoiThueId, dienId);
        themChiSo(kyThang5Id, phongId, dienId, "100.00", "110.00", 3L);
        themChiSo(kyThang6Id, phongId, dienId, "110.00", "122.00", 3L);
        themChiSo(kyThang7Id, phongId, dienId, "122.00", "136.00", 3L);
        jdbcTemplate.update("UPDATE TOA_NHA SET bat_buoc_anh_cong_to = TRUE WHERE id = 1");

        String managerToken = login(3L, "0900000003");

        mockMvc.perform(multipart("/api/toa-nha/1/ky-thanh-toan/" + kyThang8Id + "/chi-so")
                        .file(new MockMultipartFile("tep", "cong-to.jpg", MediaType.IMAGE_JPEG_VALUE, jpeg1x1()))
                        .param("phongId", String.valueOf(phongId))
                        .param("dichVuId", String.valueOf(dienId))
                        .param("chiSoCuoi", "160.00")
                        .param("coThayCongTo", "false")
                        .param("xacNhanCanhBao", "true")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.anhCongToId").isNumber())
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.coCanhBao").value(true))
                .andExpect(jsonPath("$.canhBaoTieuThuBatThuong.thongBaoCanhBao").value("Mức tiêu thụ kỳ này là 24.00, trung bình ba kỳ trước là 12.00, gấp 2.00 lần."));

        Long chiSoId = jdbcTemplate.queryForObject(
                "SELECT id FROM CHI_SO_DICH_VU WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?",
                Long.class,
                kyThang8Id,
                phongId,
                dienId
        );
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM XAC_NHAN_CANH_BAO_CHI_SO WHERE chi_so_dich_vu_id = ? AND nguoi_xac_nhan_id = 3",
                Integer.class,
                chiSoId
        )).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ANH_DINH_KEM WHERE doi_tuong_loai = 'CHI_SO_DICH_VU' AND doi_tuong_id = ?",
                Integer.class,
                chiSoId
        )).isEqualTo(1);
    }

    private String xinLienKet(String token, Long anhId) throws Exception {
        MvcResult lienKetResponse = mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").isString())
                .andReturn();
        return objectMapper.readTree(lienKetResponse.getResponse().getContentAsString()).path("url").asText();
    }

    private Long themPhong(Long toaNhaId, String soPhong, int tang) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG (toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, ?, 20.00, 2, 3500000.00, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                tang
        );
    }

    private Long themDichVu(Long toaNhaId, String ten, String donVi) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, 'THEO_CHI_SO', 'CO_DINH', ?, TRUE, TRUE)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                ten,
                donVi
        );
    }

    private Long themKyThanhToan(Long toaNhaId, int nam, int thang, String ngayBatDau, String ngayKetThuc, String trangThai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN (toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                nam,
                thang,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc),
                trangThai
        );
    }

    private Long themNguoiThue(String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE (ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, DATE '1995-01-01', ?, ?, 'TP HCM', 'HOAT_DONG')
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                "012345678901"
        );
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, String ngayBatDau, String ngayKetThuc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG (phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?, ?, 3500000.00, 3500000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngayBatDau),
                java.sql.Date.valueOf(ngayKetThuc)
        );
    }

    private void themHopDongVaDichVu(Long phongId, Long nguoiThueId, Long dichVuId) {
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-05-01", "2026-08-31");
        themDichVuHopDong(hopDongId, dichVuId, "3500.00");
    }

    private void themDichVuHopDong(Long hopDongId, Long dichVuId, String donGia) {
        jdbcTemplate.update(
                """
                        INSERT INTO HOP_DONG_DICH_VU (hop_dong_id, dich_vu_id, don_gia_ap_dung)
                        VALUES (?, ?, ?)
                        """,
                hopDongId,
                dichVuId,
                new java.math.BigDecimal(donGia)
        );
    }

    private Long themChiSo(Long kyId, Long phongId, Long dichVuId, String chiSoDau, String chiSoCuoi, Long nguoiDungId) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO CHI_SO_DICH_VU (
                            ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, nguoi_ghi_id, thoi_diem_ghi
                        )
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        RETURNING id
                        """,
                Long.class,
                kyId,
                phongId,
                dichVuId,
                new java.math.BigDecimal(chiSoDau),
                new java.math.BigDecimal(chiSoCuoi),
                nguoiDungId
        );
    }

    private Long themAnhDinhKemChiSo(Long chiSoId, String khoaLuuTru, String loaiNoiDung, int kichThuoc) throws Exception {
        Files.write(STORAGE_ROOT.resolve(khoaLuuTru), jpeg1x1());
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO ANH_DINH_KEM(doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc)
                        VALUES ('CHI_SO_DICH_VU', ?, ?, NULL, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                chiSoId,
                khoaLuuTru,
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
            return Files.createTempDirectory("prj1-task4-anh-cong-to-");
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

    private static byte[] jpeg1x1() {
        return JPEG_1X1.clone();
    }

    private static byte[] taoAnh1X1(String dinhDang) {
        try {
            BufferedImage bufferedImage = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
            bufferedImage.setRGB(0, 0, 0xFFFFFF);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(bufferedImage, dinhDang, output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Khong tao duoc anh test", exception);
        }
    }

    static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return TEST_ZONE;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }

        void dat(Instant instant) {
            this.instant = instant;
        }
    }

    @TestConfiguration
    static class AnhClockTestConfiguration {
        @Bean
        @Primary
        MutableClock clock() {
            return new MutableClock(TEST_NOW);
        }
    }
}
