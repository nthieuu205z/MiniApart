package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/toa-nha/{toaNhaId}/ben-a")
public class CauHinhBenAController {
    private final CauHinhBenARepository cauHinhBenARepository;
    private final PhanQuyenToaService phanQuyenToaService;

    public CauHinhBenAController(CauHinhBenARepository cauHinhBenARepository, PhanQuyenToaService phanQuyenToaService) {
        this.cauHinhBenARepository = cauHinhBenARepository;
        this.phanQuyenToaService = phanQuyenToaService;
    }

    @GetMapping
    public CauHinhBenADto layCauHinh(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        kiemTraQuyen(user, toaNhaId);
        return cauHinhBenARepository.findByToaNhaId(toaNhaId)
                .map(CauHinhBenADto::tu)
                .orElse(null);
    }

    @PutMapping
    public CauHinhBenADto luuCauHinh(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauCauHinhBenA req,
            HttpServletRequest request
    ) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        kiemTraQuyen(user, toaNhaId);

        if (req.tenChuThe() == null || req.tenChuThe().isBlank()
                || req.maSoDinhDanh() == null || req.maSoDinhDanh().isBlank()
                || req.diaChiLienHe() == null || req.diaChiLienHe().isBlank()
                || req.soDienThoai() == null || req.soDienThoai().isBlank()
                || req.hoTenNguoiKy() == null || req.hoTenNguoiKy().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin bắt buộc của Bên A (Tên, mã định danh, địa chỉ, số điện thoại, người ký).");
        }

        cauHinhBenARepository.upsert(toaNhaId, req);
        return cauHinhBenARepository.findByToaNhaId(toaNhaId)
                .map(CauHinhBenADto::tu)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    private void kiemTraQuyen(NguoiDung user, Long toaNhaId) {
        if (user == null || (user.vaiTro() != VaiTro.CHU && user.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền thao tác cấu hình Bên A.");
        }
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(user, toaNhaId);
    }
}
