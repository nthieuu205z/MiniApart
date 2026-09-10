package com.prj1.ccm.thongbao;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/toa-nha/{toaNhaId}/bang-viec")
public class BangViecVanHanhController {
    private final BangViecVanHanhService bangViecVanHanhService;

    public BangViecVanHanhController(BangViecVanHanhService bangViecVanHanhService) {
        this.bangViecVanHanhService = bangViecVanHanhService;
    }

    /**
     * FR-NTF-01 returns the server-scoped operational dashboard for one building.
     * NFR-SEC-03 keeps the default-deny decision at the service boundary.
     *
     * @param toaNhaId the requested building identifier
     * @param request the request containing the authenticated user
     * @return the four actionable operational groups and the explicit PCCC source state
     */
    @GetMapping
    public ThongTinBangViecVanHanh layBangViec(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return bangViecVanHanhService.layBangViec(toaNhaId, nguoiDung);
    }
}
