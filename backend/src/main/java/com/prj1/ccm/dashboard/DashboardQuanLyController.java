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
public class DashboardQuanLyController {
    private final DashboardQuanLyService service;

    public DashboardQuanLyController(DashboardQuanLyService service) {
        this.service = service;
    }

    @GetMapping("/quan-ly")
    public DashboardQuanLyService.ThongTinDashboardQuanLy layDashboard(
            @RequestParam(required = false) Long toaNhaId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return service.layDashboard(toaNhaId, nguoiDung);
    }
}

