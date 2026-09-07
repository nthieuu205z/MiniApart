package com.prj1.ccm.billing;

import com.prj1.ccm.auth.PasswordHasher;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
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
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Import(GiaoDichCocIntegrationTest.TestDoubles.class)
class GiaoDichCocIntegrationTest {

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
    private GiaoDichCocRepository giaoDichCocRepository;

    private Long hopDongId;
    private Long hopDongNgoaiPhamViId;

    @AfterEach
    void resetTestDoubles() {
        Mockito.reset(giaoDichCocRepository);
    }

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        xoaNeuBangTonTai("GIAO_DICH_COC");
        xoaNeuBangTonTai("HOP_DONG_DICH_VU");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON_BAC_THANG");
        xoaNeuBangTonTai("CHI_TIET_HOA_DON");
        xoaNeuBangTonTai("HOA_DON");
        xoaNeuBangTonTai("HOP_DONG");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
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
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");

        Long phongTrongPhamViId = themPhong(1L, "501");
        Long nguoiThueTrongPhamViId = themNguoiThue("Người thuê trong phạm vi", "0900001111", "079123456701");
        hopDongId = themHopDong(phongTrongPhamViId, nguoiThueTrongPhamViId, "6000000.00");

        Long phongNgoaiPhamViId = themPhong(2L, "601");
        Long nguoiThueNgoaiPhamViId = themNguoiThue("Người thuê ngoài phạm vi", "0900002222", "079123456702");
        hopDongNgoaiPhamViId = themHopDong(phongNgoaiPhamViId, nguoiThueNgoaiPhamViId, "6000000.00");
    }

    @Test
    void FR_TNT_04_CR_009_BR_07_thuCocNhieuLanXemDuocTongVaKhongTaoDongHoaDon() throws Exception {
        String managerToken = login(3L, "0900000003");
        themHoaDonVaDong(hopDongId);
        int soHoaDonTruoc = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        );
        int soDongHoaDonTruoc = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON ct JOIN HOA_DON hd ON hd.id = ct.hoa_don_id WHERE hd.hop_dong_id = ?",
                Integer.class,
                hopDongId
        );

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("2000000.00", "2040-01-10", "Đợt cọc thứ nhất")))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.hopDongId").value(hopDongId))
                .andExpect(jsonPath("$.loai").value("THU_COC"))
                .andExpect(jsonPath("$.soTien").value("2000000.00"))
                .andExpect(jsonPath("$.nguoiThuId").value(3))
                .andExpect(jsonPath("$.maBienLai").isNotEmpty());

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("4000000.00", "2040-01-11", "Đợt cọc thứ hai")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.loai").value("THU_COC"))
                .andExpect(jsonPath("$.soTien").value("4000000.00"));

        mockMvc.perform(get(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hopDongId").value(hopDongId))
                .andExpect(jsonPath("$.tienCocThoaThuan").value("6000000.00"))
                .andExpect(jsonPath("$.tongDaThu").value("6000000.00"))
                .andExpect(jsonPath("$.conLaiChuaThu").value("0.00"))
                .andExpect(jsonPath("$.giaoDich.length()").value(2));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id = ? AND loai = 'THU_COC'",
                Integer.class,
                hopDongId
        )).isEqualTo(2);
        assertThat(soHoaDonTruoc).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HOA_DON WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(soHoaDonTruoc);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM CHI_TIET_HOA_DON ct JOIN HOA_DON hd ON hd.id = ct.hoa_don_id WHERE hd.hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(soDongHoaDonTruoc);
        assertThat(soDongHoaDonTruoc).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT ma_bien_lai) FROM GIAO_DICH_COC WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NHAT_KY_THAO_TAC WHERE hanh_dong = 'THU_COC' AND nguoi_dung_id = ?",
                Integer.class,
                3L
        )).isEqualTo(2);
    }

    @Test
    void FR_TNT_04_CR_009_BR_07_chanTongThuCocVuotMucThoaThuanVaNoiRoHaiSoTien() throws Exception {
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("4000000.00", "2040-01-10", "Đợt đầu")))
                .andExpect(status().isCreated());

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("3000000.00", "2040-01-11", "Đợt vượt mức")))
                .andExpect(status().isConflict())
                .andExpect(content().string(containsString("4000000.00")))
                .andExpect(content().string(containsString("6000000.00")));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM GIAO_DICH_COC WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        )).isEqualTo(1);
    }

    @Test
    void FR_TNT_04_CR_009_BR_07_QTHTVaQuanLySaiToaNhan403ChoCaGhiVaXem() throws Exception {
        String systemAdminToken = login(1L, "0900000001");
        String managerToken = login(3L, "0900000003");

        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + systemAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("1000000.00", "2040-01-10", "Không được phép")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post(giaoDichCocUrl(hopDongNgoaiPhamViId))
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("1000000.00", "2040-01-10", "Sai toà")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(giaoDichCocUrl(hopDongNgoaiPhamViId))
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_TNT_04_CR_009_BR_07_migrationTaoDungBangVaRangBuocSoTien() {
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_name = 'giao_dich_coc'
                        )
                        """,
                Boolean.class
        )).isTrue();
        assertThatThrownBy(() -> jdbcTemplate.update(
                "INSERT INTO GIAO_DICH_COC(hop_dong_id, loai, so_tien, ngay, nguoi_thu_id) VALUES (?, 'THU_COC', 0.00, DATE '2040-01-10', 3)",
                hopDongId
        )).hasMessageContaining("ck_giao_dich_coc_so_tien_duong");
        var moneyColumn = jdbcTemplate.queryForMap(
                """
                        SELECT data_type, numeric_precision, numeric_scale
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = 'giao_dich_coc'
                          AND column_name = 'so_tien'
                        """
        );
        assertThat(moneyColumn).containsEntry("data_type", "numeric")
                .containsEntry("numeric_precision", 15)
                .containsEntry("numeric_scale", 2);
        List<String> foreignKeyDefinitions = jdbcTemplate.queryForList(
                """
                        SELECT pg_get_constraintdef(c.oid)
                        FROM pg_constraint c
                        WHERE c.conrelid = 'giao_dich_coc'::regclass
                          AND c.contype = 'f'
                        ORDER BY c.conname
                        """,
                String.class
        );
        assertThat(foreignKeyDefinitions).hasSize(2)
                .anyMatch(definition -> definition.contains("hop_dong_id") && definition.contains("hop_dong(id)"))
                .anyMatch(definition -> definition.contains("nguoi_thu_id") && definition.contains("nguoi_dung(id)"));
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM pg_constraint
                            WHERE conrelid = 'giao_dich_coc'::regclass
                              AND conname = 'ck_giao_dich_coc_so_tien_duong'
                        )
                        """,
                Boolean.class
        )).isTrue();

        String checkDefinition = jdbcTemplate.queryForObject(
                """
                        SELECT pg_get_constraintdef(oid)
                        FROM pg_constraint
                        WHERE conrelid = 'giao_dich_coc'::regclass
                          AND contype = 'c'
                          AND pg_get_constraintdef(oid) LIKE '%loai%'
                        """,
                String.class
        );
        assertThat(checkDefinition).contains("THU_COC", "HOAN_COC", "KHAU_TRU_COC");
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM pg_constraint
                        WHERE conrelid = 'giao_dich_coc'::regclass
                          AND contype = 'u'
                          AND pg_get_constraintdef(oid) LIKE '%ma_bien_lai%'
                        """,
                Integer.class
        )).isEqualTo(1);
    }

    @Test
    void FR_TNT_04_CR_009_BR_07_xemTongVaDanhSachCungMotSnapshotKhiCoGiaoDichDongThoi() throws Exception {
        String managerToken = login(3L, "0900000003");
        mockMvc.perform(post(giaoDichCocUrl())
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(thuCocPayload("1000000.00", "2040-01-10", "Giao dich dau tien")))
                .andExpect(status().isCreated());

        CountDownLatch tongDaDoc = new CountDownLatch(1);
        CountDownLatch choPhepDocDanhSach = new CountDownLatch(1);
        Mockito.doAnswer(invocation -> {
            BigDecimal tong = (BigDecimal) invocation.callRealMethod();
            tongDaDoc.countDown();
            assertThat(choPhepDocDanhSach.await(5, TimeUnit.SECONDS)).isTrue();
            return tong;
        }).when(giaoDichCocRepository).tongThuCoc(hopDongId);

        ExecutorService executor = Executors.newSingleThreadExecutor();
        try {
            Future<MvcResult> ketQua = executor.submit(() -> mockMvc.perform(get(giaoDichCocUrl())
                            .header("Authorization", "Bearer " + managerToken))
                    .andReturn());

            assertThat(tongDaDoc.await(5, TimeUnit.SECONDS)).isTrue();
            jdbcTemplate.update(
                    "INSERT INTO GIAO_DICH_COC(hop_dong_id, loai, so_tien, ngay, nguoi_thu_id, ly_do) VALUES (?, 'THU_COC', 1000000.00, DATE '2040-01-11', 3, 'concurrent snapshot insert')",
                    hopDongId
            );
            choPhepDocDanhSach.countDown();

            MvcResult response = ketQua.get(10, TimeUnit.SECONDS);
            assertThat(response.getResponse().getStatus()).isEqualTo(200);
            JsonNode responseBody = objectMapper.readTree(response.getResponse().getContentAsString());
            assertThat(responseBody.path("tongDaThu").asText()).isEqualTo("1000000.00");
            assertThat(responseBody.path("giaoDich").size()).isEqualTo(1);
            assertThat(responseBody.path("giaoDich").get(0).path("lyDo").asText())
                    .isEqualTo("Giao dich dau tien");
        } finally {
            choPhepDocDanhSach.countDown();
            executor.shutdownNow();
        }
    }

    private String giaoDichCocUrl() {
        return giaoDichCocUrl(hopDongId);
    }

    private String giaoDichCocUrl(Long id) {
        return "/api/hop-dong/%s/giao-dich-coc".formatted(id);
    }

    private String thuCocPayload(String soTien, String ngay, String lyDo) {
        return """
                {
                  "soTien": "%s",
                  "ngay": "%s",
                  "lyDo": "%s"
                }
                """.formatted(soTien, ngay, lyDo);
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 5, 22.50, 4, 3500000.00, 'Studio', 'TRONG')
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

    private Long themHopDong(Long phongId, Long nguoiThueId, String tienCoc) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2040-01-01', DATE '2040-12-31', 3500000.00, ?, 30, 'CHO_KY')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId,
                new BigDecimal(tienCoc)
        );
    }

    private void themHoaDonVaDong(Long hopDongId) {
        Long kyId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
                        VALUES (1, 2040, 1, DATE '2040-01-01', DATE '2040-01-31', 'DA_CHOT')
                        RETURNING id
                        """,
                Long.class
        );
        Long hoaDonId = jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES ('BR07-NO-DEPOSIT-LINE', ?, ?, DATE '2040-01-31', DATE '2040-02-07', 3500000.00, 0.00, 'DA_PHAT_HANH')
                        RETURNING id
                        """,
                Long.class,
                kyId,
                hopDongId
        );
        jdbcTemplate.update(
                "INSERT INTO CHI_TIET_HOA_DON(hoa_don_id, ten_khoan, thanh_tien, loai_khoan) VALUES (?, 'Tiền phòng', 3500000.00, 'TIEN_PHONG')",
                hoaDonId
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

    private void xoaNeuBangTonTai(String tenBang) {
        if (Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM information_schema.tables
                            WHERE table_schema = 'public' AND table_name = ?
                        )
                        """,
                Boolean.class,
                tenBang.toLowerCase()
        ))) {
            jdbcTemplate.update("DELETE FROM " + tenBang);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestDoubles {
        @Bean
        @Primary
        GiaoDichCocRepository giaoDichCocRepositorySpy(JdbcTemplate jdbcTemplate) {
            return Mockito.spy(new GiaoDichCocRepository(jdbcTemplate));
        }
    }
}
