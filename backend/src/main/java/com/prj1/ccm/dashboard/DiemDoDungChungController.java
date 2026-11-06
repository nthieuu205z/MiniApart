package com.prj1.ccm.dashboard;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/cong-to-dung-chung")
public class DiemDoDungChungController {
    private final DiemDoDungChungService service;

    public DiemDoDungChungController(DiemDoDungChungService service) {
        this.service = service;
    }

    @GetMapping
    public List<DiemDoDungChungRepository.DiemDoRecord> layDanhSach(
            @RequestParam Long toaNhaId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layDanhSach(nguoiDung, toaNhaId);
    }

    @GetMapping("/chi-so")
    public List<DiemDoDungChungRepository.ChiSoDungChungRecord> layChiSoTheoKy(
            @RequestParam Long kyId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layChiSoTheoKy(nguoiDung, kyId);
    }

    @PostMapping("/ghi-chi-so")
    public void ghiChiSo(
            @RequestBody YeuCauGhiChiSo yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        service.ghiChiSo(nguoiDung, yeuCau);
    }

    @GetMapping("/doi-soat")
    public DoiSoatDienNuocService.KetQuaDoiSoat doiSoat(
            @RequestParam Long toaNhaId,
            @RequestParam Long kyId,
            @RequestParam(defaultValue = "DIEN") String loaiDichVu,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.doiSoat(nguoiDung, toaNhaId, kyId, loaiDichVu);
    }

    public record YeuCauGhiChiSo(
            Long diemDoId,
            Long kyId,
            BigDecimal chiSoDau,
            BigDecimal chiSoCuoi,
            boolean coThayCongTo,
            BigDecimal chiSoCuoiCongToCu,
            BigDecimal chiSoDauCongToMoi,
            String ghiChu
    ) {}
}
