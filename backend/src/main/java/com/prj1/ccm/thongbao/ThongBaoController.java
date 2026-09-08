package com.prj1.ccm.thongbao;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/thong-bao")
public class ThongBaoController {
    private final ThongBaoService thongBaoService;

    public ThongBaoController(ThongBaoService thongBaoService) {
        this.thongBaoService = thongBaoService;
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 read the authenticated user's notification inbox and unread count. */
    @GetMapping
    public ThongTinHopThongBao danhSach(HttpServletRequest request) {
        return thongBaoService.danhSach(nguoiDungHienTai(request));
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 read one notification only when it belongs to the user. */
    @GetMapping("/{thongBaoThamChieu}")
    public ThongTinThongBao chiTiet(@PathVariable("thongBaoThamChieu") String thongBaoThamChieu, HttpServletRequest request) {
        return thongBaoService.chiTiet(thongBaoThamChieu, nguoiDungHienTai(request));
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 mark a notification read while keeping it in the inbox. */
    @PostMapping("/{thongBaoThamChieu}/da-doc")
    public ThongTinThongBao danhDauDaDoc(@PathVariable("thongBaoThamChieu") String thongBaoThamChieu, HttpServletRequest request) {
        return thongBaoService.danhDauDaDoc(thongBaoThamChieu, nguoiDungHienTai(request));
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
