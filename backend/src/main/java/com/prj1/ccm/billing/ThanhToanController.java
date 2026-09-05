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
@RequestMapping("/api/thanh-toan")
public class ThanhToanController {
    private final ThanhToanService thanhToanService;

    public ThanhToanController(ThanhToanService thanhToanService) {
        this.thanhToanService = thanhToanService;
    }

    /**
     * FR-INV-14, CR-010, and BR-18 create an immutable negative counter-entry for a payment.
     *
     * @param thanhToanId the original payment-entry identifier
     * @param yeuCau the counter-entry amount and mandatory reason
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the created counter-entry and recalculated invoice totals
     */
    @PostMapping("/{thanhToanId}/doi-ung")
    public ResponseEntity<ThongTinThanhToan> doiUng(
            @PathVariable Long thanhToanId,
            @RequestBody YeuCauDoiUng yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        ThongTinThanhToan ketQua = thanhToanService.ghiNhanDoiUng(thanhToanId, yeuCau, nguoiDung);
        return ResponseEntity.created(URI.create("/api/thanh-toan/" + ketQua.thanhToanId())).body(ketQua);
    }
}
