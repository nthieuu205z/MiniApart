package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/yeu-cau-sua-chua")
public class YeuCauSuaChuaController {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu sửa chữa không hợp lệ";

    private final YeuCauSuaChuaService yeuCauSuaChuaService;

    public YeuCauSuaChuaController(YeuCauSuaChuaService yeuCauSuaChuaService) {
        this.yeuCauSuaChuaService = yeuCauSuaChuaService;
    }

    /** FR-MNT-03 lists repair requests for the selected building and optional lifecycle state. */
    @GetMapping
    public List<ThongTinYeuCauSuaChua> danhSach(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) String trangThai,
            HttpServletRequest request
    ) {
        return yeuCauSuaChuaService.danhSach(
                toaNhaId,
                chuyenTrangThai(trangThai),
                nguoiDungHienTai(request)
        );
    }

    /** FR-MNT-08 reads repair history by room, building, or category without time-range reporting. */
    @GetMapping("/lich-su")
    public ThongTinLichSuSuaChua lichSu(
            @RequestParam(required = false) Long toaNhaId,
            @RequestParam(required = false) Long phongId,
            @RequestParam(required = false) String hangMuc,
            @RequestParam(required = false) String boLoc,
            @RequestParam(defaultValue = "false") boolean hienThiDaHuy,
            HttpServletRequest request
    ) {
        return yeuCauSuaChuaService.lichSu(
                toaNhaId, phongId, hangMuc, boLoc, hienThiDaHuy, nguoiDungHienTai(request)
        );
    }

    /** FR-MNT-03 returns one repair request within the authenticated actor's scope. */
    @GetMapping("/{yeuCauId}")
    public ThongTinYeuCauSuaChua chiTiet(@PathVariable Long yeuCauId, HttpServletRequest request) {
        return yeuCauSuaChuaService.chiTiet(yeuCauId, nguoiDungHienTai(request));
    }

    /** FR-MNT-01, BR-17 and CR-013 create one repair request and store at most five private images. */
    @PostMapping
    public ResponseEntity<ThongTinYeuCauSuaChua> tao(
            @RequestParam Long phongId,
            @RequestParam String hangMuc,
            @RequestParam String moTa,
            @RequestParam String mucDo,
            @RequestParam(name = "anh", required = false) List<MultipartFile> anh,
            @RequestParam(name = "tep", required = false) List<MultipartFile> tep,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                yeuCauSuaChuaService.tao(
                        new YeuCauTaoSuaChua(phongId, hangMuc, moTa, chuyenMucDo(mucDo)),
                        gopAnh(anh, tep),
                        nguoiDungHienTai(request)
                )
        );
    }

    /** FR-MNT-03 lets an authorised owner or manager accept a new repair request. */
    @PostMapping("/{yeuCauId}/tiep-nhan")
    public ThongTinYeuCauSuaChua tiepNhan(@PathVariable Long yeuCauId, HttpServletRequest request) {
        return yeuCauSuaChuaService.tiepNhan(yeuCauId, nguoiDungHienTai(request));
    }

    /** FR-MNT-04 assigns a request to one active repair worker. */
    @PostMapping("/{yeuCauId}/phan-cong")
    public ThongTinYeuCauSuaChua phanCong(
            @PathVariable Long yeuCauId,
            @RequestBody(required = false) YeuCauPhanCong yeuCau,
            @RequestParam(required = false) Long thoId,
            HttpServletRequest request
    ) {
        Long thoDuocChon = yeuCau != null && yeuCau.thoId() != null ? yeuCau.thoId() : thoId;
        return yeuCauSuaChuaService.phanCong(yeuCauId, thoDuocChon, nguoiDungHienTai(request));
    }

    /** FR-MNT-04 lets only the assigned worker move a request into processing. */
    @PostMapping({"/{yeuCauId}/bat-dau-xu-ly", "/{yeuCauId}/xu-ly"})
    public ThongTinYeuCauSuaChua batDauXuLy(@PathVariable Long yeuCauId, HttpServletRequest request) {
        return yeuCauSuaChuaService.batDauXuLy(yeuCauId, nguoiDungHienTai(request));
    }

    /** FR-MNT-04 lets only the assigned worker report the repair complete for tenant confirmation. */
    @PostMapping("/{yeuCauId}/hoan-thanh")
    public ThongTinYeuCauSuaChua hoanThanh(@PathVariable Long yeuCauId, HttpServletRequest request) {
        return yeuCauSuaChuaService.baoDaSuaXong(yeuCauId, nguoiDungHienTai(request));
    }

    /** FR-MNT-03 lets the creating tenant or the assigned building manager close a request after confirmation. */
    @PostMapping("/{yeuCauId}/xac-nhan-dong")
    public ThongTinYeuCauSuaChua xacNhanDong(@PathVariable Long yeuCauId, HttpServletRequest request) {
        return yeuCauSuaChuaService.xacNhanDong(yeuCauId, nguoiDungHienTai(request));
    }

    /** FR-MNT-03 cancels an open repair request with a mandatory reason. */
    @PostMapping("/{yeuCauId}/huy")
    public ThongTinYeuCauSuaChua huy(
            @PathVariable Long yeuCauId,
            @RequestBody(required = false) YeuCauHuySuaChua yeuCau,
            HttpServletRequest request
    ) {
        return yeuCauSuaChuaService.huy(
                yeuCauId,
                yeuCau == null ? null : yeuCau.lyDo(),
                nguoiDungHienTai(request)
        );
    }

    /** FR-MNT-05 and FR-MNT-06 let an in-scope owner or manager record or revise repair cost. */
    @PutMapping("/{yeuCauId}/chi-phi")
    public ThongTinYeuCauSuaChua ghiChiPhi(
            @PathVariable Long yeuCauId,
            @RequestBody(required = false) YeuCauChiPhiSuaChua yeuCau,
            HttpServletRequest request
    ) {
        return yeuCauSuaChuaService.ghiChiPhi(
                yeuCauId,
                yeuCau,
                nguoiDungHienTai(request)
        );
    }

    private MucDo chuyenMucDo(String mucDo) {
        if (mucDo == null || mucDo.isBlank()) {
            throw khongHopLe();
        }
        try {
            return MucDo.valueOf(mucDo.trim());
        } catch (IllegalArgumentException exception) {
            throw khongHopLe();
        }
    }

    private List<MultipartFile> gopAnh(List<MultipartFile> anh, List<MultipartFile> tep) {
        List<MultipartFile> ketQua = new ArrayList<>();
        if (anh != null) {
            ketQua.addAll(anh);
        }
        if (tep != null) {
            ketQua.addAll(tep);
        }
        return List.copyOf(ketQua);
    }

    private NguoiDung nguoiDungHienTai(HttpServletRequest request) {
        return (NguoiDung) request.getAttribute(AuthInterceptor.CURRENT_USER_ATTRIBUTE);
    }

    private TrangThaiYeuCau chuyenTrangThai(String trangThai) {
        if (trangThai == null || trangThai.isBlank()) {
            return null;
        }
        try {
            return TrangThaiYeuCau.valueOf(trangThai.trim());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái yêu cầu sửa chữa không hợp lệ", exception);
        }
    }

    private ResponseStatusException khongHopLe() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
    }
}
