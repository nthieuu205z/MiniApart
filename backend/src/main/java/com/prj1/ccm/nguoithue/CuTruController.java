package com.prj1.ccm.nguoithue;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import com.prj1.ccm.report.XlsxBaoCao;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Set;

/** FR-TNT-11: current primary tenants and co-occupants, declaration status and private export. */
@RestController
@RequestMapping("/api/toa-nha/{toaNhaId}/cu-tru")
public class CuTruController {
    private final JdbcTemplate jdbc;
    private final PhanQuyenToaService phanQuyen;
    private final NhatKyThaoTacRepository nhatKy;
    private final Clock clock;
    public CuTruController(JdbcTemplate jdbc, PhanQuyenToaService phanQuyen, NhatKyThaoTacRepository nhatKy, Clock clock) {
        this.jdbc = jdbc; this.phanQuyen = phanQuyen; this.nhatKy = nhatKy; this.clock = clock;
    }
    public record Dong(Long nguoiThueId, Long phongId, String soPhong, String hoTen, LocalDate ngaySinh, String soDienThoai,
                       String soGiayToChe, String trangThaiLuuTru, LocalDate ngayKhaiBao, LocalDate ngayVaoO, boolean canhBaoQuaHan) {}
    public record YeuCau(String trangThaiLuuTru, LocalDate ngayKhaiBao) {}
    private static final String NGUOI_DANG_O = """
            WITH nguoi_o AS (
                SELECT hd.nguoi_thue_id, hd.phong_id, hd.ngay_bat_dau AS ngay_vao_o
                FROM HOP_DONG hd JOIN PHONG p ON p.id=hd.phong_id
                WHERE p.toa_nha_id=? AND hd.trang_thai='HIEU_LUC' AND hd.ngay_bat_dau<=? AND hd.ngay_ket_thuc>=?
                UNION ALL
                SELECT noc.nguoi_thue_id, hd.phong_id, GREATEST(noc.tu_ngay,hd.ngay_bat_dau) AS ngay_vao_o
                FROM NGUOI_O_CUNG noc JOIN HOP_DONG hd ON hd.id=noc.hop_dong_id JOIN PHONG p ON p.id=hd.phong_id
                WHERE p.toa_nha_id=? AND hd.trang_thai='HIEU_LUC' AND hd.ngay_bat_dau<=? AND hd.ngay_ket_thuc>=?
                    AND noc.tu_ngay<=? AND (noc.den_ngay IS NULL OR noc.den_ngay>=?)
            ), cu_tru AS (
                SELECT nguoi_thue_id,phong_id,MIN(ngay_vao_o) AS ngay_vao_o FROM nguoi_o GROUP BY nguoi_thue_id,phong_id
            )
            SELECT nt.*,ct.phong_id,p.so_phong,ct.ngay_vao_o FROM cu_tru ct
            JOIN NGUOI_THUE nt ON nt.id=ct.nguoi_thue_id JOIN PHONG p ON p.id=ct.phong_id
            """;

    @GetMapping
    public List<Dong> danhSach(@PathVariable Long toaNhaId, HttpServletRequest request) {
        phanQuyen.layToaNhaNeuNhanVienDuocXem(user(request), toaNhaId);
        return doc(toaNhaId);
    }

    @PutMapping("/{nguoiThueId}")
    @Transactional
    public ResponseEntity<Void> luu(@PathVariable Long toaNhaId, @PathVariable Long nguoiThueId, @RequestBody YeuCau yeuCau, HttpServletRequest request) {
        NguoiDung user = user(request);
        phanQuyen.layToaNhaNeuNhanVienDuocXem(user, toaNhaId);
        if (yeuCau == null || !Set.of("CHUA_KHAI_BAO", "DA_THONG_BAO_LUU_TRU", "DA_DANG_KY_TAM_TRU").contains(yeuCau.trangThaiLuuTru() == null ? "" : yeuCau.trangThaiLuuTru())) throw loi("Trạng thái khai báo không hợp lệ.");
        if (!"CHUA_KHAI_BAO".equals(yeuCau.trangThaiLuuTru()) && (yeuCau.ngayKhaiBao() == null || yeuCau.ngayKhaiBao().isAfter(LocalDate.now(clock)))) throw loi("Ngày khai báo phải là ngày đã diễn ra.");
        Dong truoc = doc(toaNhaId).stream().filter(d -> d.nguoiThueId().equals(nguoiThueId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        LocalDate ngay = "CHUA_KHAI_BAO".equals(yeuCau.trangThaiLuuTru()) ? null : yeuCau.ngayKhaiBao();
        jdbc.update("UPDATE NGUOI_THUE SET trang_thai_luu_tru=?,ngay_khai_bao=? WHERE id=?", yeuCau.trangThaiLuuTru(), ngay, nguoiThueId);
        nhatKy.ghi(user.id(), "CAP_NHAT_CU_TRU", "NGUOI_THUE:" + nguoiThueId, truoc.trangThaiLuuTru() + ";" + truoc.ngayKhaiBao(), yeuCau.trangThaiLuuTru() + ";" + ngay);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/xuat-danh-sach")
    @Transactional
    public ResponseEntity<byte[]> xuat(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung user = user(request);
        phanQuyen.layToaNhaNeuNhanVienDuocXem(user, toaNhaId);
        LocalDate now = LocalDate.now(clock);
        List<List<?>> rows = new ArrayList<>();
        rows.add(List.of("Phòng", "Họ tên", "Ngày sinh", "Số giấy tờ", "Quê quán", "Ngày bắt đầu ở", "Trạng thái lưu trú", "Ngày khai báo"));
        rows.addAll(jdbc.query(NGUOI_DANG_O + " ORDER BY p.so_phong,nt.ho_ten,nt.id",
                (rs, n) -> Arrays.<Object>asList(rs.getString("so_phong"), rs.getString("ho_ten"), rs.getObject("ngay_sinh", LocalDate.class), rs.getString("so_giay_to"),
                        rs.getString("que_quan"), rs.getObject("ngay_vao_o", LocalDate.class), rs.getString("trang_thai_luu_tru"), rs.getObject("ngay_khai_bao", LocalDate.class)),
                toaNhaId, now, now, toaNhaId, now, now, now, now));
        nhatKy.ghi(user.id(), "XUAT_DANH_SACH_CU_TRU", "TOA_NHA:" + toaNhaId, null, "soDong=" + (rows.size() - 1));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cu-tru-" + toaNhaId + ".xlsx").body(XlsxBaoCao.viet(rows));
    }

    private List<Dong> doc(Long toaNhaId) {
        LocalDate now = LocalDate.now(clock);
        return jdbc.query(NGUOI_DANG_O + " ORDER BY p.so_phong,nt.ho_ten,nt.id", (rs, n) -> {
            String trangThai = rs.getString("trang_thai_luu_tru");
            if (trangThai == null) trangThai = "CHUA_KHAI_BAO";
            LocalDate vaoO = rs.getObject("ngay_vao_o", LocalDate.class);
            return new Dong(rs.getLong("id"), rs.getLong("phong_id"), rs.getString("so_phong"), rs.getString("ho_ten"), rs.getObject("ngay_sinh", LocalDate.class),
                    rs.getString("so_dien_thoai"), SoGiayToFormatter.che(rs.getString("so_giay_to")), trangThai, rs.getObject("ngay_khai_bao", LocalDate.class), vaoO,
                    "CHUA_KHAI_BAO".equals(trangThai) && now.isAfter(vaoO.plusDays(30)));
        }, toaNhaId, now, now, toaNhaId, now, now, now, now);
    }

    private NguoiDung user(HttpServletRequest request) { return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE); }
    private ResponseStatusException loi(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
