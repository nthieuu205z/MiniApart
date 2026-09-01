package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.QuyTacTrangThaiHoaDon;
import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PhatHanhHoaDonService {
    private static final String THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE = "Không thể chuyển trạng thái hoá đơn.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final QuyTacTrangThaiHoaDon quyTacTrangThaiHoaDon = new QuyTacTrangThaiHoaDon();

    public PhatHanhHoaDonService(PhanQuyenToaService phanQuyenToaService, TinhHoaDonRepository tinhHoaDonRepository) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
    }

    @Transactional
    public void phatHanh(Long toaNhaId, Long kyId, Long hoaDonId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon = tinhHoaDonRepository.timHoaDonTrongPhamVi(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        TrangThaiHoaDon trangThaiMoi = chuyen(hoaDon.trangThai(), TrangThaiHoaDon.DA_PHAT_HANH);
        tinhHoaDonRepository.capNhatTrangThaiHoaDon(hoaDon.hoaDonId(), trangThaiMoi);
    }

    private TrangThaiHoaDon chuyen(TrangThaiHoaDon hienTai, TrangThaiHoaDon mongMuon) {
        try {
            return quyTacTrangThaiHoaDon.chuyen(hienTai, mongMuon);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE, exception);
        }
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU
                && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
