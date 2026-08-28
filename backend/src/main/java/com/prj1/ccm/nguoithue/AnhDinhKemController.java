package com.prj1.ccm.nguoithue;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/anh")
public class AnhDinhKemController {
    private final AnhDinhKemService anhDinhKemService;
    public AnhDinhKemController(AnhDinhKemService anhDinhKemService) { this.anhDinhKemService = anhDinhKemService; }
    /** FR-TNT-01 and CR-013 issue a checked signed link only after management authorization. NFR-SEC-04 fixes the link lifetime at 15 minutes. */
    @GetMapping("/{anhId}/lien-ket")
    public LienKetAnhKy lienKet(@PathVariable Long anhId, HttpServletRequest request) { return anhDinhKemService.taoLienKet(anhId, (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE)); }
    /** CR-013 serves a stored image only after checking its signature and expiry. NFR-SEC-04 refuses links after 15 minutes. */
    @GetMapping("/{anhId}/xem")
    public ResponseEntity<byte[]> xem(@PathVariable Long anhId, @RequestParam long hetHan, @RequestParam String chuKy) {
        AnhDinhKem anh = anhDinhKemService.layAnhDaKy(anhId, hetHan, chuKy);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(anh.loaiNoiDung())).body(anhDinhKemService.docTep(anh));
    }
}
