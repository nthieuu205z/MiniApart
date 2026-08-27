package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/toa-nha")
public class ToaNhaController {
    private final PhanQuyenToaService phanQuyenToaService;
    private final DanhMucToaNhaService danhMucToaNhaService;

    public ToaNhaController(
            PhanQuyenToaService phanQuyenToaService,
            DanhMucToaNhaService danhMucToaNhaService
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.danhMucToaNhaService = danhMucToaNhaService;
    }

    /**
     * FR-BLD-01 building catalog listing is filtered to only the buildings visible to the authenticated user.
     * FR-AUT-05 enforces that the authenticated user only receives buildings within assigned scope.
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

    /**
     * FR-BLD-01 creates a new building for the owner or system administrator catalog flow.
     *
     * @param yeuCau the submitted building data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created building
     */
    @PostMapping
    public ResponseEntity<ThongTinToaNha> taoToaNha(
            @RequestBody YeuCauToaNha yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucToaNhaService.tao(yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-01 updates a visible building for the owner, manager, or system administrator.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted building data
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the updated building
     */
    @PutMapping("/{toaNhaId}")
    public ThongTinToaNha capNhatToaNha(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauToaNha yeuCau,
            HttpServletRequest request
    ) {
        return danhMucToaNhaService.capNhat(toaNhaId, yeuCau, nguoiDungHienTai(request));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
