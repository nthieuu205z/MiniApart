package com.prj1.ccm.billing;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/hop-dong/{hopDongId}/khoan-phat-sinh")
public class KhoanPhatSinhController {
    private final KhoanPhatSinhService khoanPhatSinhService;

    public KhoanPhatSinhController(KhoanPhatSinhService khoanPhatSinhService) {
        this.khoanPhatSinhService = khoanPhatSinhService;
    }

    /**
     * FR-INV-05 records one pending surcharge or discount against a contract so the next draft invoice
     * can consume it exactly once after application-layer source validation.
     *
     * @param hopDongId the contract identifier
     * @param yeuCau the submitted pending-extra command
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the created pending extra in CHO_TINH state
     */
    @PostMapping
    public ResponseEntity<ThongTinKhoanPhatSinh> tao(
            @PathVariable Long hopDongId,
            @RequestBody YeuCauKhoanPhatSinh yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        ThongTinKhoanPhatSinh thongTin = khoanPhatSinhService.tao(hopDongId, yeuCau, nguoiDung);
        return ResponseEntity.created(URI.create("/api/hop-dong/" + hopDongId + "/khoan-phat-sinh/" + thongTin.id()))
                .body(thongTin);
    }
}
