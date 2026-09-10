package com.prj1.ccm.thongbao;

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
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(ThongBaoChungIntegrationTest.NotificationClockTestConfiguration.class)
class ThongBaoChungIntegrationTest {
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
        registry.add("app.anh.link-secret", () -> "slice-08-common-notification-secret");
        registry.add("app.anh.link-ttl-seconds", () -> 1_200);
        registry.add("app.auth.token-ttl-seconds", () -> 86_400);
    }

    @BeforeEach
    void resetDatabase() {
        mutableClock.dat(TEST_NOW);
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS tg_test_fail_common_fanout ON THONG_BAO");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS test_fail_common_fanout()");
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS tg_test_fail_common_attachment ON ANH_DINH_KEM");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS test_fail_common_attachment()");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL");
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
        jdbcTemplate.update("DELETE FROM THONG_BAO");
        xoaNeuBangTonTai("THONG_BAO_CHUNG");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM NGUOI_DUNG WHERE id > 5");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1), (2, 2), (3, 1)");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET trang_thai = 'HOAT_DONG', phien_ban_token = 0 WHERE id IN (1, 2, 3, 4, 5)");
    }

    @Test
    void FR_NTF_02_guiTheoTangSnapshotTaiKhoanHieuLucBaoPhongThieuVaKhongNhanDoi() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long recipientId = taoNguoiThueCoTaiKhoan("Người nhận", "0908000001", 1L, "801", 8, "HOAT_DONG", "2040-01-01");
        taoNguoiThueKhongTaiKhoan("Chưa có tài khoản", 1L, "802", 8, "2040-01-01");
        taoNguoiThueCoTaiKhoan("Tài khoản khoá", "0908000002", 1L, "803", 8, "BI_KHOA", "2040-01-01");
        taoNguoiThueCoTaiKhoan("Ngoài tầng", "0908000003", 1L, "701", 7, "HOAT_DONG", "2040-01-01");
        taoNguoiThueCoTaiKhoan("Chưa vào ở", "0908000004", 1L, "804", 8, "HOAT_DONG", "2040-09-01");
        String idempotencyKey = UUID.randomUUID().toString();
        String payload = payloadTheoTang(1L, 8, "Vệ sinh hành lang", "Dọn đồ trước 20 giờ.");

        mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoiNhan").value(1))
                .andExpect(jsonPath("$.soPhongNhan").value(1))
                .andExpect(jsonPath("$.soPhongKhongCoTaiKhoan").value(2));

        MvcResult firstSend = guiJson(managerToken, idempotencyKey, payload)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maThamChieu").isString())
                .andExpect(jsonPath("$.soNguoiNhan").value(1))
                .andExpect(jsonPath("$.soPhongNhan").value(1))
                .andExpect(jsonPath("$.soPhongKhongCoTaiKhoan").value(2))
                .andReturn();
        String batchReference = objectMapper.readTree(firstSend.getResponse().getContentAsString()).path("maThamChieu").textValue();

        guiJson(managerToken, idempotencyKey, payload)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maThamChieu").value(batchReference))
                .andExpect(jsonPath("$.soNguoiNhan").value(1));

        Long laterRecipientId = taoNguoiThueCoTaiKhoan("Vào sau", "0908000005", 1L, "805", 8, "HOAT_DONG", "2040-01-01");
        String recipientToken = login(recipientId, "0908000001");
        String laterRecipientToken = login(laterRecipientId, "0908000005");
        jdbcTemplate.update("UPDATE HOP_DONG SET trang_thai = 'DA_THANH_LY' WHERE nguoi_thue_id = (SELECT nguoi_thue_id FROM NGUOI_DUNG WHERE id = ?)", recipientId);

        mockMvc.perform(get("/api/thong-bao").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao", hasSize(1)))
                .andExpect(jsonPath("$.thongBao[0].maThamChieu").isString())
                .andExpect(jsonPath("$.thongBao[0].id").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].tieuDe").value("Vệ sinh hành lang"));
        mockMvc.perform(get("/api/thong-bao").header("Authorization", "Bearer " + laterRecipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao", hasSize(0)));

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO_CHUNG", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO WHERE doi_tuong_loai = 'THONG_BAO_CHUNG'", Integer.class)).isEqualTo(1);
    }

    @Test
    void FR_NTF_02_phamViPhongChiNhanDungPhongDuocChon() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long selectedAccount = taoNguoiThueCoTaiKhoan("Phòng được chọn", "0908000011", 1L, "811", 8, "HOAT_DONG", "2040-01-01");
        taoNguoiThueCoTaiKhoan("Phòng không chọn", "0908000012", 1L, "812", 8, "HOAT_DONG", "2040-01-01");
        Long selectedRoom = jdbcTemplate.queryForObject("SELECT nguoi_thue_id FROM NGUOI_DUNG WHERE id = ?", Long.class, selectedAccount);
        selectedRoom = jdbcTemplate.queryForObject("SELECT phong_id FROM HOP_DONG WHERE nguoi_thue_id = ?", Long.class, selectedRoom);
        String payload = """
                {"toaNhaId":1,"phamVi":"PHONG","phongIds":[%d],"tieuDe":"Kiểm tra phòng","noiDung":"Kiểm tra thiết bị trong phòng.","hetHanLuc":"2040-08-20T03:00:00Z"}
                """.formatted(selectedRoom);

        mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoiNhan").value(1))
                .andExpect(jsonPath("$.soPhongNhan").value(1));

        guiJson(managerToken, UUID.randomUUID().toString(), payload)
                .andExpect(status().isCreated());
        assertThat(jdbcTemplate.queryForObject("SELECT nguoi_nhan_id FROM THONG_BAO", Long.class)).isEqualTo(selectedAccount);
    }

    @Test
    void FR_NTF_02_tuChoiDuLieuTrongHetHanVaPhamViMauThuanBangTiengViet() throws Exception {
        String managerToken = login(3L, "0900000003");
        String blankPayload = """
                {"toaNhaId":1,"tieuDe":"   ","noiDung":"   ","hetHanLuc":"2040-08-15T03:00:00Z"}
                """;

        mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(blankPayload)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Tiêu đề thông báo không được để trống"));

        String conflictingScope = """
                {"toaNhaId":1,"tang":8,"phongIds":[1],"tieuDe":"Thông báo","noiDung":"Nội dung hợp lệ.","hetHanLuc":"2040-08-20T03:00:00Z"}
                """;
        guiJson(managerToken, UUID.randomUUID().toString(), conflictingScope)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Chỉ được chọn một phạm vi: toàn toà, tầng hoặc phòng"));

        String expiredPayload = blankPayload.replace("\"   \"", "\"Thông báo\"")
                .replaceFirst("\"   \"", "\"Nội dung hợp lệ.\"");
        guiJson(managerToken, UUID.randomUUID().toString(), expiredPayload)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Hạn kết thúc phải sau thời điểm gửi"));
    }

    @Test
    void FR_NTF_02_phamViPhongRongKhongDuocRoiThanhToaNha() throws Exception {
        String managerToken = login(3L, "0900000003");
        String payload = """
                {"toaNhaId":1,"phamVi":"PHONG","phongIds":[],"tieuDe":"Thông báo","noiDung":"Nội dung hợp lệ.","hetHanLuc":"2040-08-20T03:00:00Z"}
                """;

        guiJson(managerToken, UUID.randomUUID().toString(), payload)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Phải chọn ít nhất một phòng"));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO_CHUNG", Integer.class)).isZero();
    }

    @Test
    void FR_NTF_02_tuChoiPhongKhongThuocToaVaThieuKhoaChongLap() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long account = taoNguoiThueCoTaiKhoan("Toà khác", "0908000021", 2L, "211", 2, "HOAT_DONG", "2040-01-01");
        Long tenant = jdbcTemplate.queryForObject("SELECT nguoi_thue_id FROM NGUOI_DUNG WHERE id = ?", Long.class, account);
        Long room = jdbcTemplate.queryForObject("SELECT phong_id FROM HOP_DONG WHERE nguoi_thue_id = ?", Long.class, tenant);
        String payload = """
                {"toaNhaId":1,"phamVi":"PHONG","phongIds":[%d],"tieuDe":"Thông báo","noiDung":"Nội dung hợp lệ.","hetHanLuc":"2040-08-20T03:00:00Z"}
                """.formatted(room);

        guiJson(managerToken, UUID.randomUUID().toString(), payload)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Phòng được chọn không thuộc toà nhà"));
        mockMvc.perform(post("/api/thong-bao/chung")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadTheoTang(1L, 8, "Thông báo", "Nội dung hợp lệ."))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.thongBao").value("Thiếu khoá chống gửi lặp"));
    }

    @Test
    void FR_NTF_02_chiChuQuanLyDungToaMoiGuiVaXemTruocDuoc() throws Exception {
        String tenantToken = login(5L, "0900000006");
        String workerToken = login(4L, "0900000004");
        String adminToken = login(1L, "0900000001");
        String ownerToken = login(2L, "0900000002");
        String managerToken = login(3L, "0900000003");
        String payload = payloadTheoTang(1L, 8, "Thông báo", "Nội dung hợp lệ.");

        mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/thong-bao/chung")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("Idempotency-Key", UUID.randomUUID())
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isForbidden());
        for (String token : List.of(workerToken, adminToken)) {
            mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
        mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload.replace("\"toaNhaId\":1", "\"toaNhaId\":2"))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/thong-bao/chung")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload.replace("\"toaNhaId\":1", "\"toaNhaId\":2"))
                        .header("Idempotency-Key", UUID.randomUUID())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/thong-bao/chung/xem-truoc")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
    }

    @Test
    void FR_NTF_02_khoaChongLapDongThoiChiTaoMotLan() throws Exception {
        String managerToken = login(3L, "0900000003");
        taoNguoiThueCoTaiKhoan("Người nhận một", "0908000031", 1L, "831", 8, "HOAT_DONG", "2040-01-01");
        taoNguoiThueCoTaiKhoan("Người nhận hai", "0908000032", 1L, "832", 8, "HOAT_DONG", "2040-01-01");
        String key = UUID.randomUUID().toString();
        String payload = payloadTheoTang(1L, 8, "Thông báo đồng thời", "Chỉ được gửi một lần.");
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> futures = List.of(
                    executor.submit(() -> guiDongThoi(managerToken, key, payload, start)),
                    executor.submit(() -> guiDongThoi(managerToken, key, payload, start))
            );
            start.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> future : futures) {
                statuses.add(future.get());
            }
            Collections.sort(statuses);
            assertThat(statuses).containsExactly(200, 201);
        } finally {
            executor.shutdownNow();
        }

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO_CHUNG", Integer.class)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO WHERE doi_tuong_loai = 'THONG_BAO_CHUNG'", Integer.class)).isEqualTo(2);
    }

    @Test
    void FR_NTF_02_fanOutLoiKhongDeLaiThongBaoMotPhan() throws Exception {
        String managerToken = login(3L, "0900000003");
        taoNguoiThueCoTaiKhoan("Người nhận trước lỗi", "0908000041", 1L, "841", 8, "HOAT_DONG", "2040-01-01");
        Long failingRecipient = taoNguoiThueCoTaiKhoan("Người nhận gây lỗi", "0908000042", 1L, "842", 8, "HOAT_DONG", "2040-01-01");
        jdbcTemplate.execute("""
                CREATE FUNCTION test_fail_common_fanout() RETURNS trigger AS $$
                BEGIN
                    IF NEW.doi_tuong_loai = 'THONG_BAO_CHUNG' AND NEW.nguoi_nhan_id = %d THEN
                        RAISE EXCEPTION 'test fanout failure';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
                """.formatted(failingRecipient));
        jdbcTemplate.execute("""
                CREATE TRIGGER tg_test_fail_common_fanout
                BEFORE INSERT ON THONG_BAO
                FOR EACH ROW EXECUTE FUNCTION test_fail_common_fanout()
                """);

        assertThatThrownBy(() -> guiJson(
                managerToken,
                UUID.randomUUID().toString(),
                payloadTheoTang(1L, 8, "Thông báo lỗi", "Không được lưu một phần.")
        )).hasMessageContaining("test fanout failure");

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO_CHUNG", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO WHERE doi_tuong_loai = 'THONG_BAO_CHUNG'", Integer.class)).isZero();
    }

    @Test
    void FR_NTF_02_anhChiCapLienKetChoNguoiNhanHoacNguoiGuiVaHetHanSauToiDa15Phut() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long recipientId = taoNguoiThueCoTaiKhoan("Người nhận ảnh", "0908000051", 1L, "851", 8, "HOAT_DONG", "2040-01-01");
        Long outsiderId = taoNguoiThueCoTaiKhoan("Người ngoài phạm vi", "0908000052", 1L, "751", 7, "HOAT_DONG", "2040-01-01");
        String recipientToken = login(recipientId, "0908000051");
        String outsiderToken = login(outsiderId, "0908000052");

        MockMultipartFile image = new MockMultipartFile("tep", "notice.png", "image/png", PNG_1X1);
        mockMvc.perform(multipart("/api/thong-bao/chung")
                        .file(image)
                        .param("toaNhaId", "1")
                        .param("tang", "8")
                        .param("tieuDe", "Ảnh lịch cắt nước")
                        .param("noiDung", "Xem sơ đồ khu vực bị ảnh hưởng.")
                        .param("hetHanLuc", "2040-08-20T03:00:00Z")
                        .header("Idempotency-Key", UUID.randomUUID())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated());

        String inbox = mockMvc.perform(get("/api/thong-bao").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thongBao[0].anh", hasSize(1)))
                .andReturn().getResponse().getContentAsString();
        long imageId = objectMapper.readTree(inbox).path("thongBao").get(0).path("anh").get(0).path("id").longValue();

        mockMvc.perform(get("/api/anh/" + imageId + "/lien-ket").header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/anh/" + imageId + "/lien-ket").header("Authorization", "Bearer " + login(2L, "0900000002")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/anh/" + imageId + "/lien-ket"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/anh/" + imageId + "/lien-ket").header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        String linkResponse = mockMvc.perform(get("/api/anh/" + imageId + "/lien-ket")
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String signedUrl = objectMapper.readTree(linkResponse).path("url").textValue();
        long expiry = Long.parseLong(signedUrl.replaceFirst(".*hetHan=([0-9]+).*", "$1"));
        assertThat(expiry).isEqualTo(TEST_NOW.getEpochSecond() + 900);

        mockMvc.perform(get(signedUrl)
                        .header("Authorization", "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(signedUrl)
                        .header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk());
        mockMvc.perform(get(signedUrl))
                .andExpect(status().isForbidden());
        mutableClock.cong(Duration.ofMinutes(15));
        mockMvc.perform(get(signedUrl))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.thongBao").value("Liên kết ảnh không hợp lệ hoặc đã hết hạn"));
    }

    @Test
    void FR_NTF_02_thongBaoHetHanChuyenLuuTruVaKhongTinhBadgeChuaDoc() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long recipientId = taoNguoiThueCoTaiKhoan("Người nhận lưu trữ", "0908000061", 1L, "861", 8, "HOAT_DONG", "2040-01-01");
        String recipientToken = login(recipientId, "0908000061");
        String payload = payloadTheoTang(1L, 8, "Thông báo ngắn hạn", "Sẽ được lưu trữ sau một giờ.")
                .replace("2040-08-20T03:00:00Z", "2040-08-15T04:00:00Z");
        guiJson(managerToken, UUID.randomUUID().toString(), payload).andExpect(status().isCreated());

        mockMvc.perform(get("/api/thong-bao").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao", hasSize(1)));
        mutableClock.cong(Duration.ofHours(1));
        mockMvc.perform(get("/api/thong-bao").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao", hasSize(0)));
        mockMvc.perform(get("/api/thong-bao/luu-tru").header("Authorization", "Bearer " + recipientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao", hasSize(1)))
                .andExpect(jsonPath("$.thongBao[0].tieuDe").value("Thông báo ngắn hạn"));
        mockMvc.perform(get("/api/thong-bao/luu-tru"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/thong-bao/luu-tru").header("Authorization", "Bearer " + login(1L, "0900000001")))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_NTF_02_dungKhoaCuVoiNoiDungKhacBiTuChoi() throws Exception {
        String managerToken = login(3L, "0900000003");
        taoNguoiThueCoTaiKhoan("Người nhận", "0908000071", 1L, "871", 8, "HOAT_DONG", "2040-01-01");
        String key = UUID.randomUUID().toString();
        String payload = payloadTheoTang(1L, 8, "Thông báo ban đầu", "Nội dung ban đầu.");
        guiJson(managerToken, key, payload).andExpect(status().isCreated());

        guiJson(managerToken, key, payload.replace("Nội dung ban đầu.", "Nội dung đã đổi."))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value("Khoá chống gửi lặp đã được dùng cho yêu cầu khác"));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO_CHUNG", Integer.class)).isEqualTo(1);
    }

    @Test
    void FR_NTF_02_dungKhoaCuVoiAnhKhacBiTuChoi() throws Exception {
        String managerToken = login(3L, "0900000003");
        taoNguoiThueCoTaiKhoan("Người nhận ảnh khác", "0908000072", 1L, "872", 8, "HOAT_DONG", "2040-01-01");
        String key = UUID.randomUUID().toString();
        MockMultipartFile firstImage = new MockMultipartFile("tep", "first.png", "image/png", PNG_1X1);
        byte[] differentImageBytes = PNG_1X1.clone();
        differentImageBytes[differentImageBytes.length - 1] ^= 1;
        MockMultipartFile secondImage = new MockMultipartFile("tep", "second.png", "image/png", differentImageBytes);

        mockMvc.perform(multipart("/api/thong-bao/chung")
                        .file(firstImage)
                        .param("toaNhaId", "1")
                        .param("phamVi", "TANG")
                        .param("tang", "8")
                        .param("tieuDe", "Ảnh thông báo")
                        .param("noiDung", "Nội dung")
                        .param("hetHanLuc", "2040-08-20T03:00:00Z")
                        .header("Idempotency-Key", key)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isCreated());

        mockMvc.perform(multipart("/api/thong-bao/chung")
                        .file(secondImage)
                        .param("toaNhaId", "1")
                        .param("phamVi", "TANG")
                        .param("tang", "8")
                        .param("tieuDe", "Ảnh thông báo")
                        .param("noiDung", "Nội dung")
                        .param("hetHanLuc", "2040-08-20T03:00:00Z")
                        .header("Idempotency-Key", key)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value("Khoá chống gửi lặp đã được dùng cho yêu cầu khác"));
    }

    @Test
    void FR_NTF_02_rollbackAnhKhongDeLaiFileRiengTuMoCoi() throws Exception {
        String managerToken = login(3L, "0900000003");
        taoNguoiThueCoTaiKhoan("Người nhận lỗi ảnh", "0908000073", 1L, "873", 8, "HOAT_DONG", "2040-01-01");
        jdbcTemplate.execute("""
                CREATE FUNCTION test_fail_common_attachment() RETURNS trigger AS $$
                BEGIN
                    IF NEW.doi_tuong_loai = 'THONG_BAO_CHUNG' THEN
                        RAISE EXCEPTION 'test attachment failure';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
                """);
        jdbcTemplate.execute("""
                CREATE TRIGGER tg_test_fail_common_attachment
                BEFORE INSERT ON ANH_DINH_KEM
                FOR EACH ROW EXECUTE FUNCTION test_fail_common_attachment()
                """);
        long fileCountBefore = demTepLuuTru();

        assertThatThrownBy(() -> mockMvc.perform(multipart("/api/thong-bao/chung")
                        .file(new MockMultipartFile("tep", "notice.png", "image/png", PNG_1X1))
                        .param("toaNhaId", "1")
                        .param("phamVi", "TANG")
                        .param("tang", "8")
                        .param("tieuDe", "Ảnh lỗi")
                        .param("noiDung", "Không được lưu file mồ côi.")
                        .param("hetHanLuc", "2040-08-20T03:00:00Z")
                        .header("Idempotency-Key", UUID.randomUUID())
                        .header("Authorization", "Bearer " + managerToken)).andReturn())
                .hasMessageContaining("test attachment failure");

        assertThat(demTepLuuTru()).isEqualTo(fileCountBefore);
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO_CHUNG", Integer.class)).isZero();
    }

    private org.springframework.test.web.servlet.ResultActions guiJson(String token, String key, String payload) throws Exception {
        return mockMvc.perform(post("/api/thong-bao/chung")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("Idempotency-Key", key)
                .header("Authorization", "Bearer " + token));
    }

    private int guiDongThoi(String token, String key, String payload, CountDownLatch start) throws Exception {
        start.await();
        return guiJson(token, key, payload).andReturn().getResponse().getStatus();
    }

    private String payloadTheoTang(Long toaNhaId, int tang, String tieuDe, String noiDung) {
        return """
                {"toaNhaId":%d,"phamVi":"TANG","tang":%d,"tieuDe":"%s","noiDung":"%s","hetHanLuc":"2040-08-20T03:00:00Z"}
                """.formatted(toaNhaId, tang, tieuDe, noiDung);
    }

    private Long taoNguoiThueCoTaiKhoan(
            String ten,
            String phone,
            Long toaNhaId,
            String soPhong,
            int tang,
            String trangThaiTaiKhoan,
            String ngayBatDau
    ) {
        Long tenant = taoNguoiThue(ten);
        Long account = jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_DUNG(ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, nguoi_thue_id)
                        VALUES (?, ?, 'placeholder', 'NGUOI_THUE', ?, ?)
                        RETURNING id
                        """,
                Long.class,
                ten,
                phone,
                trangThaiTaiKhoan,
                tenant
        );
        taoHopDong(tenant, toaNhaId, soPhong, tang, ngayBatDau);
        return account;
    }

    private void taoNguoiThueKhongTaiKhoan(String ten, Long toaNhaId, String soPhong, int tang, String ngayBatDau) {
        taoHopDong(taoNguoiThue(ten), toaNhaId, soPhong, tang, ngayBatDau);
    }

    private Long taoNguoiThue(String ten) {
        String suffix = Integer.toUnsignedString(UUID.randomUUID().hashCode());
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, DATE '1995-01-01', ?, ?, 'Hà Nội', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class,
                ten,
                "09" + suffix,
                "079" + suffix
        );
    }

    private void taoHopDong(Long tenantId, Long toaNhaId, String soPhong, int tang, String ngayBatDau) {
        Long room = jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, ?, 25, 3, 3000000, 'Studio', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong,
                tang
        );
        jdbcTemplate.update(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, ?::date, DATE '2040-12-31', 3000000, 3000000, 30, 'HIEU_LUC')
                        """,
                room,
                tenantId,
                ngayBatDau
        );
    }

    private String login(Long id, String phone) throws Exception {
        String password = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?", passwordHasher.hash(password), id);
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(phone, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        return body.substring(start, body.indexOf('"', start));
    }

    private void xoaNeuBangTonTai(String table) {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?)",
                Boolean.class,
                table.toLowerCase()
        );
        if (Boolean.TRUE.equals(exists)) {
            jdbcTemplate.execute("DELETE FROM " + table);
        }
    }

    private static Path taoThuMucTam() {
        try {
            return Files.createTempDirectory("miniapart-common-notification-");
        } catch (IOException exception) {
            throw new IllegalStateException("Khong tao duoc thu muc anh kiem thu", exception);
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

    private long demTepLuuTru() {
        try (var paths = Files.walk(STORAGE_ROOT)) {
            return paths.filter(Files::isRegularFile).count();
        } catch (IOException exception) {
            throw new IllegalStateException("Khong dem duoc tep kiem thu", exception);
        }
    }

    @TestConfiguration
    static class NotificationClockTestConfiguration {
        @Bean
        MutableClock mutableClock() {
            return new MutableClock(TEST_NOW, TEST_ZONE);
        }

        @Bean
        @Primary
        Clock notificationTestClock(MutableClock mutableClock) {
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
