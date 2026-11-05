package com.prj1.ccm.publicportal;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/** Appointment administration requires authentication and permission for the building. */
@RestController
@RequestMapping("/api/lich-hen")
public class LichHenQuanLyController {
    private final PublicPortalService service;
    public LichHenQuanLyController(PublicPortalService service) { this.service = service; }

    @GetMapping
    public List<LichHenXemPhongDto> danhSach(@RequestParam(required = false) Long toaNhaId, HttpServletRequest request) {
        return service.layDanhSachLichHen(toaNhaId, nguoiDung(request));
    }

    @PatchMapping("/{id}/trang-thai")
    public ResponseEntity<Map<String, Object>> capNhat(@PathVariable Long id, @RequestBody Map<String, String> body, HttpServletRequest request) {
        if (!service.capNhatTrangThaiLichHen(id, body.get("trangThai"), nguoiDung(request))) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("thanhCong", true, "thongBao", "Cập nhật trạng thái lịch hẹn thành công"));
    }

    private NguoiDung nguoiDung(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
