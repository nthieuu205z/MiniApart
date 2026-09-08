package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tho")
public class ThoSuaChuaController {
    private final YeuCauSuaChuaService yeuCauSuaChuaService;

    public ThoSuaChuaController(YeuCauSuaChuaService yeuCauSuaChuaService) {
        this.yeuCauSuaChuaService = yeuCauSuaChuaService;
    }

    /** FR-MNT-04 exposes one combined call for the assigned worker's work list. */
    @GetMapping("/viec-cua-toi")
    public List<ThongTinYeuCauSuaChua> viecCuaToi(HttpServletRequest request) {
        return yeuCauSuaChuaService.viecCuaToi(
                (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE)
        );
    }
}
