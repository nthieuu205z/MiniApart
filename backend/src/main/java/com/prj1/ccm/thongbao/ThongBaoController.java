package com.prj1.ccm.thongbao;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/thong-bao")
public class ThongBaoController {
    private final ThongBaoService thongBaoService;

    public ThongBaoController(ThongBaoService thongBaoService) {
        this.thongBaoService = thongBaoService;
    }

    /** FR-MNT-02, FR-MNT-04 and FR-INV-08 read the authenticated user's active notification inbox and unread count. */
    @GetMapping
    public ThongTinHopThongBao danhSach(HttpServletRequest request) {
        return thongBaoService.danhSach(nguoiDungHienTai(request));
    }

    /** FR-NTF-02 and FR-NTF-07 read expired notifications without deleting their history. */
    @GetMapping("/luu-tru")
    public ThongTinHopThongBao luuTru(HttpServletRequest request) {
        return thongBaoService.luuTru(nguoiDungHienTai(request));
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

    /** FR-NTF-02 and FR-NTF-07 preview the recipient snapshot for a scoped common notification. */
    @PostMapping(value = "/chung/xem-truoc", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ThongTinXemTruocThongBaoChung xemTruoc(@RequestBody YeuCauThongBaoChung yeuCau, HttpServletRequest request) {
        return thongBaoService.xemTruoc(yeuCau, nguoiDungHienTai(request));
    }

    /** FR-NTF-02 and FR-NTF-07 send an idempotent JSON common notification to the approved scope. */
    @PostMapping(value = "/chung", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ThongTinGuiThongBaoChung> guiJson(
            @RequestBody YeuCauThongBaoChung yeuCau,
            @RequestHeader(value = "Idempotency-Key", required = false) String khoaChongLap,
            HttpServletRequest request
    ) {
        return phanHoi(thongBaoService.gui(yeuCau, khoaChongLap, null, nguoiDungHienTai(request)));
    }

    /** FR-NTF-02 and FR-NTF-07 send a common notification with one private image attachment. */
    @PostMapping(value = "/chung", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ThongTinGuiThongBaoChung> guiMultipart(
            @RequestParam Long toaNhaId,
            @RequestParam(required = false) String phamVi,
            @RequestParam(required = false) Integer tang,
            @RequestParam(required = false) List<Long> phongIds,
            @RequestParam String tieuDe,
            @RequestParam String noiDung,
            @RequestParam Instant hetHanLuc,
            @RequestPart(value = "tep", required = false) MultipartFile tep,
            @RequestHeader(value = "Idempotency-Key", required = false) String khoaChongLap,
            HttpServletRequest request
    ) {
        YeuCauThongBaoChung yeuCau = new YeuCauThongBaoChung(toaNhaId, phamVi, tang, phongIds, tieuDe, noiDung, hetHanLuc);
        return phanHoi(thongBaoService.gui(yeuCau, khoaChongLap, tep, nguoiDungHienTai(request)));
    }

    private ResponseEntity<ThongTinGuiThongBaoChung> phanHoi(ThongBaoService.KetQuaGuiThongBaoChung ketQua) {
        return ResponseEntity.status(ketQua.taoMoi() ? HttpStatus.CREATED : HttpStatus.OK).body(ketQua.thongTin());
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }
}
