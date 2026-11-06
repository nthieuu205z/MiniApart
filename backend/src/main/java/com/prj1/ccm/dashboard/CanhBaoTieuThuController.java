package com.prj1.ccm.dashboard;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/canh-bao-tieu-thu")
public class CanhBaoTieuThuController {
    private final CanhBaoTieuThuRepository repository;
    private final PhanQuyenToaService phanQuyenToaService;

    public CanhBaoTieuThuController(
            CanhBaoTieuThuRepository repository,
            PhanQuyenToaService phanQuyenToaService
    ) {
        this.repository = repository;
        this.phanQuyenToaService = phanQuyenToaService;
    }

    @GetMapping
    public List<CanhBaoTieuThuRepository.CanhBaoRecord> layDanhSach(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) String trangThai,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        if (toaNhaId != null) {
            phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        }
        return repository.findCanhBao(nguoiDung.id(), toaNhaId, trangThai);
    }

    @PostMapping("/{id}/trang-thai")
    public void capNhatTrangThai(
            @PathVariable Long id,
            @RequestBody YeuCauCapNhatTrangThai yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        var record = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cảnh báo."));

        // Kiểm tra quyền tòa nhà
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, record.toaNhaId());

        if (yeuCau.trangThai() == null || yeuCau.trangThai().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không được để trống.");
        }

        repository.capNhatTrangThai(id, yeuCau.trangThai(), nguoiDung.id(), yeuCau.ghiChu());
    }

    public record YeuCauCapNhatTrangThai(String trangThai, String ghiChu) {}
}

