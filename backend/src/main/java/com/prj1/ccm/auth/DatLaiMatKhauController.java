package com.prj1.ccm.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class DatLaiMatKhauController {
    private final DatLaiMatKhauService service;
    public DatLaiMatKhauController(DatLaiMatKhauService service) { this.service = service; }

    @PostMapping("/quen-mat-khau")
    public ResponseEntity<ThongBaoLoi> quen(@RequestBody YeuCauMa yeuCau) {
        service.yeuCau(yeuCau.soDienThoai());
        return ResponseEntity.accepted().body(new ThongBaoLoi("Nếu tài khoản phù hợp, mã xác thực đã được gửi và có hiệu lực 5 phút. Vui lòng chờ ít nhất 60 giây trước khi yêu cầu lại."));
    }

    @PostMapping("/dat-lai-mat-khau")
    public ResponseEntity<Void> datLai(@RequestBody YeuCauDatLai yeuCau) {
        service.xacNhan(yeuCau.soDienThoai(), yeuCau.maXacThuc(), yeuCau.matKhau());
        return ResponseEntity.noContent().build();
    }
    public record YeuCauMa(String soDienThoai) {}
    public record YeuCauDatLai(String soDienThoai, String maXacThuc, String matKhau) {}
}
