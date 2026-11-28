package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.support.TestPostgres;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest(properties = {"app.activation.delivery.local-enabled=true", "app.nhac-tien.enabled=false"})
@ActiveProfiles("local")
@AutoConfigureMockMvc
class AuthAndAppointmentWorkflowIntegrationTest {
    @Container static final TestPostgres POSTGRES = new TestPostgres("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordHasher hasher;
    @Autowired NguoiDungRepository users;
    @Autowired JwtTokenService tokens;
    @Autowired KichHoatTaiKhoanDelivery delivery;
    @Autowired DatLaiMatKhauService resetService;
    @Autowired ObjectMapper json;
    @Autowired java.time.Clock clock;
    private String admin;
    private String manager;
    private String tenant;
    private Long managerId;

    @BeforeEach void setup() {
        jdbc.update("DELETE FROM LICH_HEN_XEM_PHONG");
        jdbc.update("DELETE FROM DAT_LAI_MAT_KHAU");
        jdbc.update("DELETE FROM LAN_DANG_NHAP_SAI");
        jdbc.update("DELETE FROM THEO_DOI_DANG_NHAP");
        for (String phone : List.of("0999000001", "0999000002", "0999000003")) {
            users.findBySoDienThoai(phone).ifPresent(user -> {
                jdbc.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id=?", user.id());
                jdbc.update("DELETE FROM NGUOI_DUNG WHERE id=?", user.id());
            });
        }
        admin = create("0999000001", "QTHT");
        manager = create("0999000002", "QUAN_LY");
        tenant = create("0999000003", "NGUOI_THUE");
        managerId = users.findBySoDienThoai("0999000002").orElseThrow().id();
        jdbc.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id,toa_nha_id) VALUES (?,1)", managerId);
        jdbc.update("INSERT INTO LICH_HEN_XEM_PHONG(ho_ten,so_dien_thoai,toa_nha_id,thoi_gian_hen) VALUES ('Khách A','0999000101',1,CURRENT_TIMESTAMP), ('Khách B','0999000102',2,CURRENT_TIMESTAMP)");
    }

    @Test void resetIsOneTimePersistsAttemptLimitAndRevokesExistingToken() throws Exception {
        mvc.perform(post("/api/auth/quen-mat-khau").contentType(MediaType.APPLICATION_JSON).content("{\"soDienThoai\":\"0999000002\"}")).andExpect(status().isAccepted());
        mvc.perform(get("/api/auth/local/ma-xac-thuc").param("soDienThoai", "0999000002").header("Authorization", "Bearer " + manager)).andExpect(status().isForbidden());
        String body = mvc.perform(get("/api/auth/local/ma-xac-thuc").param("soDienThoai", "0999000002").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store")).andReturn().getResponse().getContentAsString();
        String otp = json.readTree(body).path("datLaiMatKhau").asText();
        assertThat(otp).matches("[0-9]{6}");
        String reset = "{\"soDienThoai\":\"0999000002\",\"maXacThuc\":\"" + otp + "\",\"matKhau\":\"mat-khau-moi-123\"}";
        mvc.perform(post("/api/auth/dat-lai-mat-khau").contentType(MediaType.APPLICATION_JSON).content(reset)).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/dat-lai-mat-khau").contentType(MediaType.APPLICATION_JSON).content(reset)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + manager)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"soDienThoai\":\"0999000002\",\"matKhau\":\"mat-khau-moi-123\"}")).andExpect(status().isOk());
    }

    @Test void wrongOtpAttemptsCommitAndBlockTheCorrectCode() throws Exception {
        mvc.perform(post("/api/auth/quen-mat-khau").contentType(MediaType.APPLICATION_JSON).content("{\"soDienThoai\":\"0999000002\"}")).andExpect(status().isAccepted());
        String otp = ((LocalMaXacThucDelivery) delivery).lay("0999000002").datLaiMatKhau();
        String wrong = "000000".equals(otp) ? "000001" : "000000";
        for (int i=0; i<5; i++) mvc.perform(post("/api/auth/dat-lai-mat-khau").contentType(MediaType.APPLICATION_JSON)
                .content("{\"soDienThoai\":\"0999000002\",\"maXacThuc\":\"" + wrong + "\",\"matKhau\":\"mat-khau-moi-123\"}")).andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("SELECT so_lan_thu FROM DAT_LAI_MAT_KHAU WHERE nguoi_dung_id=?", Integer.class, managerId)).isEqualTo(5);
        mvc.perform(post("/api/auth/dat-lai-mat-khau").contentType(MediaType.APPLICATION_JSON)
                .content("{\"soDienThoai\":\"0999000002\",\"maXacThuc\":\"" + otp + "\",\"matKhau\":\"mat-khau-moi-123\"}")).andExpect(status().isBadRequest());
    }

    @Test void concurrentConfirmationConsumesTheCodeExactlyOnce() throws Exception {
        resetService.yeuCau("0999000002");
        String otp = ((LocalMaXacThucDelivery) delivery).lay("0999000002").datLaiMatKhau();
        var start = new java.util.concurrent.CountDownLatch(1);
        try (var workers = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Boolean> attempt = () -> {
                start.await();
                try { resetService.xacNhan("0999000002", otp, "mat-khau-moi-123"); return true; }
                catch (DatLaiMatKhauService.MaKhongHopLe ex) { return false; }
            };
            var one = workers.submit(attempt);
            var two = workers.submit(attempt);
            start.countDown();
            assertThat(List.of(one.get(15, java.util.concurrent.TimeUnit.SECONDS), two.get(15, java.util.concurrent.TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(true, false);
        }
        assertThat(users.findById(managerId).orElseThrow().phienBanToken()).isEqualTo(1);
    }

    @Test void appointmentAdministrationRequiresLoginRoleAndBuildingScope() throws Exception {
        mvc.perform(get("/api/lich-hen")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/lich-hen").header("Authorization", "Bearer " + tenant)).andExpect(status().isForbidden());
        mvc.perform(get("/api/lich-hen").header("Authorization", "Bearer " + manager)).andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].hoTen").value("Khách A"));
        Long foreignId = jdbc.queryForObject("SELECT id FROM LICH_HEN_XEM_PHONG WHERE toa_nha_id=2", Long.class);
        mvc.perform(patch("/api/lich-hen/"+foreignId+"/trang-thai").header("Authorization", "Bearer " + manager)
                .contentType(MediaType.APPLICATION_JSON).content("{\"trangThai\":\"HUY\"}")).andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("SELECT trang_thai FROM LICH_HEN_XEM_PHONG WHERE id=?", String.class, foreignId)).isEqualTo("CHO_XAC_NHAN");
        mvc.perform(get("/api/public/lich-hen")).andExpect(status().isNotFound());
    }

    @Test void tenantSearchDoesNotReturnUnassignedProfilesWhichDoNotMatch() throws Exception {
        jdbc.update("INSERT INTO NGUOI_THUE(ho_ten,ngay_sinh,so_dien_thoai,so_giay_to,que_quan) VALUES ('SearchUniqueTarget',DATE '1995-01-01','0999000201','SEARCH-TARGET','HN'), ('UnrelatedOrphan',DATE '1995-01-01','0999000202','SEARCH-OTHER','HN')");
        mvc.perform(get("/api/nguoi-thue").param("q", "SearchUniqueTarget").header("Authorization", "Bearer " + manager))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].hoTen").value("SearchUniqueTarget"));
    }

    @Test void publicRoomRefreshesActiveAndExpiredContractsWithoutOpeningInternalCatalog() throws Exception {
        Long renter = jdbc.queryForObject("INSERT INTO NGUOI_THUE(ho_ten,ngay_sinh,so_dien_thoai,so_giay_to,que_quan) VALUES ('Dated contract',DATE '1995-01-01','0999000203','DATED-ROOM','HN') RETURNING id", Long.class);
        Long room = jdbc.queryForObject("INSERT INTO PHONG(toa_nha_id,so_phong,tang,dien_tich,suc_chua,gia_thue_mac_dinh,loai_phong,trang_thai) VALUES (1,'DATE-TEST',1,20,2,3000000,'Studio','TRONG') RETURNING id", Long.class);
        java.time.LocalDate today = java.time.LocalDate.now(clock);
        Long contract = jdbc.queryForObject("INSERT INTO HOP_DONG(phong_id,nguoi_thue_id,ngay_bat_dau,ngay_ket_thuc,gia_thue,tien_coc,so_ngay_bao_truoc,trang_thai) VALUES (?,?,?,?,3000000,3000000,30,'HIEU_LUC') RETURNING id",
                Long.class, room, renter, java.sql.Date.valueOf(today), java.sql.Date.valueOf(today.plusMonths(1)));
        mvc.perform(get("/api/public/phong/"+room)).andExpect(status().isOk()).andExpect(jsonPath("$.trangThai").value("DANG_THUE"));
        jdbc.update("UPDATE HOP_DONG SET ngay_bat_dau=?,ngay_ket_thuc=? WHERE id=?", java.sql.Date.valueOf(today.minusMonths(1)), java.sql.Date.valueOf(today.minusDays(1)), contract);
        mvc.perform(get("/api/public/phong/"+room)).andExpect(status().isOk()).andExpect(jsonPath("$.trangThai").value("TRONG"));
    }

    @Test void publicPortalHidesRoomsStoppedFromRenting() throws Exception {
        Long before = jdbc.queryForObject("SELECT COUNT(*) FROM PHONG WHERE toa_nha_id=1 AND trang_thai='TRONG' AND ngung_cho_thue=FALSE", Long.class);
        Long room = jdbc.queryForObject("INSERT INTO PHONG(toa_nha_id,so_phong,tang,dien_tich,suc_chua,gia_thue_mac_dinh,loai_phong,trang_thai,ngung_cho_thue) VALUES (1,'NGUNG-TEST',1,20,2,3000000,'Studio','TRONG',TRUE) RETURNING id", Long.class);
        mvc.perform(get("/api/public/phong/" + room)).andExpect(status().isNotFound());
        mvc.perform(get("/api/public/phong").param("chiPhongTrong", "false").param("toaNhaId", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id==" + room + ")]").isEmpty());
        mvc.perform(get("/api/public/toa-nha")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==1)].soPhongTrong").value(org.hamcrest.Matchers.contains(before.intValue())));
        jdbc.update("UPDATE PHONG SET ngung_cho_thue=FALSE WHERE id=?", room);
        mvc.perform(get("/api/public/phong/" + room)).andExpect(status().isOk());
        mvc.perform(get("/api/public/toa-nha")).andExpect(jsonPath("$[?(@.id==1)].soPhongTrong").value(org.hamcrest.Matchers.contains(before.intValue() + 1)));
    }

    private String create(String phone, String role) {
        jdbc.update("INSERT INTO NGUOI_DUNG(ho_ten,so_dien_thoai,mat_khau_hash,vai_tro,trang_thai) VALUES (?,?,?,?,'HOAT_DONG')", role, phone, hasher.hash("mat-khau-cu-123"), role);
        NguoiDung user = users.findBySoDienThoai(phone).orElseThrow();
        return tokens.createToken(ThongTinNguoiDung.tuNguoiDung(user), user.phienBanToken());
    }
}
