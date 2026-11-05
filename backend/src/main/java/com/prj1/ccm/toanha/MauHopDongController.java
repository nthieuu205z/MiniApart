package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/toa-nha/{toaNhaId}/mau-hop-dong")
public class MauHopDongController {
    private final MauHopDongRepository mauHopDongRepository;
    private final PhanQuyenToaService phanQuyenToaService;

    public MauHopDongController(MauHopDongRepository mauHopDongRepository, PhanQuyenToaService phanQuyenToaService) {
        this.mauHopDongRepository = mauHopDongRepository;
        this.phanQuyenToaService = phanQuyenToaService;
    }

    @GetMapping
    public List<MauHopDongDto> danhSachMau(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        kiemTraQuyen(user, toaNhaId);
        return mauHopDongRepository.findAllByToaNhaId(toaNhaId).stream()
                .map(MauHopDongDto::tu)
                .toList();
    }

    @GetMapping("/published")
    public MauHopDongDto layMauHienTai(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        kiemTraQuyen(user, toaNhaId);
        return mauHopDongRepository.findPublishedByToaNhaId(toaNhaId)
                .map(MauHopDongDto::tu)
                .orElse(null);
    }

    @GetMapping("/chuan")
    public MauHopDongDto layMauChuan(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        kiemTraQuyen(user, toaNhaId);
        return new MauHopDongDto(
                null,
                toaNhaId,
                MauHopDongChuan.TEN_MAU_CHUAN,
                1,
                "PUBLISHED",
                MauHopDongChuan.TIEU_DE_CHUAN,
                MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN,
                null,
                null,
                null
        );
    }

    @PostMapping
    public MauHopDongDto taoPhienBanMoi(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauMauHopDong req,
            HttpServletRequest request
    ) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        kiemTraQuyen(user, toaNhaId);

        if (req.noiDungDieuKhoan() == null || req.noiDungDieuKhoan().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung điều khoản mẫu không được để trống.");
        }

        Long newId = mauHopDongRepository.insertNewVersion(toaNhaId, req, user != null ? user.id() : null);
        return mauHopDongRepository.findById(newId)
                .map(MauHopDongDto::tu)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    private void kiemTraQuyen(NguoiDung user, Long toaNhaId) {
        if (user == null || (user.vaiTro() != VaiTro.CHU && user.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền truy cập mẫu hợp đồng.");
        }
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(user, toaNhaId);
    }
}
