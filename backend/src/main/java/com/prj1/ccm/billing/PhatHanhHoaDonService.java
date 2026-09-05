package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.QuyTacTrangThaiHoaDon;
import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.toanha.KyThanhToanRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class PhatHanhHoaDonService {
    private static final String THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE = "Không thể chuyển trạng thái hoá đơn.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final KyThanhToanRepository kyThanhToanRepository;
    private final TinhHoaDonRepository tinhHoaDonRepository;
    private final TransactionTemplate giaoDichMoi;
    private final QuyTacTrangThaiHoaDon quyTacTrangThaiHoaDon = new QuyTacTrangThaiHoaDon();

    public PhatHanhHoaDonService(
            PhanQuyenToaService phanQuyenToaService,
            KyThanhToanRepository kyThanhToanRepository,
            TinhHoaDonRepository tinhHoaDonRepository,
            PlatformTransactionManager transactionManager
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.kyThanhToanRepository = kyThanhToanRepository;
        this.tinhHoaDonRepository = tinhHoaDonRepository;
        this.giaoDichMoi = new TransactionTemplate(transactionManager);
        this.giaoDichMoi.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
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

    public ThongTinPhatHanhHoaDonHangLoat phatHanhHangLoat(Long toaNhaId, Long kyId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        kyThanhToanRepository.findByIdAndToaNhaId(kyId, toaNhaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        int soHoaDonDaPhatHanh = 0;
        int soHoaDonDaOTrangThaiKhac = 0;
        List<ThongTinLyDoBoQua> lyDoBoQua = new ArrayList<>();
        for (TinhHoaDonRepository.HoaDonCanPhatHanh hoaDon : tinhHoaDonRepository.layHoaDonCanPhatHanh(toaNhaId, kyId)) {
            if (hoaDon.trangThai() != TrangThaiHoaDon.NHAP) {
                soHoaDonDaOTrangThaiKhac++;
                continue;
            }
            if (hoaDon.tongTien().compareTo(BigDecimal.ZERO) == 0) {
                lyDoBoQua.add(new ThongTinLyDoBoQua(
                        hoaDon.phongId(),
                        "TONG_TIEN_BANG_KHONG",
                        "Hoa don co tong tien bang khong nen khong the phat hanh"
                ));
                continue;
            }
            if (phatHanhTrongGiaoDichMoi(hoaDon, lyDoBoQua)) {
                soHoaDonDaPhatHanh++;
            }
        }
        return new ThongTinPhatHanhHoaDonHangLoat(
                kyId,
                soHoaDonDaPhatHanh,
                soHoaDonDaOTrangThaiKhac,
                lyDoBoQua.size(),
                lyDoBoQua
        );
    }

    private boolean phatHanhTrongGiaoDichMoi(
            TinhHoaDonRepository.HoaDonCanPhatHanh hoaDon,
            List<ThongTinLyDoBoQua> lyDoBoQua
    ) {
        try {
            return Boolean.TRUE.equals(giaoDichMoi.execute(status -> {
                tinhHoaDonRepository.capNhatTrangThaiHoaDon(
                        hoaDon.hoaDonId(),
                        chuyen(hoaDon.trangThai(), TrangThaiHoaDon.DA_PHAT_HANH)
                );
                return true;
            }));
        } catch (RuntimeException exception) {
            lyDoBoQua.add(new ThongTinLyDoBoQua(
                    hoaDon.phongId(),
                    "KHONG_THE_PHAT_HANH",
                    "Hoa don khong the phat hanh: " + exception.getMessage()
            ));
            return false;
        }
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
