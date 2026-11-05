package com.prj1.ccm.report;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** FR-RPT-01/FR-RPT-02 exposes the owner-only financial and operational overview. */
@RestController
@RequestMapping("/api/bao-cao")
public class TongQuanBaoCaoController {
    private final TongQuanBaoCaoService service;

    public TongQuanBaoCaoController(TongQuanBaoCaoService service) {
        this.service = service;
    }

    /** FR-RPT-01/FR-RPT-02 returns one permission-filtered snapshot for the selected date range. */
    @GetMapping("/tong-quan")
    public ThongTinTongQuanBaoCao tongQuan(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) String tuNgay,
            @RequestParam(required = false) String denNgay,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layTongQuan(toaNhaId, tuNgay, denNgay, nguoiDung);
    }
}
