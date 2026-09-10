package com.prj1.ccm.report;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** FR-RPT-04 exposes the owner-only maintenance-cost report. */
@RestController
@RequestMapping("/api/bao-cao")
public class ChiPhiBaoTriBaoCaoController {
    private final ChiPhiBaoTriBaoCaoService service;

    public ChiPhiBaoTriBaoCaoController(ChiPhiBaoTriBaoCaoService service) {
        this.service = service;
    }

    /** FR-RPT-04 filters repairs by assigned building, room, and inclusive local calendar dates. */
    @GetMapping("/chi-phi-bao-tri")
    public ThongTinChiPhiBaoTriBaoCao chiPhi(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) Long phongId,
            @RequestParam String tuNgay,
            @RequestParam String denNgay,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layChiPhi(toaNhaId, phongId, tuNgay, denNgay, nguoiDung);
    }
}
