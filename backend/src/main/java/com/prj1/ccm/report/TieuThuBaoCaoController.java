package com.prj1.ccm.report;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** FR-RPT-02/FR-RPT-05 exposes the owner-only electricity and water consumption report. */
@RestController
@RequestMapping("/api/bao-cao")
public class TieuThuBaoCaoController {
    private final TieuThuBaoCaoService service;

    public TieuThuBaoCaoController(TieuThuBaoCaoService service) {
        this.service = service;
    }

    /** FR-RPT-02/FR-RPT-05 filters by building, room and period while keeping one report timestamp. */
    @GetMapping("/tieu-thu")
    public ThongTinTieuThuBaoCao tieuThu(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) Long phongId,
            @RequestParam(required = false) Long kyId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layTieuThu(toaNhaId, phongId, kyId, nguoiDung);
    }
}
