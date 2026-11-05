package com.prj1.ccm.taisan;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TaiSanController {
    private final TaiSanService taiSanService;

    public TaiSanController(TaiSanService taiSanService) {
        this.taiSanService = taiSanService;
    }

    private NguoiDung currentUser(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    @GetMapping("/phong/{phongId}/tai-san")
    public List<TaiSanPhongDto> layDanhSachTaiSan(
            @PathVariable Long phongId,
            HttpServletRequest request
    ) {
        return taiSanService.layDanhSachTaiSan(phongId, currentUser(request));
    }

    @PostMapping("/phong/{phongId}/tai-san")
    public ResponseEntity<Map<String, Object>> themTaiSan(
            @PathVariable Long phongId,
            @RequestBody YeuCauKhaiBaoTaiSan yeuCau,
            HttpServletRequest request
    ) {
        Long id = taiSanService.themTaiSan(phongId, yeuCau, currentUser(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "thanhCong", true,
                "taiSanId", id,
                "thongBao", "Đã thêm tài sản vào phòng thành công"
        ));
    }

    @DeleteMapping("/tai-san/{id}")
    public ResponseEntity<Map<String, Object>> xoaTaiSan(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        boolean ok = taiSanService.xoaTaiSan(id, currentUser(request));
        if (ok) {
            return ResponseEntity.ok(Map.of("thanhCong", true, "thongBao", "Đã xoá tài sản khỏi danh mục phòng"));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/hop-dong/{hopDongId}/bien-ban-tai-san")
    public List<BienBanBanGiaoDto> layDanhSachBienBan(
            @PathVariable Long hopDongId,
            HttpServletRequest request
    ) {
        return taiSanService.layDanhSachBienBan(hopDongId, currentUser(request));
    }

    @PostMapping("/hop-dong/{hopDongId}/bien-ban-tai-san")
    public ResponseEntity<Map<String, Object>> lapBienBan(
            @PathVariable Long hopDongId,
            @RequestBody YeuCauLapBienBan yeuCau,
            HttpServletRequest request
    ) {
        NguoiDung nguoiDung = currentUser(request);
        Long bienBanId = taiSanService.lapBienBan(hopDongId, yeuCau, nguoiDung);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "thanhCong", true,
                "bienBanId", bienBanId,
                "thongBao", "Lập biên bản bàn giao thành công"
        ));
    }
}
