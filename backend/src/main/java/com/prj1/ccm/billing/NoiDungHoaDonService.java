package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.QuyTacTrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
public class NoiDungHoaDonService {
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu nội dung hoá đơn không hợp lệ.";
    private static final String THONG_BAO_HOA_DON_DA_PHAT_HANH = "Chỉ hoá đơn nháp mới được sửa nội dung.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final QuyTacTrangThaiHoaDon quyTacTrangThaiHoaDon = new QuyTacTrangThaiHoaDon();

    public NoiDungHoaDonService(PhanQuyenToaService phanQuyenToaService, TinhHoaDonRepository tinhHoaDonRepository) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
    }

    @Transactional
    public Long them(Long toaNhaId, Long kyId, Long hoaDonId, YeuCauNoiDungHoaDon yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon = tinhHoaDonRepository.timHoaDonTrongPhamVi(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!quyTacTrangThaiHoaDon.choPhepSuaNoiDung(hoaDon.trangThai())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_DA_PHAT_HANH);
        }
        NoiDungDaChuanHoa noiDung = chuanHoa(yeuCau);
        return tinhHoaDonRepository.themNoiDungHoaDon(hoaDon.hoaDonId(), noiDung.tenKhoan(), noiDung.thanhTien(), noiDung.lyDo());
    }

    private NoiDungDaChuanHoa chuanHoa(YeuCauNoiDungHoaDon yeuCau) {
        if (yeuCau == null
                || yeuCau.tenKhoan() == null
                || yeuCau.tenKhoan().isBlank()
                || yeuCau.soTien() == null
                || yeuCau.soTien().signum() <= 0
                || yeuCau.loai() == null
                || yeuCau.lyDo() == null
                || yeuCau.lyDo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        BigDecimal thanhTien = yeuCau.loai() == LoaiKhoanPhatSinh.GIAM_TRU
                ? yeuCau.soTien().negate()
                : yeuCau.soTien();
        return new NoiDungDaChuanHoa(yeuCau.tenKhoan().trim(), thanhTien, yeuCau.lyDo().trim());
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private record NoiDungDaChuanHoa(String tenKhoan, BigDecimal thanhTien, String lyDo) {
    }
}
