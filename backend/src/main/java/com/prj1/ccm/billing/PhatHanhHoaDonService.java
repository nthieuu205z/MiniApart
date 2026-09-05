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
    private static final String MA_DA_O_TRANG_THAI_KHAC = "DA_O_TRANG_THAI_KHAC";
    private static final String MA_TONG_TIEN_BANG_KHONG = "TONG_TIEN_BANG_KHONG";
    private static final String MA_KHONG_THE_PHAT_HANH = "KHONG_THE_PHAT_HANH";
    private static final String THONG_BAO_TONG_TIEN_BANG_KHONG = "Hoá đơn có tổng tiền bằng không nên không thể phát hành.";
    private static final String THONG_BAO_LOI_XU_LY = "Không thể phát hành hoá đơn do lỗi xử lý.";

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
        int soHoaDonBoQua = 0;
        List<ThongTinLyDoBoQua> lyDoBoQua = new ArrayList<>();
        for (TinhHoaDonRepository.HoaDonCanPhatHanh hoaDon : tinhHoaDonRepository.layHoaDonCanPhatHanh(toaNhaId, kyId)) {
            if (hoaDon.trangThai() != TrangThaiHoaDon.NHAP) {
                soHoaDonDaOTrangThaiKhac++;
                lyDoBoQua.add(lyDoDaOTrangThaiKhac(hoaDon));
                continue;
            }
            if (hoaDon.tongTien().compareTo(BigDecimal.ZERO) == 0) {
                lyDoBoQua.add(lyDoTongTienBangKhong(hoaDon));
                soHoaDonBoQua++;
                continue;
            }
            KetQuaPhatHanh ketQua = phatHanhTrongGiaoDichMoi(hoaDon, lyDoBoQua);
            switch (ketQua) {
                case DA_PHAT_HANH -> soHoaDonDaPhatHanh++;
                case DA_O_TRANG_THAI_KHAC -> soHoaDonDaOTrangThaiKhac++;
                case BO_QUA -> soHoaDonBoQua++;
            }
        }
        return new ThongTinPhatHanhHoaDonHangLoat(
                kyId,
                soHoaDonDaPhatHanh,
                soHoaDonDaOTrangThaiKhac,
                soHoaDonBoQua,
                lyDoBoQua
        );
    }

    private KetQuaPhatHanh phatHanhTrongGiaoDichMoi(
            TinhHoaDonRepository.HoaDonCanPhatHanh hoaDon,
            List<ThongTinLyDoBoQua> lyDoBoQua
    ) {
        try {
            int soDongCapNhat = giaoDichMoi.execute(status -> tinhHoaDonRepository
                    .phatHanhHoaDonNeuDangNhapVaTongTienKhacKhong(hoaDon.hoaDonId()));
            if (soDongCapNhat == 1) {
                return KetQuaPhatHanh.DA_PHAT_HANH;
            }
            TinhHoaDonRepository.HoaDonCanPhatHanh hienTai = tinhHoaDonRepository
                    .timHoaDonCanPhatHanh(hoaDon.hoaDonId())
                    .orElse(hoaDon);
            if (hienTai.trangThai() != TrangThaiHoaDon.NHAP) {
                lyDoBoQua.add(lyDoDaOTrangThaiKhac(hienTai));
                return KetQuaPhatHanh.DA_O_TRANG_THAI_KHAC;
            }
            lyDoBoQua.add(lyDoTongTienBangKhong(hienTai));
            return KetQuaPhatHanh.BO_QUA;
        } catch (RuntimeException exception) {
            lyDoBoQua.add(new ThongTinLyDoBoQua(
                    hoaDon.phongId(),
                    MA_KHONG_THE_PHAT_HANH,
                    THONG_BAO_LOI_XU_LY
            ));
            return KetQuaPhatHanh.BO_QUA;
        }
    }

    private ThongTinLyDoBoQua lyDoDaOTrangThaiKhac(TinhHoaDonRepository.HoaDonCanPhatHanh hoaDon) {
        return new ThongTinLyDoBoQua(
                hoaDon.phongId(),
                MA_DA_O_TRANG_THAI_KHAC,
                "Hoá đơn đã ở trạng thái %s nên không thể phát hành.".formatted(hoaDon.trangThai())
        );
    }

    private ThongTinLyDoBoQua lyDoTongTienBangKhong(TinhHoaDonRepository.HoaDonCanPhatHanh hoaDon) {
        return new ThongTinLyDoBoQua(hoaDon.phongId(), MA_TONG_TIEN_BANG_KHONG, THONG_BAO_TONG_TIEN_BANG_KHONG);
    }

    private enum KetQuaPhatHanh {
        DA_PHAT_HANH,
        DA_O_TRANG_THAI_KHAC,
        BO_QUA
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
