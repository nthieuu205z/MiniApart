package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tho")
public class ThoDashboardController {
    private final ThoDashboardService thoDashboardService;

    public ThoDashboardController(ThoDashboardService thoDashboardService) {
        this.thoDashboardService = thoDashboardService;
    }

    private NguoiDung layNguoiDung(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    @GetMapping("/tong-quan")
    public ThoDashboardDto.ThoTongQuanDto layTongQuan(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay,
            @RequestParam(required = false) Long toaNhaId,
            HttpServletRequest request
    ) {
        return thoDashboardService.layTongQuan(layNguoiDung(request), tuNgay, denNgay, toaNhaId);
    }

    @GetMapping("/cong-viec")
    public List<ThoDashboardDto.ThongTinViecThoRow> layDanhSachCongViec(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) String nhom,
            @RequestParam(required = false) String mucDo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tuNgay,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate denNgay,
            @RequestParam(required = false) String tuKhoa,
            HttpServletRequest request
    ) {
        return thoDashboardService.layDanhSachCongViec(
                layNguoiDung(request), toaNhaId, trangThai, nhom, mucDo, tuNgay, denNgay, tuKhoa
        );
    }

    @GetMapping("/cong-viec/{id}")
    public ThoDashboardDto.ChiTietViecThoDto layChiTietCongViec(@PathVariable Long id, HttpServletRequest request) {
        return thoDashboardService.layChiTietCongViec(layNguoiDung(request), id);
    }

    @PostMapping("/cong-viec/{id}/khao-sat")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void capNhatKhaoSat(
            @PathVariable Long id,
            @RequestBody ThoDashboardDto.ThoActionRequests.KhaoSatReq req,
            HttpServletRequest request
    ) {
        thoDashboardService.capNhatKhaoSat(layNguoiDung(request), id, req.ghiChuKhaoSat());
    }

    @PostMapping("/cong-viec/{id}/bao-gia")
    @ResponseStatus(HttpStatus.CREATED)
    public BaoGiaSuaChua taoBaoGia(
            @PathVariable Long id,
            @RequestBody ThoDashboardDto.YeuCauTaoBaoGia req,
            HttpServletRequest request
    ) {
        return thoDashboardService.taoBaoGia(layNguoiDung(request), id, req);
    }

    @PostMapping("/cong-viec/{id}/bao-gia/{baoGiaId}/gui-duyet")
    public BaoGiaSuaChua guiDuyetBaoGia(
            @PathVariable Long id,
            @PathVariable Long baoGiaId,
            HttpServletRequest request
    ) {
        return thoDashboardService.guiDuyetBaoGia(layNguoiDung(request), id, baoGiaId);
    }

    @PostMapping("/cong-viec/{id}/bao-xong")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void baoXong(
            @PathVariable Long id,
            @RequestBody(required = false) ThoDashboardDto.ThoActionRequests.BaoXongReq req,
            HttpServletRequest request
    ) {
        thoDashboardService.baoXong(layNguoiDung(request), id, req != null ? req.ketQuaSuaChua() : "Đã hoàn thành sửa chữa");
    }

    @GetMapping("/chung-tu/{id}")
    public ThoDashboardDto.ThoActionRequests.ChungTuThanhToanThoDto layChungTu(@PathVariable Long id, HttpServletRequest request) {
        return thoDashboardService.layChungTu(layNguoiDung(request), id);
    }
}
