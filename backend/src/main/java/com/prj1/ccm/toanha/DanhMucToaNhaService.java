package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class DanhMucToaNhaService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu không hợp lệ";
    private static final String THONG_BAO_NGAY_CHOT_SO = "Ngày chốt số chỉ nhận từ 1 đến 28 để tháng hai vẫn luôn có ngày chốt.";
    private static final String THONG_BAO_TRUNG_MA_TOA = "Mã toà đã tồn tại. Vui lòng dùng mã khác.";

    private final ToaNhaRepository toaNhaRepository;
    private final PhanQuyenToaService phanQuyenToaService;

    public DanhMucToaNhaService(ToaNhaRepository toaNhaRepository, PhanQuyenToaService phanQuyenToaService) {
        this.toaNhaRepository = toaNhaRepository;
        this.phanQuyenToaService = phanQuyenToaService;
    }

    @Transactional
    public ThongTinToaNha tao(YeuCauToaNha yeuCau, NguoiDung nguoiDung) {
        kiemTraDuocTao(nguoiDung);
        ToaNha toaNha = chuanHoa(yeuCau, null);
        if (toaNhaRepository.existsByMaToa(toaNha.maToa())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_TRUNG_MA_TOA);
        }

        Long toaNhaId = toaNhaRepository.insert(toaNha);
        if (nguoiDung.vaiTro() == VaiTro.CHU) {
            toaNhaRepository.themPhanQuyenToa(nguoiDung.id(), toaNhaId);
        }
        return ThongTinToaNha.tuToaNha(layToaNhaTonTai(toaNhaId));
    }

    @Transactional
    public ThongTinToaNha capNhat(Long toaNhaId, YeuCauToaNha yeuCau, NguoiDung nguoiDung) {
        layToaNhaNeuDuocCapNhat(nguoiDung, toaNhaId);
        ToaNha toaNha = chuanHoa(yeuCau, toaNhaId);
        if (toaNhaRepository.existsByMaToaExceptId(toaNha.maToa(), toaNhaId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_TRUNG_MA_TOA);
        }

        toaNhaRepository.update(toaNha);
        return ThongTinToaNha.tuToaNha(layToaNhaTonTai(toaNhaId));
    }

    private void kiemTraDuocTao(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QTHT)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private ToaNha layToaNhaNeuDuocCapNhat(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        return switch (nguoiDung.vaiTro()) {
            case QTHT -> layToaNhaTonTai(toaNhaId);
            case CHU, QUAN_LY -> phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        };
    }

    private ToaNha layToaNhaTonTai(Long toaNhaId) {
        return toaNhaRepository.findById(toaNhaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private ToaNha chuanHoa(YeuCauToaNha yeuCau, Long toaNhaId) {
        if (yeuCau == null
                || yeuCau.maToa() == null || yeuCau.maToa().isBlank()
                || yeuCau.ten() == null || yeuCau.ten().isBlank()
                || yeuCau.diaChi() == null || yeuCau.diaChi().isBlank()
                || yeuCau.tkNganHang() == null || yeuCau.tkNganHang().isBlank()
                || yeuCau.soTang() == null || yeuCau.soTang() <= 0
                || yeuCau.soNgayHanTt() == null || yeuCau.soNgayHanTt() <= 0
                || yeuCau.ngayChotSo() == null
                || yeuCau.nguongThatThoat() == null
                || yeuCau.nguongThatThoat().signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        if (yeuCau.ngayChotSo() < 1 || yeuCau.ngayChotSo() > 28) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_NGAY_CHOT_SO);
        }

        BigDecimal nguongThatThoat;
        try {
            nguongThatThoat = yeuCau.nguongThatThoat().setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE, exception);
        }

        return new ToaNha(
                toaNhaId,
                yeuCau.maToa().trim(),
                yeuCau.ten().trim(),
                yeuCau.diaChi().trim(),
                yeuCau.soTang(),
                yeuCau.ngayChotSo(),
                yeuCau.soNgayHanTt(),
                yeuCau.tkNganHang().trim(),
                nguongThatThoat
        );
    }
}
