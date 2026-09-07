package com.prj1.ccm.billing;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/toa-nha/{toaNhaId}/ky-thanh-toan/{kyId}/hoa-don")
public class HoaDonController {
    private final TinhDuThaoHoaDonService tinhDuThaoHoaDonService;
    private final TaoHoaDonHangLoatService taoHoaDonHangLoatService;
    private final HuyHoaDonNhapService huyHoaDonNhapService;
    private final NoiDungHoaDonService noiDungHoaDonService;
    private final PhatHanhHoaDonService phatHanhHoaDonService;
    private final HoaDonChiTietService hoaDonChiTietService;
    private final ThanhToanService thanhToanService;
    private final MaQrChuyenKhoanService maQrChuyenKhoanService;
    private final HoaDonPdfService hoaDonPdfService;

    public HoaDonController(
            TinhDuThaoHoaDonService tinhDuThaoHoaDonService,
            TaoHoaDonHangLoatService taoHoaDonHangLoatService,
            HuyHoaDonNhapService huyHoaDonNhapService,
            NoiDungHoaDonService noiDungHoaDonService,
            PhatHanhHoaDonService phatHanhHoaDonService,
            HoaDonChiTietService hoaDonChiTietService,
            ThanhToanService thanhToanService,
            MaQrChuyenKhoanService maQrChuyenKhoanService,
            HoaDonPdfService hoaDonPdfService
    ) {
        this.tinhDuThaoHoaDonService = tinhDuThaoHoaDonService;
        this.taoHoaDonHangLoatService = taoHoaDonHangLoatService;
        this.huyHoaDonNhapService = huyHoaDonNhapService;
        this.noiDungHoaDonService = noiDungHoaDonService;
        this.phatHanhHoaDonService = phatHanhHoaDonService;
        this.hoaDonChiTietService = hoaDonChiTietService;
        this.thanhToanService = thanhToanService;
        this.maQrChuyenKhoanService = maQrChuyenKhoanService;
        this.hoaDonPdfService = hoaDonPdfService;
    }

    /**
     * FR-INV-01 and CR-002 calculate one draft invoice candidate from database state without persisting it.
     * Task 5 extends this boundary for bulk draft invoice persistence.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hopDongId the contract to calculate
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the calculated draft invoice candidate
     */
    @GetMapping("/tinh-thu")
    public ThongTinTinhHoaDon tinhThuHoaDon(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @RequestParam Long hopDongId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return tinhDuThaoHoaDonService.tinhThuHoaDon(toaNhaId, kyId, hopDongId, nguoiDung);
    }

    /**
     * FR-INV-01, FR-INV-03, FR-INV-04, and FR-INV-07 create draft invoices in bulk for every
     * active contract in the selected period, skip incomplete rooms with categorized reasons,
     * and rely on database uniqueness to avoid duplicates on reruns.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the bulk creation summary with created, existing, and skipped-room counts
     */
    @PostMapping("/tao-hang-loat")
    public ThongTinTaoHoaDonHangLoat taoHoaDonHangLoat(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return taoHoaDonHangLoatService.taoHoaDonHangLoat(toaNhaId, kyId, nguoiDung);
    }

    /**
     * FR-INV-08 publishes every eligible draft invoice in one payment period and returns a summary
     * for published, already-transitioned, and skipped invoices. Tenant notification is deferred to Slice 08.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the bulk publication summary
     */
    @PostMapping("/phat-hanh-hang-loat")
    public ThongTinPhatHanhHoaDonHangLoat phatHanhHangLoat(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return phatHanhHoaDonService.phatHanhHangLoat(toaNhaId, kyId, nguoiDung);
    }

    /**
     * FR-INV-06 and BR-08 release one draft invoice after the centralized lifecycle rule confirms
     * the transition from NHAP to DA_PHAT_HANH is valid.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return no content after the invoice is released
     */
    @PostMapping("/{hoaDonId}/phat-hanh")
    public ResponseEntity<Void> phatHanh(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        phatHanhHoaDonService.phatHanh(toaNhaId, kyId, hoaDonId, nguoiDung);
        return ResponseEntity.noContent().build();
    }

    /**
     * FR-INV-05 and BR-08 add a manual surcharge or reduction with a reason to a draft invoice only.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param yeuCau the manual invoice-content command
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return created response pointing at the new invoice detail row
     */
    @PostMapping("/{hoaDonId}/noi-dung")
    public ResponseEntity<Void> themNoiDung(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            @RequestBody YeuCauNoiDungHoaDon yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        Long chiTietId = noiDungHoaDonService.them(toaNhaId, kyId, hoaDonId, yeuCau, nguoiDung);
        return ResponseEntity.created(URI.create(
                "/api/toa-nha/" + toaNhaId + "/ky-thanh-toan/" + kyId + "/hoa-don/" + hoaDonId + "/noi-dung/" + chiTietId
        )).build();
    }

    /**
     * FR-INV-05, FR-INV-06, and BR-08 cancel one draft invoice or one issued invoice after checking
     * the centralized lifecycle rule. Draft cancellation restores consumed pending extras; issued
     * invoice cancellation requires an owner-provided reason and writes audit.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param yeuCau the optional cancellation command carrying a reason for issued invoices
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return no content after cancellation finishes
     */
    @PostMapping("/{hoaDonId}/huy")
    public ResponseEntity<Void> huyHoaDonNhap(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            @RequestBody(required = false) YeuCauHuyHoaDon yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        huyHoaDonNhapService.huy(toaNhaId, kyId, hoaDonId, yeuCau, nguoiDung);
        return ResponseEntity.noContent().build();
    }

    /**
     * FR-INV-11, FR-INV-12, FR-INV-13, FR-INV-14, and BR-18 record one immutable payment entry,
     * recalculate the algebraic paid total, update the invoice lifecycle, and return its receipt.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param yeuCau the payment command
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the created payment receipt and updated invoice totals
     */
    @PostMapping("/{hoaDonId}/thanh-toan")
    public ResponseEntity<ThongTinThanhToan> ghiNhanThanhToan(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            @RequestBody YeuCauThanhToan yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        ThongTinThanhToan ketQua = thanhToanService.ghiNhan(toaNhaId, kyId, hoaDonId, yeuCau, nguoiDung);
        return ResponseEntity.created(URI.create(
                "/api/thanh-toan/" + ketQua.thanhToanId()
        )).body(ketQua);
    }

    /**
     * FR-INV-10 issues a 900-second signed link for a current bank-transfer QR code whose account,
     * amount, and payment content come from the selected invoice and its building.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the signed link for the generated QR image
     */
    @GetMapping("/{hoaDonId}/ma-qr-chuyen-khoan")
    public ResponseEntity<LienKetMaQrChuyenKhoan> maQrChuyenKhoan(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(maQrChuyenKhoanService.taoLienKet(toaNhaId, kyId, hoaDonId, nguoiDung));
    }

    /**
     * FR-INV-10 validates a path-bound, time-limited QR link and regenerates the current PNG without
     * requiring a JWT or persisting the payload/image.
     *
     * @param toaNhaId the building identifier bound into the signature
     * @param kyId the payment-period identifier bound into the signature
     * @param hoaDonId the invoice identifier bound into the signature
     * @param hetHan the signed Unix expiry second
     * @param chuKy the HMAC signature
     * @param request the current HTTP request, used to reject duplicate signed parameters
     * @return the regenerated QR image
     */
    @GetMapping(value = "/{hoaDonId}/ma-qr-chuyen-khoan/xem", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> xemMaQrChuyenKhoan(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            @RequestParam long hetHan,
            @RequestParam String chuKy,
            HttpServletRequest request
    ) {
        if (coNhieuGiaTri(request, "hetHan") || coNhieuGiaTri(request, "chuKy")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Liên kết mã QR không hợp lệ hoặc đã hết hạn");
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_PNG)
                .body(maQrChuyenKhoanService.taoAnh(toaNhaId, kyId, hoaDonId, hetHan, chuKy));
    }

    private boolean coNhieuGiaTri(HttpServletRequest request, String tenThamSo) {
        String[] giaTri = request.getParameterValues(tenThamSo);
        return giaTri != null && giaTri.length != 1;
    }

    /**
     * FR-INV-02 opens one invoice with hand-recomputable detail, tier snapshots, resident context,
     * and signed meter-photo links that expire after 15 minutes.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the complete printable invoice representation
     */
    @GetMapping("/{hoaDonId}")
    public ThongTinHoaDonChiTiet chiTiet(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return hoaDonChiTietService.chiTiet(toaNhaId, kyId, hoaDonId, nguoiDung);
    }

    /**
     * FR-INV-09 exports one issued invoice as a Vietnamese PDF with every hand-recomputable line and tier row.
     *
     * @param toaNhaId the building identifier
     * @param kyId the payment-period identifier
     * @param hoaDonId the invoice identifier
     * @param request the current HTTP request carrying the authenticated user attribute
     * @return the generated PDF invoice
     */
    @GetMapping(value = "/{hoaDonId}/xuat-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> xuatPdf(
            @PathVariable Long toaNhaId,
            @PathVariable Long kyId,
            @PathVariable Long hoaDonId,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=hoa-don-" + hoaDonId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(hoaDonPdfService.xuatHoaDon(toaNhaId, kyId, hoaDonId, nguoiDung));
    }
}
