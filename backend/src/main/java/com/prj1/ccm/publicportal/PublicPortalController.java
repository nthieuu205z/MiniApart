package com.prj1.ccm.publicportal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicPortalController {
    private final PublicPortalService publicPortalService;

    public PublicPortalController(PublicPortalService publicPortalService) {
        this.publicPortalService = publicPortalService;
    }

    @GetMapping("/toa-nha")
    public List<PublicToaNhaDto> layDanhSachToaNha() {
        return publicPortalService.layDanhSachToaNha();
    }

    @GetMapping("/phong")
    public List<PublicPhongDto> layDanhSachPhong(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) BigDecimal giaTu,
            @RequestParam(required = false) BigDecimal giaDen,
            @RequestParam(required = false) String loaiPhong,
            @RequestParam(required = false) String tuKhoa,
            @RequestParam(required = false, defaultValue = "true") Boolean chiPhongTrong
    ) {
        return publicPortalService.layDanhSachPhong(toaNhaId, giaTu, giaDen, loaiPhong, tuKhoa, chiPhongTrong);
    }

    @GetMapping("/phong/{id}")
    public ResponseEntity<PublicPhongDto> layChiTietPhong(@PathVariable Long id) {
        return publicPortalService.layChiTietPhong(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/dat-lich-hen")
    public ResponseEntity<Map<String, Object>> datLichHen(@RequestBody YeuCauDatLichHen yeuCau) {
        try {
            Long lichHenId = publicPortalService.datLichHen(yeuCau);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "thanhCong", true,
                    "lichHenId", lichHenId,
                    "thongBao", "Đặt lịch hẹn xem phòng thành công! Ban quản lý toà nhà sẽ liên hệ với bạn trong thời gian sớm nhất."
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "thanhCong", false,
                    "thongBao", ex.getMessage()
            ));
        }
    }

}

