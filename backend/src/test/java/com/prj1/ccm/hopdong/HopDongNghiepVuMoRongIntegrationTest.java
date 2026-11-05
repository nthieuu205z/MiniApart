package com.prj1.ccm.hopdong;

import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
class HopDongNghiepVuMoRongIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new com.prj1.ccm.support.TestPostgres("postgres:17-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordHasher passwordHasher;

    @Autowired
    private HopDongHoSoRepository hopDongHoSoRepository;

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @BeforeEach
    void resetDatabase() {
        jdbcTemplate.update("DELETE FROM NGUOI_DUNG WHERE id > 5");
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
        jdbcTemplate.update("DELETE FROM BANG_GIA_PHONG");
        jdbcTemplate.update("DELETE FROM NGUOI_O_CUNG");
        jdbcTemplate.update("DELETE FROM HOP_DONG_HO_SO");
        jdbcTemplate.update("DELETE FROM HOP_DONG_DICH_VU");
        jdbcTemplate.update("DELETE FROM HOP_DONG");
        jdbcTemplate.update("DELETE FROM NGUOI_THUE");
        jdbcTemplate.update("DELETE FROM BANG_GIA");
        jdbcTemplate.update("DELETE FROM DICH_VU");
        jdbcTemplate.update("DELETE FROM PHONG");
        jdbcTemplate.update("DELETE FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id IN (2, 4, 5)");
        jdbcTemplate.update("DELETE FROM NHAT_KY_THAO_TAC");
        jdbcTemplate.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id) VALUES (3, 1) ON CONFLICT DO NOTHING");
    }

    @Test
    void quanLyBangGiaPhong_ghiDeDonGiaDienVaXoaGhiDeThanhCong() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "501", 2);
        Long dienId = themDichVuCoBangGia(1L, "Điện", "3500.00", true);

        // 1. Xem giá dịch vụ phòng khi chưa ghi đè -> kế thừa giá toà
        mockMvc.perform(get("/api/phong/" + phongId + "/bang-gia-dich-vu")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].dichVuId").value(dienId))
                .andExpect(jsonPath("$[0].tenDichVu").value("Điện"))
                .andExpect(jsonPath("$[0].donGia").value(3500.00))
                .andExpect(jsonPath("$[0].nguonGia").value("KE_THUA"));

        // 2. Thiết lập giá ghi đè riêng cho phòng 501: 4000đ/kWh
        mockMvc.perform(post("/api/phong/" + phongId + "/dich-vu/" + dienId + "/bang-gia")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "donGia": 4000.00,
                                  "ngayHieuLuc": "2026-11-01"
                                }
                                """))
                .andExpect(status().isCreated());

        // 3. Xem lại -> nguồn giá là GHI_DE
        mockMvc.perform(get("/api/phong/" + phongId + "/bang-gia-dich-vu")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].donGia").value(4000.00))
                .andExpect(jsonPath("$[0].nguonGia").value("GHI_DE"));

        // 4. Xóa giá ghi đè phòng
        Long bangGiaPhongId = jdbcTemplate.queryForObject(
                "SELECT id FROM BANG_GIA_PHONG WHERE phong_id = ? AND dich_vu_id = ?",
                Long.class, phongId, dienId);
        mockMvc.perform(delete("/api/phong/" + phongId + "/bang-gia/" + bangGiaPhongId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isNoContent());

        // 5. Kiểm tra lại -> quay về nguồn giá KE_THUA
        mockMvc.perform(get("/api/phong/" + phongId + "/bang-gia-dich-vu")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].donGia").value(3500.00))
                .andExpect(jsonPath("$[0].nguonGia").value("KE_THUA"));
    }

    @Test
    void moLaiDraftHoSo_kiemTraCasRevisionVaGhiAuditTrail() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "502", 2);
        Long nguoiThueId = themNguoiThue("Trần Đại Diện", "0900005001", "001200001234");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-11-01", "2027-11-01", "4500000.00", "4500000.00", "CHO_KY");

        // Tạo hồ sơ đã chốt DA_CHOT với revision = 1
        HopDongHoSo sealed = new HopDongHoSo(
                null, hopDongId, 1, "DA_CHOT", null, null, "HỢP ĐỒNG THUÊ PHÒNG 502",
                LocalDate.of(2026, 11, 1), "Hà Nội", "Để ở", "Cả phòng", LocalDate.of(2026, 11, 1),
                "CHUYEN_KHOAN", 1, 5, "123456", "Thỏa thuận", null,
                "CA_NHAN", "Chủ Nhà", "001090123456", "Hà Nội", "0912345678", "chu@gmail.com",
                "Chủ Nhà", "Chủ nhà", "CHU_SO_HUU", null, null,
                "Trần Đại Diện", LocalDate.of(1995, 1, 1), "CCCD", "001200001234", LocalDate.of(2021, 5, 10),
                "Cục CS", "Hà Nội", "Hà Nội", "0900005001", "b@gmail.com",
                "Toà nhà MiniApart", "Hà Nội", "502", 5, new BigDecimal("28.5"),
                "Điều khoản", "[]", "[]", "[]",
                3L, java.time.LocalDateTime.now(), null, null, null, null, null,
                java.time.LocalDateTime.now(), java.time.LocalDateTime.now(),
                2, 30, 30, "22:00 - 06:00"
        );
        hopDongHoSoRepository.insert(sealed);

        // Mở lại DRAFT với stale revision (sai revision 999) -> trả 409 Conflict
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/ho-so/mo-lai-draft")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "expectedRevision": 999,
                                  "lyDo": "Cần sửa bổ sung điều khoản"
                                }
                                """))
                .andExpect(status().isConflict());

        // Mở lại DRAFT với đúng revision 1 -> thành công, chuyển sang DRAFT và tăng revision lên 2
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/ho-so/mo-lai-draft")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "expectedRevision": 1,
                                  "lyDo": "Cần sửa bổ sung người ở cùng"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThaiTaiLieu").value("DRAFT"))
                .andExpect(jsonPath("$.revision").value(2));

        // Kiểm tra audit trail ghi nhận hành động MO_LAI_DRAFT_HO_SO
        List<Map<String, Object>> audits = jdbcTemplate.queryForList(
                "SELECT hanh_dong, doi_tuong, gia_tri_sau FROM NHAT_KY_THAO_TAC WHERE doi_tuong = ?",
                "HOP_DONG:" + hopDongId
        );
        assertThat(audits).isNotEmpty();
        assertThat(audits.stream().anyMatch(a -> "MO_LAI_DRAFT_HO_SO".equals(a.get("hanh_dong")))).isTrue();
    }

    @Test
    void nguoiOCung_duyetKiemTraSucChuaKhoaBiQuanVaKichHoatTaiKhoanAnToan() throws Exception {
        String managerToken = login(3L, "0900000003");
        // Phòng có sức chứa tối đa 2 người (1 người thuê chính + tối đa 1 người ở cùng)
        Long phongId = themPhong(1L, "503", 2);
        Long nguoiThueId = themNguoiThue("Chủ Hộ Phòng", "0900005010", "001200005010");
        Long noc1Id = themNguoiThue("Bạn Cùng Phòng 1", "0900005011", "001200005011");
        Long noc2Id = themNguoiThue("Bạn Cùng Phòng 2", "0900005012", "001200005012");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-11-01", "2027-11-01", "4500000.00", "4500000.00", "HIEU_LUC");

        // Tạo 2 bản ghi người ở cùng ở trạng thái CHO_DUYET
        Long noc1RecordId = jdbcTemplate.queryForObject("""
                INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, vai_tro, trang_thai)
                VALUES (?, ?, 'Bạn bè', DATE '2026-11-01', 'NGUOI_O', 'CHO_DUYET')
                RETURNING id
                """, Long.class, hopDongId, noc1Id);

        Long noc2RecordId = jdbcTemplate.queryForObject("""
                INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, vai_tro, trang_thai)
                VALUES (?, ?, 'Đồng nghiệp', DATE '2026-11-01', 'NGUOI_O', 'CHO_DUYET')
                RETURNING id
                """, Long.class, hopDongId, noc2Id);

        // 1. Phê duyệt người ở cùng thứ 1: Tổng cư trú = 1 (chính) + 1 (noc1) = 2 <= 2 (sức chứa) -> THÀNH CÔNG
        mockMvc.perform(put("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/" + noc1RecordId + "/duyet")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_DUYET"));

        // 2. Phê duyệt người ở cùng thứ 2: Tổng cư trú = 1 + 1 + 1 = 3 > 2 (sức chứa) -> BỊ TỪ CHỐI (400 Bad Request)
        mockMvc.perform(put("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/" + noc2RecordId + "/duyet")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest());

        // 3. Kích hoạt tài khoản cho bạn cùng phòng 1
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/" + noc1RecordId + "/kich-hoat-tai-khoan")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soDienThoai").value("0900005011"))
                .andExpect(jsonPath("$.coTaiKhoan").value(true));

        // Xác minh tài khoản NGUOI_DUNG được tạo với so_dien_thoai làm tên đăng nhập, KHÔNG dùng CCCD
        Map<String, Object> acc = jdbcTemplate.queryForMap(
                "SELECT so_dien_thoai, vai_tro, trang_thai, nguoi_thue_id FROM NGUOI_DUNG WHERE nguoi_thue_id = ?",
                noc1Id
        );
        assertThat(acc.get("so_dien_thoai")).isEqualTo("0900005011");
        assertThat(acc.get("so_dien_thoai")).isNotEqualTo("001200005011");
        assertThat(acc.get("vai_tro")).isEqualTo("NGUOI_THUE");
        assertThat(acc.get("trang_thai")).isEqualTo("HOAT_DONG");

        // 4. Cho bạn cùng phòng 1 rời phòng
        mockMvc.perform(put("/api/hop-dong/" + hopDongId + "/nguoi-o-cung/" + noc1RecordId + "/roi-phong")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "ngayRoiDi": "2026-11-15",
                                  "lyDo": "Chuyển công tác"
                                }
                                """))
                .andExpect(status().isOk());

        Map<String, Object> nocUpdated = jdbcTemplate.queryForMap(
                "SELECT trang_thai, ly_do_roi_di, den_ngay FROM NGUOI_O_CUNG WHERE id = ?",
                noc1RecordId
        );
        assertThat(nocUpdated.get("trang_thai")).isEqualTo("DA_ROI_DI");
        assertThat(nocUpdated.get("ly_do_roi_di")).isEqualTo("Chuyển công tác");
    }

    @Test
    void chinhSachVanHanh_luuDraft_getLai_xuatPdf_khopGiaTri() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "504", 4);
        Long nguoiThueId = themNguoiThue("Nguyễn Văn Chính Sách", "0900005040", "001200005040");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-11-01", "2027-11-01", "5000000.00", "5000000.00", "CHO_KY");

        // 1. Lưu draft hồ sơ với 4 trường chính sách tùy biến
        mockMvc.perform(put("/api/hop-dong/" + hopDongId + "/ho-so/draft")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tieuDe": "HỢP ĐỒNG THUÊ PHÒNG 504",
                                  "soNguoiToiDa": 3,
                                  "soNgayBaoTruocGiaHan": 45,
                                  "soNgayHoanCoc": 14,
                                  "khungGioYenTinh": "23h00 - 05h00",
                                  "benBHoTen": "Nguyễn Văn Chính Sách",
                                  "benBSoGiayTo": "001200005040",
                                  "benBDienThoai": "0900005040",
                                  "benBThuongTru": "Hà Nội",
                                  "benATenChuThe": "Chủ Sở Hữu MiniApart",
                                  "benADinhDanh": "001090123456",
                                  "benADiaChi": "Hà Nội",
                                  "benADienThoai": "0912345678",
                                  "benANguoiKy": "Chủ Sở Hữu",
                                  "benATuCachKy": "CHU_SO_HUU",
                                  "dieuKhoanTuyBien": "Điều khoản thỏa thuận chi tiết đầy đủ không có chỗ trống."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoiToiDa").value(3))
                .andExpect(jsonPath("$.soNgayBaoTruocGiaHan").value(45))
                .andExpect(jsonPath("$.soNgayHoanCoc").value(14))
                .andExpect(jsonPath("$.khungGioYenTinh").value("23h00 - 05h00"));

        // 2. GET lại hồ sơ -> 4 trường chính sách được bảo toàn nguyên vẹn
        mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/ho-so")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoiToiDa").value(3))
                .andExpect(jsonPath("$.soNgayBaoTruocGiaHan").value(45))
                .andExpect(jsonPath("$.soNgayHoanCoc").value(14))
                .andExpect(jsonPath("$.khungGioYenTinh").value("23h00 - 05h00"));

        // 3. Xuất PDF -> PDF chứa đúng các chính sách đã thỏa thuận
        byte[] pdfBytes = mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/xuat-pdf")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        String pdfText = trichXuatVanBanPdf(pdfBytes);
        assertThat(pdfText).contains("3 người");
        assertThat(pdfText).contains("45 ngày");
        assertThat(pdfText).contains("14 ngày làm việc sau khi bàn giao phòng");
        assertThat(pdfText).contains("23h00 - 05h00");

        // 4. Cập nhật tiếp draft với revision mới -> bảo toàn không bị constructor reset về mặc định
        mockMvc.perform(put("/api/hop-dong/" + hopDongId + "/ho-so/draft")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "expectedRevision": 1,
                                  "tieuDe": "HỢP ĐỒNG THUÊ PHÒNG 504 (BẢN SỬA)",
                                  "soNgayHoanCoc": 10
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNguoiToiDa").value(3))
                .andExpect(jsonPath("$.soNgayBaoTruocGiaHan").value(45))
                .andExpect(jsonPath("$.soNgayHoanCoc").value(10))
                .andExpect(jsonPath("$.khungGioYenTinh").value("23h00 - 05h00"));
    }

    @Test
    void quanLyThemNguoiOCungTrucTiep_vuotSucChua_biTuChoiVaKhongLuuBanGhi() throws Exception {
        String managerToken = login(3L, "0900000003");
        // Phòng sức chứa 2 người (1 chính + tối đa 1 người ở cùng)
        Long phongId = themPhong(1L, "505", 2);
        Long nguoiThueId = themNguoiThue("Chủ Hộ Phòng 505", "0900005050", "001200005050");
        Long noc1Id = themNguoiThue("Người Ở 1", "0900005051", "001200005051");
        Long noc2Id = themNguoiThue("Người Ở 2", "0900005052", "001200005052");
        Long hopDongId = themHopDong(phongId, nguoiThueId, "2026-11-01", "2027-11-01", "4500000.00", "4500000.00", "HIEU_LUC");

        // 1. Quản lý thêm trực tiếp người ở cùng 1 -> DA_DUYET thành công (tổng = 2 <= 2)
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nguoiThueId": %d,
                                  "tuNgay": "2026-11-01",
                                  "quanHe": "Bạn bè",
                                  "vaiTro": "NGUOI_O"
                                }
                                """.formatted(noc1Id)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.hoTenNguoiThue").value("Người Ở 1"));

        String trangThaiNoc1 = jdbcTemplate.queryForObject(
                "SELECT trang_thai FROM NGUOI_O_CUNG WHERE nguoi_thue_id = ? AND hop_dong_id = ?",
                String.class,
                noc1Id, hopDongId
        );
        assertThat(trangThaiNoc1).isEqualTo("DA_DUYET");

        // 2. Quản lý thêm trực tiếp người ở cùng 2 -> vượt sức chứa (tổng = 3 > 2) -> 400 Bad Request
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/nguoi-o-cung")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nguoiThueId": %d,
                                  "tuNgay": "2026-11-01",
                                  "quanHe": "Bạn bè",
                                  "vaiTro": "NGUOI_O"
                                }
                                """.formatted(noc2Id)))
                .andExpect(status().isBadRequest());

        // 3. Khẳng định trong database CHỈ CÓ 1 bản ghi người ở cùng, bản ghi vượt sức chứa KHÔNG được lưu
        Integer count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM NGUOI_O_CUNG WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void snapshotVaPdf_chiChuaNguoiDaDuyetVaThoiGianPhuHop_khongChuaChoDuyetTuChoi() throws Exception {
        String managerToken = login(3L, "0900000003");
        Long phongId = themPhong(1L, "506", 4);
        Long chuHoId = themNguoiThue("Lê Đại Diện 506", "0900005060", "001200005060");
        Long nocDuyetId = themNguoiThue("Bạn Đã Duyệt", "0900005061", "001200005061");
        Long nocChoDuyetId = themNguoiThue("Bạn Chờ Duyệt", "0900005062", "001200005062");
        Long nocTuChoiId = themNguoiThue("Bạn Bị Từ Chối", "0900005063", "001200005063");
        Long nocHetHanId = themNguoiThue("Bạn Đã Rời Đi Trước HĐ", "0900005064", "001200005064");
        Long hopDongId = themHopDong(phongId, chuHoId, "2026-11-01", "2027-11-01", "6000000.00", "6000000.00", "CHO_KY");

        // 1. Tạo 4 trạng thái người ở cùng khác nhau
        // nocDuyet: DA_DUYET trong thời hạn HĐ
        jdbcTemplate.update("""
                INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay, vai_tro, trang_thai)
                VALUES (?, ?, 'Bạn bè', DATE '2026-11-01', DATE '2027-11-01', 'NGUOI_O', 'DA_DUYET')
                """, hopDongId, nocDuyetId);

        // nocChoDuyet: CHO_DUYET
        jdbcTemplate.update("""
                INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay, vai_tro, trang_thai)
                VALUES (?, ?, 'Bạn cùng quê', DATE '2026-11-01', DATE '2027-11-01', 'NGUOI_O', 'CHO_DUYET')
                """, hopDongId, nocChoDuyetId);

        // nocTuChoi: TU_CHOI
        jdbcTemplate.update("""
                INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay, vai_tro, trang_thai, ly_do_tu_choi)
                VALUES (?, ?, 'Người quen', DATE '2026-11-01', DATE '2027-11-01', 'NGUOI_O', 'TU_CHOI', 'Không đủ giấy tờ')
                """, hopDongId, nocTuChoiId);

        // nocHetHan: DA_DUYET nhưng rời đi trước khi HĐ bắt đầu (denNgay < 2026-11-01)
        jdbcTemplate.update("""
                INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay, vai_tro, trang_thai)
                VALUES (?, ?, 'Bạn cũ', DATE '2026-09-01', DATE '2026-10-31', 'NGUOI_O', 'DA_DUYET')
                """, hopDongId, nocHetHanId);

        // 2. Lưu draft hồ sơ
        mockMvc.perform(put("/api/hop-dong/" + hopDongId + "/ho-so/draft")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "tieuDe": "HỢP ĐỒNG THUÊ PHÒNG 506",
                                  "ngayLap": "2026-11-01",
                                  "benBHoTen": "Lê Đại Diện 506",
                                  "benBSoGiayTo": "001200005060",
                                  "benBDienThoai": "0900005060",
                                  "benBThuongTru": "Hà Nội",
                                  "benATenChuThe": "Chủ Sở Hữu MiniApart",
                                  "benADinhDanh": "001090123456",
                                  "benADiaChi": "Hà Nội",
                                  "benADienThoai": "0912345678",
                                  "benANguoiKy": "Chủ Sở Hữu",
                                  "benATuCachKy": "CHU_SO_HUU",
                                  "dieuKhoanTuyBien": "Điều khoản hoàn chỉnh không có chỗ trống nào."
                                }
                                """))
                .andExpect(status().isOk());

        // 3. Chốt hồ sơ (DA_CHOT)
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/ho-so/chot")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "expectedRevision": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThaiTaiLieu").value("DA_CHOT"));

        // 4. Kiểm tra snapshot JSON lưu trong CSDL: CHỈ chứa "Bạn Đã Duyệt", KHÔNG chứa CHO_DUYET/TU_CHOI/hết hạn
        String snapshotJson = jdbcTemplate.queryForObject(
                "SELECT snapshot_nguoi_o_cung_json FROM HOP_DONG_HO_SO WHERE hop_dong_id = ?",
                String.class,
                hopDongId
        );
        assertThat(snapshotJson).contains("Bạn Đã Duyệt");
        assertThat(snapshotJson).doesNotContain("Bạn Chờ Duyệt");
        assertThat(snapshotJson).doesNotContain("Bạn Bị Từ Chối");
        assertThat(snapshotJson).doesNotContain("Bạn Đã Rời Đi Trước HĐ");

        // 5. Ghi nhận ký chính thức (DA_GHI_NHAN_KY)
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/ho-so/ghi-nhan-ky")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "expectedRevision": 1,
                                  "ngayKy": "2026-11-01",
                                  "ghiChuKy": "Đã ký đủ hai bên",
                                  "fileScanDinhKem": "hd506_scan.pdf"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThaiTaiLieu").value("DA_GHI_NHAN_KY"));

        // 6. Xuất PDF bản chính thức đã ký -> kiểm tra danh sách người được phép cư trú
        byte[] pdfBytes = mockMvc.perform(get("/api/hop-dong/" + hopDongId + "/xuat-pdf")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        String pdfText = trichXuatVanBanPdf(pdfBytes);
        assertThat(pdfText).contains("DANH SÁCH NGƯỜI ĐƯỢC PHÉP CƯ TRÚ:");
        assertThat(pdfText).contains("Lê Đại Diện 506");
        assertThat(pdfText).contains("Bạn Đã Duyệt");
        assertThat(pdfText).doesNotContain("Bạn Chờ Duyệt");
        assertThat(pdfText).doesNotContain("Bạn Bị Từ Chối");
        assertThat(pdfText).doesNotContain("Bạn Đã Rời Đi Trước HĐ");

        // 7. Bảo toàn snapshot: Hợp đồng đã ký không thể bị mở lại thành draft
        mockMvc.perform(post("/api/hop-dong/" + hopDongId + "/ho-so/mo-lai-draft")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "expectedRevision": 1,
                                  "lyDo": "Cố tình mở lại sau khi ký"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    private String trichXuatVanBanPdf(byte[] pdfBytes) throws IOException {
        PdfReader reader = new PdfReader(pdfBytes);
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= reader.getNumberOfPages(); i++) {
            sb.append(extractor.getTextFromPage(i)).append("\n");
        }
        reader.close();
        return sb.toString();
    }

    private Long themPhong(Long toaNhaId, String soPhong, int sucChua) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO PHONG(toa_nha_id, so_phong, tang, dien_tich, suc_chua, gia_thue_mac_dinh, loai_phong, trang_thai)
                VALUES (?, ?, 5, 28.5, ?, 4500000.00, 'Tieu chuan', 'TRONG')
                RETURNING id
                """,
                Long.class,
                toaNhaId, soPhong, sucChua
        );
    }

    private Long themNguoiThue(String hoTen, String sdt, String soGiayTo) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan)
                VALUES (?, DATE '1995-01-01', ?, ?, 'Hà Nội')
                RETURNING id
                """,
                Long.class,
                hoTen, sdt, soGiayTo
        );
    }

    private Long themDichVuCoBangGia(Long toaNhaId, String ten, String donGia, boolean laDien) {
        Long dichVuId = jdbcTemplate.queryForObject(
                """
                INSERT INTO DICH_VU(toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                VALUES (?, ?, 'THEO_CHI_SO', 'CO_DINH', 'kWh', ?, TRUE)
                RETURNING id
                """,
                Long.class,
                toaNhaId, ten, laDien
        );
        jdbcTemplate.update(
                """
                INSERT INTO BANG_GIA(dich_vu_id, don_gia, ngay_hieu_luc)
                VALUES (?, ?, DATE '2026-01-01')
                """,
                dichVuId, new BigDecimal(donGia)
        );
        return dichVuId;
    }

    private Long themHopDong(Long phongId, Long nguoiThueId, String tuNgay, String denNgay, String giaThue, String tienCoc, String trangThai) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO HOP_DONG(phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai)
                VALUES (?, ?, DATE '%s', DATE '%s', ?, ?, 30, ?)
                RETURNING id
                """.formatted(tuNgay, denNgay),
                Long.class,
                phongId, nguoiThueId, new BigDecimal(giaThue), new BigDecimal(tienCoc), trangThai
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
}
