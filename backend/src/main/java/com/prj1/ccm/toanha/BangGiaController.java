package com.prj1.ccm.toanha;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dich-vu")
public class BangGiaController {
    private final BangGiaDichVuService bangGiaDichVuService;

    public BangGiaController(BangGiaDichVuService bangGiaDichVuService) {
        this.bangGiaDichVuService = bangGiaDichVuService;
    }

    /**
     * FR-BLD-06 lists the immutable fixed-price history of one visible service and marks the row applicable today.
     *
     * @param dichVuId the service identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the complete fixed-price history for the requested service
     */
    @GetMapping(value = "/{dichVuId}/bang-gia", params = "!ngay")
    public List<ThongTinBangGia> danhSachBangGia(@PathVariable Long dichVuId, HttpServletRequest request) {
        return bangGiaDichVuService.danhSachBangGia(dichVuId, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-06 finds the fixed-price row whose effective date is the latest one not after the requested date.
     *
     * @param dichVuId the service identifier
     * @param ngay the requested lookup date
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the price row applicable on the requested date
     */
    @GetMapping(value = "/{dichVuId}/bang-gia", params = "ngay")
    public ThongTinBangGia layBangGiaTheoNgay(
            @PathVariable Long dichVuId,
            @RequestParam LocalDate ngay,
            HttpServletRequest request
    ) {
        return bangGiaDichVuService.layBangGiaTheoNgay(dichVuId, ngay, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-06 appends one new fixed-price row without mutating any existing historical row.
     *
     * @param dichVuId the service identifier
     * @param yeuCau the submitted price row
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly appended price row
     */
    @PostMapping("/{dichVuId}/bang-gia")
    public ResponseEntity<ThongTinBangGia> themBangGia(
            @PathVariable Long dichVuId,
            @RequestBody YeuCauBangGia yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bangGiaDichVuService.themBangGia(dichVuId, yeuCau, nguoiDungHienTai(request)));
    }

    /**
     * FR-BLD-08 lists every historical tier set for one visible electricity service and marks the set applicable today.
     *
     * @param dichVuId the service identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the complete tier-set history for the requested service
     */
    @GetMapping(value = "/{dichVuId}/bac-thang", params = "!ngay")
    public List<ThongTinBangGiaBacThang> danhSachBangGiaBacThang(@PathVariable Long dichVuId, HttpServletRequest request) {
        return bangGiaDichVuService.danhSachBangGiaBacThang(dichVuId, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-08 finds the tier set whose effective date is the latest one not after the requested date.
     *
     * @param dichVuId the service identifier
     * @param ngay the requested lookup date
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the tier set applicable on the requested date
     */
    @GetMapping(value = "/{dichVuId}/bac-thang", params = "ngay")
    public ThongTinBangGiaBacThang layBangGiaBacThangTheoNgay(
            @PathVariable Long dichVuId,
            @RequestParam LocalDate ngay,
            HttpServletRequest request
    ) {
        return bangGiaDichVuService.layBangGiaBacThangTheoNgay(dichVuId, ngay, nguoiDungHienTai(request));
    }

    /**
     * FR-BLD-07, FR-BLD-08 appends one new tiered electricity price set without mutating any existing historical set.
     *
     * @param dichVuId the service identifier
     * @param yeuCau the submitted tier set and average retail electricity price
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the newly appended tier set
     */
    @PostMapping("/{dichVuId}/bac-thang")
    public ResponseEntity<ThongTinBangGiaBacThang> themBangGiaBacThang(
            @PathVariable Long dichVuId,
            @RequestBody YeuCauBangGiaBacThang yeuCau,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bangGiaDichVuService.themBangGiaBacThang(dichVuId, yeuCau, nguoiDungHienTai(request)));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
