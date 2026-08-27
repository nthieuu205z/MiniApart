package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/toa-nha")
public class ToaNhaController {
    private final PhanQuyenToaService phanQuyenToaService;

    public ToaNhaController(PhanQuyenToaService phanQuyenToaService) {
        this.phanQuyenToaService = phanQuyenToaService;
    }

    /**
     * FR-AUT-05 returns only the buildings visible to the authenticated user.
     *
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the building list filtered on the server by PHAN_QUYEN_TOA
     */
    @GetMapping
    public List<ThongTinToaNha> danhSachToaNha(HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return phanQuyenToaService.danhSachToaNhaNguoiDungDuocXem(nguoiDung)
                .stream()
                .map(ThongTinToaNha::tuToaNha)
                .toList();
    }

    /**
     * FR-AUT-05 returns a building detail only when the authenticated user is assigned to it.
     *
     * @param toaNhaId the requested building identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the requested building detail
     */
    @GetMapping("/{toaNhaId}")
    public ThongTinToaNha chiTietToaNha(@PathVariable Long toaNhaId, HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return ThongTinToaNha.tuToaNha(
                phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId)
        );
    }
}
