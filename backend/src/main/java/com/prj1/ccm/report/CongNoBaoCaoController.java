package com.prj1.ccm.report;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.billing.ThongTinHoaDonChiTiet;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** FR-RPT-02/FR-RPT-03 exposes the owner-only debt report and its invoice drill-down. */
@RestController
@RequestMapping("/api/bao-cao/cong-no")
public class CongNoBaoCaoController {
    private final CongNoBaoCaoService service;

    public CongNoBaoCaoController(CongNoBaoCaoService service) {
        this.service = service;
    }

    /** FR-RPT-02 returns a permission-filtered, server-sorted list of unpaid invoices. */
    @GetMapping
    public ThongTinCongNoBaoCao congNo(
            @RequestParam(required = false) Long toaNhaId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layCongNo(toaNhaId, nguoiDung);
    }

    /** FR-RPT-03 opens exactly the scoped invoice identified by a debt row, including a null-period settlement invoice. */
    @GetMapping("/hoa-don/{hoaDonId}")
    public ThongTinHoaDonChiTiet chiTietHoaDon(
            @PathVariable Long hoaDonId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.chiTietHoaDon(hoaDonId, nguoiDung);
    }
}
