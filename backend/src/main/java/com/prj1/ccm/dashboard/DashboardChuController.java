package com.prj1.ccm.dashboard;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardChuController {
    private final DashboardChuService service;

    public DashboardChuController(DashboardChuService service) {
        this.service = service;
    }

    @GetMapping("/chu")
    public DashboardChuService.ThongTinDashboardChu layDashboard(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) String tuNgay,
            @RequestParam(required = false) String denNgay,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layDashboard(toaNhaId, tuNgay, denNgay, nguoiDung);
    }
}

