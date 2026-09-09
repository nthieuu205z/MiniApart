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
import java.sql.Connection;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
    private javax.sql.DataSource dataSource;

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
        jdbcTemplate.update("DELETE FROM KHOAN_PHAT_SINH");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON");
        jdbcTemplate.update("DELETE FROM HOA_DON");
        jdbcTemplate.update("DELETE FROM NHAN_KHAU_KY");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
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
    void FR_MNT_01_FR_MNT_03_BR_11_CR_012_taoVaHuyYeuCauCapNhatTrangThaiDemCuaPhong() throws Exception {
        Long phongId = themPhong(1L, "900");
        jdbcTemplate.update("UPDATE PHONG SET trang_thai = 'NGUNG', ngung_cho_thue = TRUE WHERE id = ?", phongId);
        String managerToken = login(3L, "0900000003");

        JsonNode response = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện nước")
                        .param("moTa", "Vòi nước rò rỉ")
                        .param("mucDo", "KHAN_CAP")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("MOI_TIEP_NHAN"))
                .andReturn().getResponse().getContentAsString());
        long yeuCauId = response.path("id").longValue();

        assertThat(trangThaiPhong(phongId)).isEqualTo("DANG_SUA");

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/huy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lyDo\":\"Không cần sửa\"}")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_HUY"));

        assertThat(trangThaiPhong(phongId)).isEqualTo("TRONG");
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

    @Test
    void FR_MNT_03_FR_MNT_04_quanLyTiepNhanPhanCongVaThoHoanThanhViecCuaMinh() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê phân công", "0907000110");
        Long phongId = themPhong(1L, "911");
        themHopDongHieuLuc(phongId, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String tenantToken = login(5L, "0900000006");

        JsonNode taoResponse = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .file(anh("phan-cong.png"))
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện nước")
                        .param("moTa", "Vòi nước nhà tắm bị rỉ")
                        .param("mucDo", "GAP")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        long yeuCauId = taoResponse.path("id").longValue();

        String managerToken = login(3L, "0900000003");
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_TIEP_NHAN"))
                .andExpect(jsonPath("$.nguoiTiepNhanId").value(3));

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/phan-cong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thoId\":4}")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_PHAN_CONG"))
                .andExpect(jsonPath("$.nguoiXuLyId").value(4));

        assertThat(jdbcTemplate.queryForMap(
                "SELECT nguoi_tiep_nhan_id, nguoi_xu_ly_id, tiep_nhan_luc, phan_cong_luc FROM YEU_CAU_SUA_CHUA WHERE id = ?",
                yeuCauId
        )).containsEntry("nguoi_tiep_nhan_id", 3L).containsEntry("nguoi_xu_ly_id", 4L);

        String workerToken = login(4L, "0900000004");
        mockMvc.perform(get("/api/tho/viec-cua-toi")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].soPhong").value("911"))
                .andExpect(jsonPath("$[0].moTa").value("Vòi nước nhà tắm bị rỉ"))
                .andExpect(jsonPath("$[0].mucDo").value("GAP"))
                .andExpect(jsonPath("$[0].soDienThoaiLienHe").value("0907000110"))
                .andExpect(jsonPath("$[0].anh[0].id").isNumber());

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/bat-dau-xu-ly")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DANG_XU_LY"));

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/hoan-thanh")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("CHO_XAC_NHAN"));

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/xac-nhan-dong")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_DONG"));

        assertThat(jdbcTemplate.queryForMap(
                "SELECT hanh_dong, gia_tri_truoc, gia_tri_sau FROM NHAT_KY_THAO_TAC WHERE doi_tuong = ? AND hanh_dong = 'XAC_NHAN_DONG_YEU_CAU_SUA_CHUA'",
                "YEU_CAU_SUA_CHUA:" + yeuCauId
        )).containsEntry("gia_tri_truoc", "CHO_XAC_NHAN")
                .containsEntry("gia_tri_sau", "DA_DONG");
    }

    @Test
    void FR_MNT_03_quanLyVaChuXemDuocDanhSachYeuCauTheoPhamViToa() throws Exception {
        Long phongId = themPhong(1L, "915");
        String managerToken = login(3L, "0900000003");

        long yeuCauId = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Danh sách chờ tiếp nhận")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").longValue();

        mockMvc.perform(get("/api/yeu-cau-sua-chua")
                        .param("toaNhaId", "1")
                        .param("trangThai", "MOI_TIEP_NHAN")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].moTa".formatted(yeuCauId)).value("Danh sách chờ tiếp nhận"));

        String ownerToken = login(2L, "0900000002");
        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + yeuCauId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(yeuCauId))
                .andExpect(jsonPath("$.trangThai").value("MOI_TIEP_NHAN"));
    }

    @Test
    void FR_MNT_03_quanLyDuocDongYeuCauSauKhiThoBaoDaSuaXong() throws Exception {
        Long phongId = themPhong(1L, "916");
        String managerToken = login(3L, "0900000003");
        long yeuCauId = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Nước")
                        .param("moTa", "Quản lý xác nhận hoàn tất")
                        .param("mucDo", "GAP")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").longValue();

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/phan-cong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thoId\":4}")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        String workerToken = login(4L, "0900000004");
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/bat-dau-xu-ly")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/hoan-thanh")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/xac-nhan-dong")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_DONG"));
    }

    @Test
    void FR_MNT_03_nguoiThueKhongDuocDongYeuCauKhongPhaiCuaMinh() throws Exception {
        Long phongId = themPhong(1L, "917");
        String managerToken = login(3L, "0900000003");
        long yeuCauId = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Không thuộc người thuê hiện tại")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").longValue();
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET trang_thai = 'CHO_XAC_NHAN' WHERE id = ?", yeuCauId);

        String tenantToken = login(5L, "0900000006");
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/xac-nhan-dong")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_03_FR_MNT_04_thoKhongDuocChamVaoViecCuaThoKhacVaKhongVaoPhanQuyenToa() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê kiểm quyền thợ", "0907000111");
        Long phongId = themPhong(1L, "912");
        themHopDongHieuLuc(phongId, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String tenantToken = login(5L, "0900000006");
        long yeuCauId = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Nước")
                        .param("moTa", "Yêu cầu của thợ khác")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").longValue();

        Long thoKhacId = themTho("Thợ khác", "0907000112");
        String managerToken = login(3L, "0900000003");
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/phan-cong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thoId\":%d}".formatted(thoKhacId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        String workerToken = login(4L, "0900000004");
        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + yeuCauId)
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/bat-dau-xu-ly")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM PHAN_QUYEN_TOA p JOIN NGUOI_DUNG nd ON nd.id = p.nguoi_dung_id WHERE nd.vai_tro = 'THO'",
                Integer.class
        )).isZero();
    }

    @Test
    void FR_MNT_03_FR_MNT_04_saiVaiTroVaSaiTrangThaiKhongTraVeLoiMayChu() throws Exception {
        Long phongId = themPhong(1L, "913");
        String managerToken = login(3L, "0900000003");
        JsonNode taoResponse = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Kiểm tra chuyển trạng thái")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        long yeuCauId = taoResponse.path("id").longValue();

        String systemAdminToken = login(1L, "0900000001");
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value("Không thể chuyển trạng thái yêu cầu sửa chữa"));
    }

    @Test
    void FR_MNT_03_FR_MNT_04_huyYeuCauBatBuocLyDoVaGhiNhatKy() throws Exception {
        Long phongId = themPhong(1L, "914");
        String managerToken = login(3L, "0900000003");
        JsonNode taoResponse = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Nước")
                        .param("moTa", "Huỷ yêu cầu kiểm thử")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        long yeuCauId = taoResponse.path("id").longValue();

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/huy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lyDo\":\"Khách báo nhầm\"}")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_HUY"))
                .andExpect(jsonPath("$.lyDoHuy").value("Khách báo nhầm"));

        assertThat(jdbcTemplate.queryForMap(
                "SELECT hanh_dong, gia_tri_truoc, gia_tri_sau, ly_do FROM NHAT_KY_THAO_TAC WHERE doi_tuong = ? AND hanh_dong = 'HUY_YEU_CAU_SUA_CHUA'",
                "YEU_CAU_SUA_CHUA:" + yeuCauId
        )).containsEntry("gia_tri_truoc", "MOI_TIEP_NHAN")
                .containsEntry("gia_tri_sau", "DA_HUY")
                .containsEntry("ly_do", "Khách báo nhầm");
    }

    @Test
    void FR_MNT_03_haiLanTiepNhanDongThoiChiMotLanThanhCongVaGhiMotNhatKy() throws Exception {
        Long phongId = themPhong(1L, "918");
        String managerToken = login(3L, "0900000003");
        long yeuCauId = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Kiểm tra chuyển tiếp đồng thời")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").longValue();

        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Future<Integer>> futures = new ArrayList<>();
        try (Connection lockConnection = dataSource.getConnection()) {
            lockConnection.setAutoCommit(false);
            try (var statement = lockConnection.prepareStatement(
                    "SELECT id FROM YEU_CAU_SUA_CHUA WHERE id = ? FOR UPDATE")) {
                statement.setLong(1, yeuCauId);
                statement.executeQuery().close();
            }

            for (int index = 0; index < 2; index += 1) {
                futures.add(executor.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                                    .header("Authorization", "Bearer " + managerToken))
                            .andReturn()
                            .getResponse()
                            .getStatus();
                }));
            }
            start.countDown();
            doiHaiPhienCapNhatBiKhoa(yeuCauId);
            lockConnection.commit();

            assertThat(futures.get(0).get(10, TimeUnit.SECONDS)).isIn(200, 409);
            assertThat(futures.get(1).get(10, TimeUnit.SECONDS)).isIn(200, 409);
        } finally {
            executor.shutdownNow();
        }

        List<Integer> statuses = futures.stream()
                .map(future -> layKetQua(future))
                .toList();
        assertThat(statuses).containsExactlyInAnyOrder(200, 409);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM YEU_CAU_SUA_CHUA WHERE id = ?",
                String.class,
                yeuCauId
        )).isEqualTo("DA_TIEP_NHAN");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'TIEP_NHAN_YEU_CAU_SUA_CHUA' AND doi_tuong = ?",
                Integer.class,
                "YEU_CAU_SUA_CHUA:" + yeuCauId
        )).isEqualTo(1);
    }

    @Test
    void FR_MNT_03_chiTaiKhoanTaoYeuCauDuocDongSauKhiLienKetHoSoBiChuyen() throws Exception {
        Long nguoiThueId = themNguoiThue("Người thuê chuyển tài khoản", "0907000191");
        Long phongId = themPhong(1L, "919");
        themHopDongHieuLuc(phongId, nguoiThueId);
        ganTaiKhoanNguoiThue(nguoiThueId);
        String creatorToken = login(5L, "0900000006");
        JsonNode taoResponse = objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .file(anh("relink.png"))
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", "Tài khoản tạo yêu cầu")
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString());
        long yeuCauId = taoResponse.path("id").longValue();
        long anhId = taoResponse.path("anh").get(0).path("id").longValue();
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET trang_thai = 'CHO_XAC_NHAN' WHERE id = ?", yeuCauId);

        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id = 5");
        Long replacementAccountId = themTaiKhoanNguoiThue(
                nguoiThueId,
                "Tài khoản mới của người thuê",
                "0907000192"
        );
        Long unrelatedAccountId = themTaiKhoanNguoiThue(
                null,
                "Tài khoản thuê chưa liên kết",
                "0907000194"
        );
        assertThat(jdbcTemplate.queryForMap("SELECT nguoi_thue_id FROM NGUOI_DUNG WHERE id = 5").get("nguoi_thue_id"))
                .isNull();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT nguoi_thue_id FROM NGUOI_DUNG WHERE id = ?",
                Long.class,
                replacementAccountId
        )).isEqualTo(nguoiThueId);
        try {
            String replacementToken = login(replacementAccountId, "0907000192");
            mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/xac-nhan-dong")
                            .header("Authorization", "Bearer " + replacementToken))
                    .andExpect(status().isForbidden());

            String creatorAfterRelinkToken = login(5L, "0900000006");
            mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/xac-nhan-dong")
                            .header("Authorization", "Bearer " + creatorAfterRelinkToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.trangThai").value("DA_DONG"));
            mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                            .header("Authorization", "Bearer " + replacementToken))
                    .andExpect(status().isForbidden());
            String unrelatedToken = login(unrelatedAccountId, "0907000194");
            mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                            .header("Authorization", "Bearer " + unrelatedToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/anh/" + anhId + "/lien-ket")
                            .header("Authorization", "Bearer " + creatorAfterRelinkToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.url").isNotEmpty());
        } finally {
            jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id = ?", replacementAccountId);
            jdbcTemplate.update("DELETE FROM NGUOI_DUNG WHERE id = ?", replacementAccountId);
            jdbcTemplate.update("DELETE FROM NGUOI_DUNG WHERE id = ?", unrelatedAccountId);
        }
    }

    @Test
    void FR_MNT_03_FR_MNT_04_qthtBiTuChoiMoiEndpointVaThoChiThayViecDuocPhanCong() throws Exception {
        Long phongCuaTho = themPhong(1L, "920");
        Long phongCuaThoKhac = themPhong(1L, "921");
        String managerToken = login(3L, "0900000003");
        long viecCuaTho = taoYeuCauKhongAnh(phongCuaTho, "Việc của thợ hiện tại", managerToken);
        long viecCuaThoKhac = taoYeuCauKhongAnh(phongCuaThoKhac, "Việc của thợ khác", managerToken);
        Long thoKhacId = themTho("Thợ khác trong danh sách", "0907000193");
        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET nguoi_xu_ly_id = ?, trang_thai = 'DA_PHAN_CONG' WHERE id = ?",
                4L,
                viecCuaTho
        );
        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET nguoi_xu_ly_id = ?, trang_thai = 'DA_PHAN_CONG' WHERE id = ?",
                thoKhacId,
                viecCuaThoKhac
        );

        String systemAdminToken = login(1L, "0900000001");
        mockMvc.perform(get("/api/yeu-cau-sua-chua").header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + viecCuaTho)
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaTho + "/tiep-nhan")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaTho + "/phan-cong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thoId\":4}")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaTho + "/bat-dau-xu-ly")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaTho + "/hoan-thanh")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaTho + "/xac-nhan-dong")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaTho + "/huy")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lyDo\":\"Không cần sửa nữa\"}")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/tho/viec-cua-toi")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());

        String workerToken = login(4L, "0900000004");
        JsonNode danhSach = objectMapper.readTree(mockMvc.perform(get("/api/tho/viec-cua-toi")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(danhSach).hasSize(1);
        assertThat(danhSach.get(0).path("id").longValue()).isEqualTo(viecCuaTho);
        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + viecCuaThoKhac)
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + viecCuaThoKhac + "/hoan-thanh")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_06_CR_008_costCreatesOnePendingExtraAndUpdatesItWithAudit() throws Exception {
        String token = login(3L, "0900000003");
        long id = repairWithContract(token);
        cost(id, token, "125000.25", "NGUOI_THUE").andExpect(status().isOk())
                .andExpect(jsonPath("$.chiPhi").value("125000.25"));
        cost(id, token, "150000.50", "NGUOI_THUE").andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KHOAN_PHAT_SINH WHERE nguon_loai='SUA_CHUA' AND nguon_id=?", Integer.class, id)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT so_tien FROM KHOAN_PHAT_SINH WHERE nguon_id=?", java.math.BigDecimal.class, id)).isEqualByComparingTo("150000.50");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong='GHI_CHI_PHI_SUA_CHUA'", Integer.class)).isEqualTo(2);
    }

    @Test
    void FR_MNT_06_CR_008_ownerSwitchAndCancellationRetainVoidHistory() throws Exception {
        String token = login(2L, "0900000002");
        long id = repairWithContract(token);
        cost(id, token, "0", "CHU_NHA").andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KHOAN_PHAT_SINH", Integer.class)).isZero();
        cost(id, token, "125000", "NGUOI_THUE").andExpect(status().isOk());
        cost(id, token, "125000", "CHU_NHA").andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForList("SELECT trang_thai FROM KHOAN_PHAT_SINH", String.class)).containsExactly("VO_HIEU");
        cost(id, token, "200000", "NGUOI_THUE").andExpect(status().isOk());
        cancelRepair(id, token).andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForList("SELECT trang_thai FROM KHOAN_PHAT_SINH", String.class)).containsExactly("VO_HIEU", "VO_HIEU");
        generate(period(8), token);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE loai_khoan='KHOAN_PHAT_SINH'", Integer.class)).isZero();
    }

    @Test
    void FR_MNT_06_CR_008_twoPeriodsConsumeExactlyOnceAndDraftRestoreAllowsChanges() throws Exception {
        String token = login(3L, "0900000003");
        long id = repairWithContract(token);
        cost(id, token, "125000", "NGUOI_THUE").andExpect(status().isOk());
        long first = period(8);
        generate(first, token);
        cost(id, token, "200000", "NGUOI_THUE").andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value(org.hamcrest.Matchers.containsString("hoá đơn")));
        cancelRepair(id, token).andExpect(status().isConflict());
        generate(period(9), token);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CHI_TIET_HOA_DON WHERE loai_khoan='KHOAN_PHAT_SINH'", Integer.class)).isEqualTo(1);
        long invoice = jdbcTemplate.queryForObject("SELECT id FROM HOA_DON WHERE ky_id=?", Long.class, first);
        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + first + "/hoa-don/" + invoice + "/huy")
                .header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content("{\"lyDo\":\"Sai dữ liệu\"}"))
                .andExpect(status().isNoContent());
        cost(id, token, "200000", "NGUOI_THUE").andExpect(status().isOk());
        cancelRepair(id, token).andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM KHOAN_PHAT_SINH", String.class)).isEqualTo("VO_HIEU");
    }

    @Test
    void FR_MNT_06_CR_008_rejectsWrongRolesScopeInvalidAmountsAndLifecycle() throws Exception {
        String token = login(3L, "0900000003");
        long id = repairWithContract(token);
        for (String wrong : List.of(login(1L,"0900000001"), login(4L,"0900000004"), login(5L,"0900000006"))) {
            cost(id, wrong, "1", "CHU_NHA").andExpect(status().isForbidden());
        }
        for (String amount : List.of("-1", "10000000000000", "1.001", "NaN", "", "1e2")) {
            cost(id, token, amount, "NGUOI_THUE").andExpect(status().isBadRequest());
        }
        cost(id, token, "1", "KHAC").andExpect(status().isBadRequest());
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 2)");
        long outside = taoYeuCauKhongAnh(themPhong(2L,"999"), "Ngoài phạm vi", login(2L,"0900000002"));
        cost(outside, token, "1", "CHU_NHA").andExpect(status().isForbidden());
        for (String state : List.of("MOI_TIEP_NHAN", "DA_TIEP_NHAN", "DA_PHAN_CONG", "DA_DONG", "DA_HUY")) {
            jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET trang_thai=? WHERE id=?", state, id);
            cost(id, token, "1", "CHU_NHA").andExpect(status().isConflict());
        }
    }

    @Test
    void FR_MNT_06_CR_008_effective72HoursBlocksEditAndCancelWithoutWritingState() throws Exception {
        String token = login(3L, "0900000003");
        long id = repairWithContract(token);
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET trang_thai='CHO_XAC_NHAN', cho_xac_nhan_luc=? WHERE id=?", java.sql.Timestamp.from(TEST_NOW.minus(Duration.ofHours(72)).plusSeconds(1)), id);
        cost(id, token, "1", "CHU_NHA").andExpect(status().isOk());
        mutableClock.cong(Duration.ofSeconds(2));
        cost(id, token, "2", "CHU_NHA").andExpect(status().isConflict());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + id + "/xac-nhan-dong")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict());
        cancelRepair(id, token).andExpect(status().isConflict());
        assertThat(jdbcTemplate.queryForObject("SELECT trang_thai FROM YEU_CAU_SUA_CHUA WHERE id=?", String.class,id)).isEqualTo("CHO_XAC_NHAN");
    }

    @Test
    void FR_MNT_07_BR_16_expiredConfirmationIsReportedAsClosedOnReadWithoutPersistingIt() throws Exception {
        String token = login(3L, "0900000003");
        long id = repairWithContract(token);
        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET trang_thai='CHO_XAC_NHAN', cho_xac_nhan_luc=? WHERE id=?",
                java.sql.Timestamp.from(TEST_NOW.minus(Duration.ofHours(72)).minusSeconds(1)),
                id
        );

        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + id)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_DONG"))
                .andExpect(jsonPath("$.tenTrangThai").value("Đã đóng"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM YEU_CAU_SUA_CHUA WHERE id=?",
                String.class,
                id
        )).isEqualTo("CHO_XAC_NHAN");
    }

    @Test
    void FR_MNT_07_BR_16_exactly72HoursKeepsConfirmationOnDetailWithoutMutatingStoredState() throws Exception {
        String managerToken = login(3L, "0900000003");
        long id = repairWithContract(managerToken);
        mutableClock.dat(TEST_NOW);
        Instant choXacNhanLuc = mutableClock.instant().minus(Duration.ofHours(72));
        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET trang_thai='CHO_XAC_NHAN', cho_xac_nhan_luc=? WHERE id=?",
                java.sql.Timestamp.from(choXacNhanLuc),
                id
        );

        mockMvc.perform(get("/api/yeu-cau-sua-chua/" + id)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("CHO_XAC_NHAN"))
                .andExpect(jsonPath("$.tenTrangThai").value("Chờ xác nhận"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM YEU_CAU_SUA_CHUA WHERE id=?",
                String.class,
                id
        )).isEqualTo("CHO_XAC_NHAN");
    }

    @Test
    void FR_MNT_07_BR_16_effectiveStatusFiltersManagerAndWorkerLists() throws Exception {
        String managerToken = login(3L, "0900000003");
        long id = repairWithContract(managerToken);
        jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET nguoi_xu_ly_id=4, trang_thai='CHO_XAC_NHAN', cho_xac_nhan_luc=? WHERE id=?",
                java.sql.Timestamp.from(TEST_NOW.minus(Duration.ofHours(72)).minusSeconds(1)),
                id
        );

        JsonNode closed = objectMapper.readTree(mockMvc.perform(get("/api/yeu-cau-sua-chua")
                        .param("trangThai", "DA_DONG")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(closed).hasSize(1);
        assertThat(closed.get(0).path("id").longValue()).isEqualTo(id);

        JsonNode awaiting = objectMapper.readTree(mockMvc.perform(get("/api/yeu-cau-sua-chua")
                        .param("trangThai", "CHO_XAC_NHAN")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(awaiting).isEmpty();

        JsonNode workerList = objectMapper.readTree(mockMvc.perform(get("/api/tho/viec-cua-toi")
                        .header("Authorization", "Bearer " + login(4L, "0900000004")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(workerList).isEmpty();
    }

    @Test
    void FR_MNT_06_CR_008_keepsOriginalContractAfterRoomChangesOccupant() throws Exception {
        String token = login(3L,"0900000003");
        long id = repairWithContract(token);
        long original = jdbcTemplate.queryForObject("SELECT id FROM HOP_DONG", Long.class);
        long room = jdbcTemplate.queryForObject("SELECT phong_id FROM HOP_DONG WHERE id=?", Long.class, original);
        jdbcTemplate.update("UPDATE HOP_DONG SET trang_thai='DA_THANH_LY', ngay_ket_thuc=DATE '2040-08-15' WHERE id=?", original);
        jdbcTemplate.update("INSERT INTO HOP_DONG(phong_id,nguoi_thue_id,ngay_bat_dau,ngay_ket_thuc,gia_thue,tien_coc,so_ngay_bao_truoc,trang_thai) VALUES (?,?,DATE '2040-08-16',DATE '2041-08-15',3000000,3000000,30,'HIEU_LUC')",room,themNguoiThue("Người mới","0907000992"));
        mutableClock.cong(Duration.ofDays(2));
        token = login(3L,"0900000003");
        cost(id, token, "125000", "NGUOI_THUE").andExpect(status().isOk());
        assertThat(jdbcTemplate.queryForObject("SELECT hop_dong_id FROM KHOAN_PHAT_SINH",Long.class)).isEqualTo(original);
        long empty = taoYeuCauKhongAnh(themPhong(1L,"998"),"Phòng trống",token);
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET trang_thai='DANG_XU_LY' WHERE id=?",empty);
        cost(empty, token,"1","NGUOI_THUE").andExpect(status().isConflict());
        cost(empty, token,"1","CHU_NHA").andExpect(status().isOk());
    }

    private long repairWithContract(String token) throws Exception {
        long room = themPhong(1L,"997");
        themHopDongHieuLuc(room,themNguoiThue("Người thuê chi phí","0907000991"));
        long id = taoYeuCauKhongAnh(room,"Sửa vòi nước",token);
        jdbcTemplate.update("UPDATE YEU_CAU_SUA_CHUA SET trang_thai='DANG_XU_LY' WHERE id=?",id);
        return id;
    }

    private org.springframework.test.web.servlet.ResultActions cost(long id,String token,String amount,String payer) throws Exception {
        return mockMvc.perform(put("/api/yeu-cau-sua-chua/"+id+"/chi-phi").header("Authorization","Bearer "+token)
                .contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(java.util.Map.of("chiPhi",amount,"benChiuChiPhi",payer))));
    }

    private org.springframework.test.web.servlet.ResultActions cancelRepair(long id,String token) throws Exception {
        return mockMvc.perform(post("/api/yeu-cau-sua-chua/"+id+"/huy").header("Authorization","Bearer "+token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"lyDo\":\"Không cần sửa\"}"));
    }

    private long period(int month) {
        LocalDate start = LocalDate.of(2040,month,1);
        return jdbcTemplate.queryForObject("INSERT INTO KY_THANH_TOAN(toa_nha_id,nam,thang,ngay_bat_dau,ngay_ket_thuc,trang_thai) VALUES (1,2040,?,?,?,'DA_CHOT') RETURNING id",Long.class,month,start,start.plusMonths(1).minusDays(1));
    }

    private void generate(long period,String token) throws Exception {
        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/"+period+"/hoa-don/tao-hang-loat").header("Authorization","Bearer "+token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.soHoaDonTaoMoi").value(1));
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

    private String trangThaiPhong(Long phongId) {
        return jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM PHONG WHERE id = ?",
                String.class,
                phongId
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

    private Long themTaiKhoanNguoiThue(Long nguoiThueId, String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den, nguoi_thue_id
                        ) VALUES (?, ?, ?, 'NGUOI_THUE', 'HOAT_DONG', 0, 0, NULL, NULL, ?)
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                passwordHasher.hash("tenant-seed-password"),
                nguoiThueId
        );
    }

    private Long themTho(String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_DUNG(
                            ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai,
                            phien_ban_token, so_lan_sai, lan_sai_dau_tien, khoa_den, nguoi_thue_id
                        ) VALUES (?, ?, ?, 'THO', 'HOAT_DONG', 0, 0, NULL, NULL, NULL)
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                passwordHasher.hash("worker-seed-password")
        );
    }

    private long taoYeuCauKhongAnh(Long phongId, String moTa, String token) throws Exception {
        return objectMapper.readTree(mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện")
                        .param("moTa", moTa)
                        .param("mucDo", "THUONG")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").longValue();
    }

    private void doiHaiPhienCapNhatBiKhoa(long yeuCauId) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            Integer soPhien = jdbcTemplate.queryForObject(
                    """
                            SELECT COUNT(*)
                            FROM pg_stat_activity
                            WHERE wait_event_type = 'Lock'
                              AND query ILIKE '%UPDATE YEU_CAU_SUA_CHUA%'
                            """,
                    Integer.class
            );
            if (soPhien != null && soPhien >= 2) {
                return;
            }
            Thread.sleep(20);
        }
        throw new AssertionError("Không quan sát được hai phiên cập nhật cùng chờ khoá yêu cầu " + yeuCauId);
    }

    private int layKetQua(Future<Integer> future) {
        try {
            return future.get(10, TimeUnit.SECONDS);
        } catch (Exception exception) {
            throw new AssertionError("Lời gọi đồng thời không hoàn tất", exception);
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
