package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class DanhMucDichVuService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu dịch vụ không hợp lệ.";
    private static final String THONG_BAO_CO_DIEN_KHONG_HOP_LE = "Cờ điện chỉ áp dụng cho dịch vụ tính theo chỉ số.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final DichVuRepository dichVuRepository;

    public DanhMucDichVuService(PhanQuyenToaService phanQuyenToaService, DichVuRepository dichVuRepository) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.dichVuRepository = dichVuRepository;
    }

    public List<ThongTinDichVu> danhSachDichVu(Long toaNhaId, NguoiDung nguoiDung) {
        kiemTraQuyenDichVu(nguoiDung, toaNhaId);
        return dichVuRepository.findByToaNhaId(toaNhaId)
                .stream()
                .map(ThongTinDichVu::tuDichVu)
                .toList();
    }

    @Transactional
    public ThongTinDichVu taoDichVu(Long toaNhaId, YeuCauDichVu yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenDichVu(nguoiDung, toaNhaId);
        DichVu dichVu = chuanHoa(null, toaNhaId, yeuCau, true);
        Long dichVuId = dichVuRepository.insert(dichVu);
        return ThongTinDichVu.tuDichVu(layDichVuTonTai(toaNhaId, dichVuId));
    }

    @Transactional
    public ThongTinDichVu capNhatDichVu(Long toaNhaId, Long dichVuId, YeuCauDichVu yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenDichVu(nguoiDung, toaNhaId);
        DichVu hienTai = layDichVuTonTai(toaNhaId, dichVuId);
        DichVu dichVu = chuanHoa(dichVuId, toaNhaId, yeuCau, hienTai.dangSuDung());
        dichVuRepository.update(dichVu);
        return ThongTinDichVu.tuDichVu(layDichVuTonTai(toaNhaId, dichVuId));
    }

    @Transactional
    public ThongTinDichVu capNhatTrangThai(Long toaNhaId, Long dichVuId, YeuCauTrangThaiDichVu yeuCau, NguoiDung nguoiDung) {
        kiemTraQuyenDichVu(nguoiDung, toaNhaId);
        if (yeuCau == null || yeuCau.dangSuDung() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        layDichVuTonTai(toaNhaId, dichVuId);
        dichVuRepository.updateTrangThai(dichVuId, toaNhaId, yeuCau.dangSuDung());
        return ThongTinDichVu.tuDichVu(layDichVuTonTai(toaNhaId, dichVuId));
    }

    DichVu layDichVuNguoiDungDuocQuanLy(Long dichVuId, NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        DichVu dichVu = dichVuRepository.findById(dichVuId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, dichVu.toaNhaId());
        return dichVu;
    }

    private void kiemTraQuyenDichVu(NguoiDung nguoiDung, Long toaNhaId) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.QTHT
                && nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        phanQuyenToaService.layToaNhaNeuNguoiDungDuocXem(nguoiDung, toaNhaId);
    }

    private DichVu layDichVuTonTai(Long toaNhaId, Long dichVuId) {
        return dichVuRepository.findByIdAndToaNhaId(dichVuId, toaNhaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private DichVu chuanHoa(Long dichVuId, Long toaNhaId, YeuCauDichVu yeuCau, boolean dangSuDung) {
        if (yeuCau == null
                || yeuCau.ten() == null || yeuCau.ten().isBlank()
                || yeuCau.cachTinh() == null || yeuCau.cachTinh().isBlank()
                || yeuCau.donVi() == null || yeuCau.donVi().isBlank()
                || yeuCau.laDien() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }

        CachTinh cachTinh;
        try {
            cachTinh = CachTinh.valueOf(yeuCau.cachTinh().trim());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE, exception);
        }

        if (yeuCau.laDien() && cachTinh != CachTinh.THEO_CHI_SO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_CO_DIEN_KHONG_HOP_LE);
        }

        return new DichVu(
                dichVuId,
                toaNhaId,
                yeuCau.ten().trim(),
                cachTinh,
                CheDoGia.CO_DINH,
                yeuCau.donVi().trim(),
                yeuCau.laDien(),
                dangSuDung
        );
    }
}
