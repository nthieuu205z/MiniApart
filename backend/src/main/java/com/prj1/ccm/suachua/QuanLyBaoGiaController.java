package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/yeu-cau-sua-chua")
public class QuanLyBaoGiaController {
    private final ThoDashboardService thoDashboardService;
    private final BaoGiaSuaChuaRepository baoGiaSuaChuaRepository;
    private final ThanhToanThoRepository thanhToanThoRepository;

    public QuanLyBaoGiaController(
            ThoDashboardService thoDashboardService,
            BaoGiaSuaChuaRepository baoGiaSuaChuaRepository,
            ThanhToanThoRepository thanhToanThoRepository
    ) {
        this.thoDashboardService = thoDashboardService;
        this.baoGiaSuaChuaRepository = baoGiaSuaChuaRepository;
        this.thanhToanThoRepository = thanhToanThoRepository;
    }

    private NguoiDung layNguoiDung(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    @GetMapping("/{id}/bao-gia")
    public List<BaoGiaSuaChua> layDanhSachBaoGia(@PathVariable Long id) {
        return baoGiaSuaChuaRepository.findByYeuCauId(id);
    }

    @GetMapping("/{id}/thanh-toan-tho")
    public List<ThanhToanTho> layDanhSachThanhToan(@PathVariable Long id) {
        return thanhToanThoRepository.findByYeuCauId(id);
    }

    @PostMapping("/{id}/bao-gia/{baoGiaId}/duyet")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void duyetBaoGia(
            @PathVariable Long id,
            @PathVariable Long baoGiaId,
            HttpServletRequest request
    ) {
        thoDashboardService.duyetBaoGia(layNguoiDung(request), id, baoGiaId);
    }

    @PostMapping("/{id}/bao-gia/{baoGiaId}/tu-choi")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void tuChoiBaoGia(
            @PathVariable Long id,
            @PathVariable Long baoGiaId,
            @RequestBody ThoDashboardDto.ThoActionRequests.TuChoiBaoGiaReq req,
            HttpServletRequest request
    ) {
        thoDashboardService.tuChoiBaoGia(layNguoiDung(request), id, baoGiaId, req.lyDoTuChoi());
    }

    @PostMapping("/{id}/thanh-toan-tho")
    public ThanhToanTho ghiNhanThanhToan(
            @PathVariable Long id,
            @RequestBody ThoDashboardDto.ThoActionRequests.GhiNhanThanhToanReq req,
            HttpServletRequest request
    ) {
        return thoDashboardService.ghiNhanThanhToan(layNguoiDung(request), id, req);
    }

    @GetMapping("/{id}/chung-tu-thanh-toan")
    public ThoDashboardDto.ThoActionRequests.ChungTuThanhToanThoDto layChungTu(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        return thoDashboardService.layChungTu(layNguoiDung(request), id);
    }
}
