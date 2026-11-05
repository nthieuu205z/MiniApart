package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

/** FR-MNT-01/FR-POR-04: tenant repair history derives identity from the authenticated session. */
@RestController
public class CongSuaChuaController {
    private final YeuCauSuaChuaService service;
    public CongSuaChuaController(YeuCauSuaChuaService service) { this.service = service; }
    @GetMapping("/api/cong/yeu-cau-sua-chua")
    public List<ThongTinYeuCauSuaChua> danhSach(@RequestParam(required = false) String trangThai, HttpServletRequest request) {
        TrangThaiYeuCau loc = null;
        if (trangThai != null && !trangThai.isBlank()) {
            try { loc = TrangThaiYeuCau.valueOf(trangThai); }
            catch (IllegalArgumentException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái sửa chữa không hợp lệ."); }
        }
        return service.danhSachCuaNguoiThue(loc, (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE));
    }
}
