package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.QuyTacTrangThaiHoaDon;
import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class HuyHoaDonNhapService {
    private static final String THONG_BAO_LY_DO_BAT_BUOC = "Lý do huỷ hoá đơn là bắt buộc.";
    private static final String THONG_BAO_CHU_SO_HUU_BAT_BUOC = "Chỉ chủ sở hữu được huỷ hoá đơn đã phát hành.";
    private static final String THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE = "Không thể chuyển trạng thái hoá đơn.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final QuyTacTrangThaiHoaDon quyTacTrangThaiHoaDon = new QuyTacTrangThaiHoaDon();

    public HuyHoaDonNhapService(
            PhanQuyenToaService phanQuyenToaService,
            TinhHoaDonRepository tinhHoaDonRepository,
            NhatKyThaoTacRepository nhatKyThaoTacRepository
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
    }

    @Transactional
    public void huy(Long toaNhaId, Long kyId, Long hoaDonId, YeuCauHuyHoaDon yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon = tinhHoaDonRepository.timHoaDonTrongPhamVi(toaNhaId, kyId, hoaDonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (hoaDon.trangThai() == TrangThaiHoaDon.NHAP) {
            TrangThaiHoaDon trangThaiMoi = chuyen(hoaDon.trangThai(), TrangThaiHoaDon.DA_HUY);
            tinhHoaDonRepository.capNhatTrangThaiHoaDon(hoaDonId, trangThaiMoi);
            tinhHoaDonRepository.khoiPhucKhoanPhatSinhChoTinh(hoaDonId);
            tinhHoaDonRepository.khoiPhucSoDuKhaDung(hoaDonId);
            return;
        }
        huyHoaDonDaPhatHanh(hoaDon, yeuCau, nguoiDung);
    }

    private void huyHoaDonDaPhatHanh(
            TinhHoaDonRepository.HoaDonTrongPhamVi hoaDon,
            YeuCauHuyHoaDon yeuCau,
            NguoiDung nguoiDung
    ) {
        if (nguoiDung.vaiTro() != VaiTro.CHU) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, THONG_BAO_CHU_SO_HUU_BAT_BUOC);
        }
        if (yeuCau == null || yeuCau.lyDo() == null || yeuCau.lyDo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_LY_DO_BAT_BUOC);
        }
        TrangThaiHoaDon trangThaiMoi = chuyen(hoaDon.trangThai(), TrangThaiHoaDon.DA_HUY);
        tinhHoaDonRepository.capNhatTrangThaiHoaDon(hoaDon.hoaDonId(), trangThaiMoi);
        tinhHoaDonRepository.khoiPhucSoDuKhaDung(hoaDon.hoaDonId());
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                "HUY_HOA_DON",
                "HOA_DON:" + hoaDon.hoaDonId(),
                hoaDon.trangThai().name(),
                trangThaiMoi.name(),
                null,
                null,
                yeuCau.lyDo().trim(),
                null
        );
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
