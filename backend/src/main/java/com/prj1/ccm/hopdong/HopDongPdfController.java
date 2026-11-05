package com.prj1.ccm.hopdong;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HopDongPdfController {
    private final HopDongPdfService service;

    public HopDongPdfController(HopDongPdfService service) { this.service = service; }

    /** FR-TNT-06/FR-POR-04 exports the authorized contract using the configured template. */
    @GetMapping(value = "/api/hop-dong/{hopDongId}/xuat-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> xuat(@PathVariable Long hopDongId, HttpServletRequest request) {
        NguoiDung user = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=hop-dong-" + hopDongId + ".pdf")
                .body(service.xuat(hopDongId, user));
    }
}
