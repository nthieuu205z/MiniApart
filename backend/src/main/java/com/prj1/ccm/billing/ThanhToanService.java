package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.QuyTacTrangThaiHoaDon;
import com.prj1.ccm.billing.calc.TienTe;
import com.prj1.ccm.billing.calc.TongThanhToan;
import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

@Service
public class ThanhToanService {
    private static final int MONEY_SCALE = 2;
    private static final int MONEY_PRECISION = 15;
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu ghi nhận thanh toán không hợp lệ.";
    private static final String THONG_BAO_SO_TIEN_LON_HON_KHONG = "Số tiền thanh toán phải lớn hơn 0.";
    private static final String THONG_BAO_HOA_DON_DA_THANH_TOAN =
            "Hoá đơn đã thanh toán đủ; phần thu thêm sẽ thành số dư. Hãy xác nhận để tiếp tục.";
    private static final String THONG_BAO_HOA_DON_CHUA_PHAT_HANH = "Chỉ hoá đơn đã phát hành mới được ghi nhận thanh toán.";
    private static final String THONG_BAO_HOA_DON_DA_HUY = "Hoá đơn đã huỷ không được ghi nhận thanh toán.";
    private static final String THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE = "Không thể cập nhật trạng thái hoá đơn.";

    private final PhanQuyenToaService phanQuyenToaService;
    private final ThanhToanRepository thanhToanRepository;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final Clock clock;
    private final QuyTacTrangThaiHoaDon quyTacTrangThaiHoaDon = new QuyTacTrangThaiHoaDon();

    public ThanhToanService(
            PhanQuyenToaService phanQuyenToaService,
            ThanhToanRepository thanhToanRepository,
            NhatKyThaoTacRepository nhatKyThaoTacRepository,
            Clock clock
    ) {
        this.phanQuyenToaService = phanQuyenToaService;
        this.thanhToanRepository = thanhToanRepository;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
        this.clock = clock;
    }

    /** FR-INV-11, FR-INV-12, FR-INV-13, BR-08, BR-12, and BR-18 record one immutable payment entry. */
    @Transactional
    public ThongTinThanhToan ghiNhan(
            Long toaNhaId,
            Long kyId,
            Long hoaDonId,
            YeuCauThanhToan yeuCau,
            NguoiDung nguoiDung
    ) {
        kiemTraVaiTro(nguoiDung);
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, toaNhaId);
        YeuCauThanhToan hopLe = chuanHoa(yeuCau);

        ThanhToanRepository.HoaDonThanhToan hoaDon = thanhToanRepository
                .timHoaDon(toaNhaId, kyId, hoaDonId, true)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        BigDecimal daThuTruoc = tongDaiSo(hoaDon.hoaDonId());
        TrangThaiHoaDon trangThaiTruoc = tinhTrangThai(hoaDon, daThuTruoc);
        if (trangThaiTruoc == TrangThaiHoaDon.NHAP) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_CHUA_PHAT_HANH);
        }
        if (trangThaiTruoc == TrangThaiHoaDon.DA_HUY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_DA_HUY);
        }
        if (trangThaiTruoc == TrangThaiHoaDon.DA_THANH_TOAN && !Boolean.TRUE.equals(hopLe.xacNhanThuThem())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_HOA_DON_DA_THANH_TOAN);
        }

        ThanhToanRepository.ThanhToanDaGhi thanhToan = thanhToanRepository.ghiNhan(
                new ThanhToanRepository.ThanhToanMoi(
                        hoaDon.hoaDonId(),
                        hopLe.soTien(),
                        hopLe.hinhThuc(),
                        hopLe.ngayThu(),
                        nguoiDung.id()
                )
        );
        BigDecimal daThu = tongDaiSo(hoaDon.hoaDonId());
        TrangThaiHoaDon trangThaiMoi = chuyenTrangThai(
                trangThaiTruoc,
                hoaDon.tongTien(),
                daThu,
                hoaDon.hanThanhToan()
        );

        thanhToanRepository.capNhatDaThu(hoaDon.hoaDonId(), daThu);
        thanhToanRepository.capNhatTrangThai(hoaDon.hoaDonId(), trangThaiMoi);
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                "GHI_NHAN_THANH_TOAN",
                "HOA_DON:" + hoaDon.hoaDonId(),
                trangThaiTruoc.name() + ":" + daThuTruoc.toPlainString(),
                trangThaiMoi.name() + ":" + daThu.toPlainString(),
                null,
                null,
                null,
                null
        );

        BigDecimal conLai = hoaDon.tongTien().subtract(daThu).max(BigDecimal.ZERO).setScale(2);
        BigDecimal soTienThanhSoDu = daThu.subtract(hoaDon.tongTien()).max(BigDecimal.ZERO).setScale(2);
        return new ThongTinThanhToan(
                thanhToan.thanhToanId(),
                hoaDon.hoaDonId(),
                thanhToan.maBienLai(),
                hopLe.soTien().toPlainString(),
                hopLe.hinhThuc().name(),
                "THU",
                hopLe.ngayThu().toString(),
                hoaDon.tongTien().toPlainString(),
                daThu.toPlainString(),
                conLai.toPlainString(),
                soTienThanhSoDu.toPlainString(),
                trangThaiMoi.name()
        );
    }

    private BigDecimal tongDaiSo(Long hoaDonId) {
        return TongThanhToan.tinh(
                thanhToanRepository.layCacSoTien(hoaDonId).stream().map(TienTe::new).toList()
        ).giaTri();
    }

    private TrangThaiHoaDon tinhTrangThai(
            ThanhToanRepository.HoaDonThanhToan hoaDon,
            BigDecimal daThu
    ) {
        if (hoaDon.trangThaiLuu() == TrangThaiHoaDon.NHAP || hoaDon.trangThaiLuu() == TrangThaiHoaDon.DA_HUY) {
            return hoaDon.trangThaiLuu();
        }
        if (daThu.signum() == 0 && !LocalDate.now(clock).isAfter(hoaDon.hanThanhToan())) {
            return hoaDon.trangThaiLuu();
        }
        return quyTacTrangThaiHoaDon.ghiNhanThanhToan(
                hoaDon.trangThaiLuu(),
                new TienTe(hoaDon.tongTien()),
                new TienTe(daThu),
                LocalDate.now(clock),
                hoaDon.hanThanhToan()
        );
    }

    private TrangThaiHoaDon chuyenTrangThai(
            TrangThaiHoaDon trangThaiHienTai,
            BigDecimal tongTien,
            BigDecimal daThu,
            LocalDate hanThanhToan
    ) {
        try {
            return quyTacTrangThaiHoaDon.ghiNhanThanhToan(
                    trangThaiHienTai,
                    new TienTe(tongTien),
                    new TienTe(daThu),
                    LocalDate.now(clock),
                    hanThanhToan
            );
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, THONG_BAO_CHUYEN_TRANG_THAI_KHONG_HOP_LE, exception);
        }
    }

    private YeuCauThanhToan chuanHoa(YeuCauThanhToan yeuCau) {
        if (yeuCau == null || yeuCau.soTien() == null || yeuCau.hinhThuc() == null || yeuCau.ngayThu() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        if (yeuCau.soTien().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_SO_TIEN_LON_HON_KHONG);
        }
        if (yeuCau.soTien().scale() > MONEY_SCALE
                || yeuCau.soTien().precision() - yeuCau.soTien().scale() > MONEY_PRECISION - MONEY_SCALE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        return new YeuCauThanhToan(yeuCau.soTien().setScale(MONEY_SCALE), yeuCau.hinhThuc(), yeuCau.ngayThu(), yeuCau.xacNhanThuThem());
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
