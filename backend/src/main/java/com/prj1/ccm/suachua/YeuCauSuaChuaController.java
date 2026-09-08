package com.prj1.ccm.suachua;

import com.prj1.ccm.auth.AuthInterceptor;
import com.prj1.ccm.nguoidung.NguoiDung;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
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

    private ResponseStatusException khongHopLe() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
    }
}
