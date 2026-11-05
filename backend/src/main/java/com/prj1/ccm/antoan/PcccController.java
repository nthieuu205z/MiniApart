package com.prj1.ccm.antoan;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/** FR-SEC-01/02/03: all safety operations enforce building scope on the server. */
@RestController
@RequestMapping("/api/toa-nha/{toaNhaId}/pccc")
public class PcccController {
    private final PcccService service;
    public PcccController(PcccService service) { this.service = service; }
    @GetMapping
    public PcccService.TongQuan lay(@PathVariable Long toaNhaId, HttpServletRequest request) { return service.lay(toaNhaId, user(request)); }
    @PostMapping("/ho-so")
    public ResponseEntity<Map<String, Long>> themHoSo(@PathVariable Long toaNhaId, @RequestParam String phanLoai, @RequestParam String ten, @RequestParam MultipartFile tep, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", service.themHoSo(toaNhaId, phanLoai, ten, tep, user(request))));
    }
    @GetMapping("/ho-so/{id}/tep")
    public ResponseEntity<byte[]> tep(@PathVariable Long toaNhaId, @PathVariable Long id, HttpServletRequest request) {
        var tep = service.docTep(toaNhaId, id, user(request));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(tep.loaiNoiDung()))
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(tep.tenTep(), StandardCharsets.UTF_8).build().toString()).body(tep.duLieu());
    }
    @PostMapping("/thiet-bi")
    public ResponseEntity<Map<String, Long>> themThietBi(@PathVariable Long toaNhaId, @RequestBody PcccService.YeuCauThietBi yeuCau, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", service.luuThietBi(toaNhaId, null, yeuCau, user(request))));
    }
    @PutMapping("/thiet-bi/{id}")
    public Map<String, Long> suaThietBi(@PathVariable Long toaNhaId, @PathVariable Long id, @RequestBody PcccService.YeuCauThietBi yeuCau, HttpServletRequest request) {
        return Map.of("id", service.luuThietBi(toaNhaId, id, yeuCau, user(request)));
    }
    @PostMapping("/kiem-tra")
    public ResponseEntity<Map<String, Long>> kiemTra(@PathVariable Long toaNhaId, @RequestBody PcccService.YeuCauKiemTra yeuCau, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", service.ghiKiemTra(toaNhaId, yeuCau, user(request))));
    }
    @PutMapping("/lich-kiem-tra")
    public ResponseEntity<Void> luuLich(@PathVariable Long toaNhaId, @RequestBody PcccService.LichKiemTra lich, HttpServletRequest request) {
        service.luuLich(toaNhaId, lich, user(request)); return ResponseEntity.noContent().build();
    }
    private NguoiDung user(HttpServletRequest request) { return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE); }
}
