package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Profile("local")
@ConditionalOnProperty(prefix = "app.activation.delivery", name = "local-enabled", havingValue = "true")
@RequestMapping("/api/auth/local/ma-xac-thuc")
public class LocalMaXacThucController {
    private final KichHoatTaiKhoanDelivery delivery;
    public LocalMaXacThucController(KichHoatTaiKhoanDelivery delivery) { this.delivery = delivery; }

    @GetMapping
    public org.springframework.http.ResponseEntity<LocalMaXacThucDelivery.ThongTinMa> lay(@RequestParam String soDienThoai, HttpServletRequest request) {
        NguoiDung nguoiDung = (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
        if (nguoiDung == null || nguoiDung.vaiTro() != VaiTro.QTHT) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        if (!(delivery instanceof LocalMaXacThucDelivery local)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return org.springframework.http.ResponseEntity.ok().cacheControl(org.springframework.http.CacheControl.noStore()).body(local.lay(soDienThoai));
    }
}
