package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/** FR-MNT-03: managers may choose an active technician only within their building workflow. */
@RestController
public class DanhSachThoController {
    private final JdbcTemplate jdbc;
    private final PhanQuyenToaService phanQuyen;
    public DanhSachThoController(JdbcTemplate jdbc, PhanQuyenToaService phanQuyen) { this.jdbc = jdbc; this.phanQuyen = phanQuyen; }
    public record Tho(Long id, String hoTen, String soDienThoai) {}
    @GetMapping("/api/yeu-cau-sua-chua/tho")
    public List<Tho> danhSach(@RequestParam Long toaNhaId, HttpServletRequest request) {
        phanQuyen.layToaNhaNeuNhanVienDuocXem((NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE), toaNhaId);
        return jdbc.query("SELECT id,ho_ten,so_dien_thoai FROM NGUOI_DUNG WHERE vai_tro='THO' AND trang_thai='HOAT_DONG' ORDER BY ho_ten,id",
                (rs, n) -> new Tho(rs.getLong(1), rs.getString(2), rs.getString(3)));
    }
}
