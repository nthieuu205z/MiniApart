package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/phong")
public class BangGiaPhongController {
    private final BangGiaDichVuService bangGiaDichVuService;

    public BangGiaPhongController(BangGiaDichVuService bangGiaDichVuService) {
        this.bangGiaDichVuService = bangGiaDichVuService;
    }

    @GetMapping("/{phongId}/bang-gia-dich-vu")
    public List<ThongTinGiaDichVuPhong> danhSachGiaDichVuPhong(
            @PathVariable Long phongId,
            HttpServletRequest request
    ) {
        return bangGiaDichVuService.danhSachGiaDichVuPhong(phongId, nguoiDungHienTai(request));
    }

    @PostMapping("/{phongId}/dich-vu/{dichVuId}/bang-gia")
    public ResponseEntity<ThongTinGiaDichVuPhong> themBangGiaPhong(
            @PathVariable Long phongId,
            @PathVariable Long dichVuId,
            @RequestBody YeuCauBangGia yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bangGiaDichVuService.themBangGiaPhong(phongId, dichVuId, yeuCau, nguoiDungHienTai(request)));
    }

    @DeleteMapping("/{phongId}/bang-gia/{bangGiaPhongId}")
    public ResponseEntity<Void> xoaBangGiaPhong(
            @PathVariable Long phongId,
            @PathVariable Long bangGiaPhongId,
            HttpServletRequest request
    ) {
        bangGiaDichVuService.xoaBangGiaPhong(phongId, bangGiaPhongId, nguoiDungHienTai(request));
        return ResponseEntity.noContent().build();
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}

