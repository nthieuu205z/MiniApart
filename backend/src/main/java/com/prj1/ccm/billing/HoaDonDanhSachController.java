package com.prj1.ccm.billing;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** FR-NTF-01 exposes the invoice worklist route opened by the operational dashboard. */
@RestController
@RequestMapping("/api/hoa-don")
public class HoaDonDanhSachController {
    private final HoaDonDanhSachService hoaDonDanhSachService;

    public HoaDonDanhSachController(HoaDonDanhSachService hoaDonDanhSachService) {
        this.hoaDonDanhSachService = hoaDonDanhSachService;
    }

    /**
     * FR-NTF-01 returns the invoices visible to CHU or QUAN_LY for one building.
     *
     * @param toaNhaId the building filter
     * @param trangThai NO_QUA_HAN or an optional stored invoice status
     * @param request the authenticated request
     * @return the scoped invoice worklist
     */
    @GetMapping
    public List<ThongTinHoaDonDanhSach> danhSach(
            @RequestParam Long toaNhaId,
            @RequestParam(required = false) String trangThai,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return hoaDonDanhSachService.danhSach(toaNhaId, trangThai, nguoiDung);
    }
}
