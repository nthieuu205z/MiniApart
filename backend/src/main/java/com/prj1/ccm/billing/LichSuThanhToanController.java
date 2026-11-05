package com.prj1.ccm.billing;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
public class LichSuThanhToanController {
    private final JdbcTemplate jdbc;
    private final PhanQuyenToaService permissions;
    public LichSuThanhToanController(JdbcTemplate jdbc, PhanQuyenToaService permissions) { this.jdbc = jdbc; this.permissions = permissions; }

    /** FR-INV-11/FR-INV-13/FR-INV-14 returns an immutable ledger after checking the invoice's building. */
    @GetMapping("/api/hoa-don/{hoaDonId}/thanh-toan")
    @Transactional(readOnly = true)
    public SoThanhToan lichSu(@PathVariable Long hoaDonId, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        if (user == null || (user.vaiTro() != VaiTro.CHU && user.vaiTro() != VaiTro.QUAN_LY)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        PhamVi scope = jdbc.query("""
                SELECT hd.hop_dong_id, hd.ky_id, p.toa_nha_id FROM HOA_DON hd
                JOIN HOP_DONG h ON h.id=hd.hop_dong_id JOIN PHONG p ON p.id=h.phong_id WHERE hd.id=?
                """, (rs, row) -> new PhamVi(rs.getLong("hop_dong_id"), rs.getObject("ky_id", Long.class), rs.getLong("toa_nha_id")), hoaDonId)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        permissions.layToaNhaNeuNhanVienDuocXem(user, scope.toaNhaId());
        List<DongThanhToan> entries = jdbc.query("""
                SELECT id, ma_bien_lai, so_tien, hinh_thuc, loai, ngay_thu, ly_do, dieu_chinh_cho_id
                FROM THANH_TOAN WHERE hoa_don_id=? ORDER BY thoi_diem_tao, id
                """, (rs, row) -> new DongThanhToan(rs.getLong("id"), rs.getString("ma_bien_lai"), rs.getBigDecimal("so_tien").toPlainString(),
                rs.getString("hinh_thuc"), rs.getString("loai"), rs.getObject("ngay_thu", LocalDate.class), rs.getString("ly_do"), rs.getObject("dieu_chinh_cho_id", Long.class)), hoaDonId);
        return new SoThanhToan(hoaDonId, scope.hopDongId(), scope.kyId(), scope.toaNhaId(), entries);
    }
    private record PhamVi(Long hopDongId, Long kyId, Long toaNhaId) { }
    public record DongThanhToan(Long id, String maBienLai, String soTien, String hinhThuc, String loai, LocalDate ngayThu, String lyDo, Long dieuChinhChoId) { }
    public record SoThanhToan(Long hoaDonId, Long hopDongId, Long kyId, Long toaNhaId, List<DongThanhToan> giaoDich) { }
}
