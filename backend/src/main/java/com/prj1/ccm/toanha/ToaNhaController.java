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
    private final DanhMucPhongService danhMucPhongService;

    public ToaNhaController(
            PhanQuyenToaService phanQuyenToaService,
            DanhMucToaNhaService danhMucToaNhaService,
            DanhMucPhongService danhMucPhongService
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.danhMucToaNhaService = danhMucToaNhaService;
        this.danhMucPhongService = danhMucPhongService;
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

    /**
     * FR-BLD-02 lists rooms in one visible building and optionally filters them by floor.
     *
     * @param toaNhaId the building identifier
     * @param tang the optional floor filter
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the room list inside the selected building
     */
    @GetMapping("/{toaNhaId}/phong")
    public List<ThongTinPhong> danhSachPhong(
            @PathVariable Long toaNhaId,
            Integer tang,
            HttpServletRequest request
    ) {
        return danhMucPhongService.danhSachPhong(toaNhaId, tang, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-02 creates a single room inside one visible building with system-owned initial TRONG status.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted room data without client-owned status
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly created room
     */
    @PostMapping("/{toaNhaId}/phong")
    public ResponseEntity<ThongTinPhong> taoPhong(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauPhong yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucPhongService.taoPhong(toaNhaId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-02 previews a consecutive room range before any persistence.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted room-range template
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the non-persistent preview list
     */
    @PostMapping("/{toaNhaId}/phong/hang-loat/xem-truoc")
    public KetQuaPhongHangLoat xemTruocPhongHangLoat(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauPhongHangLoat yeuCau,
            HttpServletRequest request
    ) {
        return danhMucPhongService.xemTruocPhongHangLoat(toaNhaId, yeuCau, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-02 confirms and creates a previously previewed consecutive room range.
     *
     * @param toaNhaId the building identifier
     * @param yeuCau the submitted room-range template
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the created room list
     */
    @PostMapping("/{toaNhaId}/phong/hang-loat")
    public ResponseEntity<KetQuaPhongHangLoat> taoPhongHangLoat(
            @PathVariable Long toaNhaId,
            @RequestBody YeuCauPhongHangLoat yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(danhMucPhongService.taoPhongHangLoat(toaNhaId, yeuCau, nguoiDungHienTai(request)));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
