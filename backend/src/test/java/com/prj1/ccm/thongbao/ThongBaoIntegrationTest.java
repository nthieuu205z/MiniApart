package com.prj1.ccm.thongbao;

import com.prj1.ccm.auth.PasswordHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class ThongBaoIntegrationTest {
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
    private ThongBaoService thongBaoService;

    @Autowired
    private ThongBaoRepository thongBaoRepository;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = NULL WHERE id IN (1, 2, 3, 4, 5)");
        jdbcTemplate.update("DELETE FROM THONG_BAO");
        jdbcTemplate.update("DELETE FROM NGUOI_DUNG WHERE id > 5");
        jdbcTemplate.update("DELETE FROM ANH_DINH_KEM");
        jdbcTemplate.update("DELETE FROM YEU_CAU_SUA_CHUA");
        jdbcTemplate.update("DELETE FROM CHI_TIET_HOA_DON");
        jdbcTemplate.update("DELETE FROM HOA_DON");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM KY_THANH_TOAN");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 3, 4, 5)");
        jdbcTemplate.update(
                "UPDATE NGUOI_DUNG SET phien_ban_token = 0, so_lan_sai = 0, lan_sai_dau_tien = NULL, khoa_den = NULL, trang_thai = 'HOAT_DONG' WHERE id IN (1, 2, 3, 4, 5)"
        );
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (2, 1), (2, 2), (3, 1)");
    }

    @Test
    void FR_MNT_02_CR_008_V37_taoBangThongBaoDaHinhKhongGanCungKhoaNgoai() {
        List<String> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'thong_bao' ORDER BY ordinal_position",
                String.class
        );

        assertThat(columns).containsExactly(
                "id", "ma_tham_chieu", "nguoi_nhan_id", "doi_tuong_loai", "doi_tuong_id", "tieu_de", "noi_dung",
                "da_doc", "doc_luc", "tao_luc"
        );
        Integer foreignKeysOnTarget = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM pg_constraint c
                        JOIN pg_class t ON t.oid = c.conrelid
                        WHERE t.relname = 'thong_bao'
                          AND c.contype = 'f'
                          AND pg_get_constraintdef(c.oid) LIKE '%doi_tuong_id%'
                        """,
                Integer.class
        );
        assertThat(foreignKeysOnTarget).isZero();
    }

    @Test
    void FR_MNT_02_yeuCauMoiChiThongBaoDungQuanLyCuaToaVaKhongLoMaKyThuat() throws Exception {
        String managerToken = login(3L, "0900000003");
        String ownerToken = login(2L, "0900000002");
        Long phongId = themPhong(1L, "901");

        long yeuCauId = taoYeuCau(phongId, managerToken, "Vòi nước bồn rửa bị rỉ", "KHAN_CAP");

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao", hasSize(1)))
                .andExpect(jsonPath("$.thongBao[0].maThamChieu").isString())
                .andExpect(jsonPath("$.thongBao[0].id").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].doiTuongLoai").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].doiTuongId").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].noiDung", containsString("Phòng 901")))
                .andExpect(jsonPath("$.thongBao[0].noiDung", containsString("Khẩn cấp")))
                .andExpect(jsonPath("$.thongBao[0].noiDung", not(containsString("YEU_CAU_SUA_CHUA"))));

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao", hasSize(0)));
    }

    @Test
    void FR_MNT_04_phanCongThongBaoDungThoDuocPhanCong() throws Exception {
        String managerToken = login(3L, "0900000003");
        String workerToken = login(4L, "0900000004");
        Long phongId = themPhong(1L, "902");
        long yeuCauId = taoYeuCau(phongId, managerToken, "Thay gioăng vòi nước", "THUONG");

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/phan-cong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thoId\":4}")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao", hasSize(1)))
                .andExpect(jsonPath("$.thongBao[0].noiDung", containsString("được phân công")));
    }

    @Test
    void FR_INV_08_phatHanhHangLoatThongBaoNguoiThueCuaTungHoaDon() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Người thuê nhận hoá đơn", "0907000401");
        Long phongId = themPhong(1L, "401");
        Long hopDongId = themHopDong(phongId, nguoiThueId);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        chenHoaDon("TN-A-401-202608", kyId, hopDongId);
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = 5", nguoiThueId);
        String tenantToken = login(5L, "0900000006");

        Long nguoiThueThuHaiId = themNguoiThue("Người thuê nhận hoá đơn hai", "0907000403");
        Long taiKhoanThuHaiId = themNguoiDung("Tài khoản người thuê hai", "0900000008", "NGUOI_THUE");
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET nguoi_thue_id = ? WHERE id = ?", nguoiThueThuHaiId, taiKhoanThuHaiId);
        Long phongThuHaiId = themPhong(1L, "403");
        Long hopDongThuHaiId = themHopDong(phongThuHaiId, nguoiThueThuHaiId);
        chenHoaDon("TN-A-403-202608", kyId, hopDongThuHaiId);
        String tenantThuHaiToken = login(taiKhoanThuHaiId, "0900000008");

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyId + "/hoa-don/phat-hanh-hang-loat")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonDaPhatHanh").value(2));

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + tenantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao", hasSize(1)))
                .andExpect(jsonPath("$.thongBao[0].maThamChieu").isString())
                .andExpect(jsonPath("$.thongBao[0].id").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].doiTuongLoai").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].doiTuongId").doesNotExist())
                .andExpect(jsonPath("$.thongBao[0].noiDung", containsString("Hoá đơn")));

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + tenantThuHaiToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao", hasSize(1)))
                .andExpect(jsonPath("$.thongBao[0].noiDung", containsString("Hoá đơn")));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO", Integer.class)).isEqualTo(2);
    }

    @Test
    void FR_INV_08_phatHanhKhongBiHongKhiNguoiThueChuaCoTaiKhoan() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long nguoiThueId = themNguoiThue("Người thuê chưa có tài khoản", "0907000402");
        Long phongId = themPhong(1L, "402");
        Long hopDongId = themHopDong(phongId, nguoiThueId);
        Long kyId = themKyThanhToan(1L, 2026, 8, "2026-07-28", "2026-08-28", "DANG_MO");
        Long hoaDonId = chenHoaDon("TN-A-402-202608", kyId, hopDongId);

        mockMvc.perform(post("/api/toa-nha/1/ky-thanh-toan/" + kyId + "/hoa-don/phat-hanh-hang-loat")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soHoaDonDaPhatHanh").value(1));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM HOA_DON WHERE id = ?", String.class, hoaDonId
        )).isEqualTo("DA_PHAT_HANH");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM THONG_BAO", Integer.class)).isZero();
    }

    @Test
    void FR_INV_08_phanBietHoaDonKhongTonTaiVoiNguoiThueChuaCoTaiKhoan() {
        assertThatThrownBy(() -> thongBaoService.taoKhiPhatHanhHoaDon(999999L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode().value()).isEqualTo(409))
                .hasMessageContaining("Thông báo không còn hợp lệ");
    }

    @Test
    void FR_MNT_02_yeuCauKhacToaKhongGuiChoQuanLyNgoaiPhamVi() throws Exception {
        String ownerToken = login(2L, "0900000002");
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(2L, "201");

        taoYeuCau(phongId, ownerToken, "Bóng đèn hành lang hỏng", "THUONG");

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao", hasSize(0)));
    }

    @Test
    void FR_MNT_04_thoKhacKhongDocDuocThongBaoCuaThoDuocPhanCong() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long wrongWorkerId = themNguoiDung("Thợ khác", "0900000007", "THO");
        String wrongWorkerToken = login(wrongWorkerId, "0900000007");
        Long phongId = themPhong(1L, "904");
        long yeuCauId = taoYeuCau(phongId, managerToken, "Ổ cắm lỏng", "THUONG");

        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/tiep-nhan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/yeu-cau-sua-chua/" + yeuCauId + "/phan-cong")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"thoId\":4}")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk());

        String workerBody = mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + login(4L, "0900000004")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String thongBaoThamChieu = objectMapper.readTree(workerBody).path("thongBao").get(0).path("maThamChieu").textValue();

        mockMvc.perform(get("/api/thong-bao/" + thongBaoThamChieu)
                        .header("Authorization", "Bearer " + wrongWorkerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/thong-bao/" + thongBaoThamChieu + "/da-doc")
                        .header("Authorization", "Bearer " + wrongWorkerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_02_FR_MNT_04_moiNguoiChiThayThongBaoCuaMinhVaDocKhongXoaBanGhi() throws Exception {
        String managerToken = login(3L, "0900000003");
        String ownerToken = login(2L, "0900000002");
        Long phongId = themPhong(1L, "903");
        long yeuCauId = taoYeuCau(phongId, managerToken, "Ổ điện chập chờn", "GAP");

        String listBody = mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String thongBaoThamChieu = objectMapper.readTree(listBody).path("thongBao").get(0).path("maThamChieu").textValue();

        mockMvc.perform(get("/api/thong-bao/" + thongBaoThamChieu)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/thong-bao/" + thongBaoThamChieu + "/da-doc")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/thong-bao/" + thongBaoThamChieu + "/da-doc")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daDoc").value(true))
                .andExpect(jsonPath("$.maThamChieu").value(thongBaoThamChieu))
                .andExpect(jsonPath("$.id").doesNotExist())
                .andExpect(jsonPath("$.doiTuongId").doesNotExist());
        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao", hasSize(1)));
    }

    @Test
    void FR_MNT_02_CR_008_capDoiTuongKhongTonTaiBiChanOPhiaUngDung() throws Exception {
        String managerToken = login(3L, "0900000003");
        UUID maThamChieu = UUID.randomUUID();
        jdbcTemplate.update(
                """
                        INSERT INTO THONG_BAO(ma_tham_chieu, nguoi_nhan_id, doi_tuong_loai, doi_tuong_id, tieu_de, noi_dung, da_doc, tao_luc)
                        VALUES (?, 3, 'YEU_CAU_SUA_CHUA', 999999, 'Thông báo hỏng', 'Phòng không còn tồn tại', FALSE, CURRENT_TIMESTAMP)
                        """,
                maThamChieu
        );

        mockMvc.perform(get("/api/thong-bao/" + maThamChieu)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.thongBao").value("Thông báo không còn hợp lệ"));
    }

    @Test
    void FR_MNT_02_QTHT_KhongDuocDocHopThongBao() throws Exception {
        String systemAdminToken = login(1L, "0900000001");

        mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/thong-bao/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/thong-bao/" + UUID.randomUUID() + "/da-doc")
                        .header("Authorization", "Bearer " + systemAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void FR_MNT_02_chuaXacThucKhongDuocDocHopThongBao() throws Exception {
        mockMvc.perform(get("/api/thong-bao"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void FR_MNT_02_danhDauDaDocDongThoiChiMotLanCapNhat() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "905");
        taoYeuCau(phongId, managerToken, "Vòi sen bị rò", "THUONG");

        String listBody = mockMvc.perform(get("/api/thong-bao")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        UUID maThamChieu = UUID.fromString(objectMapper.readTree(listBody).path("thongBao").get(0).path("maThamChieu").textValue());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Optional<ThongBao>>> results = List.of(
                    executor.submit(() -> {
                        start.await();
                        return thongBaoRepository.markAsRead(maThamChieu, 3L, java.time.Instant.now());
                    }),
                    executor.submit(() -> {
                        start.await();
                        return thongBaoRepository.markAsRead(maThamChieu, 3L, java.time.Instant.now());
                    })
            );
            start.countDown();

            long winners = results.stream().filter(result -> {
                try {
                    return result.get().isPresent();
                } catch (Exception exception) {
                    throw new RuntimeException(exception);
                }
            }).count();
            assertThat(winners).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    private long taoYeuCau(Long phongId, String token, String moTa, String mucDo) throws Exception {
        String body = mockMvc.perform(multipart("/api/yeu-cau-sua-chua")
                        .param("phongId", phongId.toString())
                        .param("hangMuc", "Điện nước")
                        .param("moTa", moTa)
                        .param("mucDo", mucDo)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = objectMapper.readTree(body);
        return node.path("id").longValue();
    }

    private Long themPhong(Long toaNhaId, String soPhong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                        VALUES (?, ?, 4, 25.00, 3, 3000000.00, 'Studio', 'TRONG')
                        RETURNING id
                        """,
                Long.class,
                toaNhaId,
                soPhong
        );
    }

    private Long themNguoiThue(String hoTen, String soDienThoai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, DATE '1995-01-01', ?, ?, 'Hà Nội', 'DANG_THUE')
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                "079" + Math.abs(soDienThoai.hashCode())
        );
    }

    private Long themNguoiDung(String hoTen, String soDienThoai, String vaiTro) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_DUNG(ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai)
                        VALUES (?, ?, 'placeholder', ?, 'HOAT_DONG')
                        RETURNING id
                        """,
                Long.class,
                hoTen,
                soDienThoai,
                vaiTro
        );
    }

    private Long themHopDong(Long phongId, Long nguoiThueId) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                        VALUES (?, ?, DATE '2026-01-01', DATE '2026-12-31', 3000000.00, 3000000.00, 30, 'HIEU_LUC')
                        RETURNING id
                        """,
                Long.class,
                phongId,
                nguoiThueId
        );
    }

    private Long themKyThanhToan(Long toaNhaId, int nam, int thang, String ngayBatDau, String ngayKetThuc, String trangThai) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN(toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai)
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

    private Long chenHoaDon(String maHoaDon, Long kyId, Long hopDongId) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai)
                        VALUES (?, ?, ?, DATE '2026-08-31', DATE '2026-09-07', 3750000.00, 0.00, 'NHAP')
                        RETURNING id
                        """,
                Long.class,
                maHoaDon,
                kyId,
                hopDongId
        );
    }

    private String login(Long nguoiDungId, String soDienThoai) throws Exception {
        String runtimePassword = "runtime-" + UUID.randomUUID();
        jdbcTemplate.update("UPDATE NGUOI_DUNG SET mat_khau_hash = ? WHERE id = ?", passwordHasher.hash(runtimePassword), nguoiDungId);
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"soDienThoai\":\"%s\",\"matKhau\":\"%s\"}".formatted(soDienThoai, runtimePassword)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        int start = body.indexOf("\"token\":\"") + 9;
        int end = body.indexOf('"', start);
        return body.substring(start, end);
    }
}
