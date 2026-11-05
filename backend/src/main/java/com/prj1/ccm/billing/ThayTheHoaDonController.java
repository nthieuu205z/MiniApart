package com.prj1.ccm.billing;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@RestController
public class ThayTheHoaDonController {
    private final JdbcTemplate jdbc;
    private final PhanQuyenToaService permissions;
    private final HuyHoaDonNhapService cancellation;
    private final TaoHoaDonHangLoatService creation;
    public ThayTheHoaDonController(JdbcTemplate jdbc, PhanQuyenToaService permissions, HuyHoaDonNhapService cancellation, TaoHoaDonHangLoatService creation) {
        this.jdbc = jdbc; this.permissions = permissions; this.cancellation = cancellation; this.creation = creation;
    }

    /** FR-INV-06/BR-08 cancels and regenerates one invoice atomically, retaining the original history. */
    @PostMapping("/api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/hoa-don/{hoaDonId}/thay-the")
    @Transactional
    public KetQua thayThe(@PathVariable Long toaNhaId, @PathVariable Long kyId, @PathVariable Long hoaDonId,
            @RequestBody YeuCauHuyHoaDon command, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        if (user == null || user.vaiTro() != VaiTro.CHU) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (command == null || command.lyDo() == null || command.lyDo().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nhập lý do thay thế hoá đơn.");
        permissions.layToaNhaNeuNhanVienDuocXem(user, toaNhaId);
        Long contract = jdbc.query("""
                SELECT h.id FROM HOA_DON hd JOIN HOP_DONG h ON h.id=hd.hop_dong_id JOIN PHONG p ON p.id=h.phong_id
                WHERE hd.id=? AND hd.ky_id=? AND p.toa_nha_id=? AND hd.trang_thai <> 'DA_HUY' FOR UPDATE OF h,hd
                """, (rs, row) -> rs.getLong(1), hoaDonId, kyId, toaNhaId).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Hoá đơn không tồn tại hoặc đã huỷ."));
        BigDecimal paid = jdbc.queryForObject("SELECT COALESCE(SUM(so_tien),0) FROM THANH_TOAN WHERE hoa_don_id=?", BigDecimal.class, hoaDonId);
        if (paid != null && paid.signum() != 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Lập bút toán đối ứng cho các khoản đã thu trước khi thay thế hoá đơn.");
        cancellation.huy(toaNhaId, kyId, hoaDonId, command, user);
        Long replacement = creation.taoThayThe(toaNhaId, kyId, contract, hoaDonId, user);
        return new KetQua(hoaDonId, replacement);
    }
    public record KetQua(Long hoaDonCuId, Long hoaDonMoiId) { }
}
