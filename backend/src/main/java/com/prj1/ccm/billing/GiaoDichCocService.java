package com.prj1.ccm.billing;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import com.prj1.ccm.nguoithue.NhatKyThaoTacRepository;
import com.prj1.ccm.toanha.PhanQuyenToaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;

@Service
public class GiaoDichCocService {
    private static final int MONEY_SCALE = 2;
    private static final int MONEY_PRECISION = 15;
    private static final String THONG_BAO_YEU_CAU_KHONG_HOP_LE = "Yêu cầu thu tiền cọc không hợp lệ.";
    private static final String THONG_BAO_SO_TIEN_LON_HON_KHONG = "Số tiền cọc phải lớn hơn 0.";
    private static final String THONG_BAO_VUOT_MUC_COC =
            "Tổng tiền cọc đã thu (%s) cộng khoản này vượt số tiền cọc theo hợp đồng (%s).";

    private final GiaoDichCocRepository giaoDichCocRepository;
    private final PhanQuyenToaService phanQuyenToaService;
    private final NhatKyThaoTacRepository nhatKyThaoTacRepository;
    private final Clock clock;

    public GiaoDichCocService(
            GiaoDichCocRepository giaoDichCocRepository,
            PhanQuyenToaService phanQuyenToaService,
            NhatKyThaoTacRepository nhatKyThaoTacRepository, Clock clock
    ) {
        this.giaoDichCocRepository = giaoDichCocRepository;
        this.phanQuyenToaService = phanQuyenToaService;
        this.nhatKyThaoTacRepository = nhatKyThaoTacRepository;
        this.clock = clock;
    }

    /** FR-TNT-08, FR-TNT-09 and BR-07 settle the collected deposit after the final invoice is issued. */
    @Transactional
    public void quyetToan(Long hopDongId, BigDecimal khauTru, String lyDo, String maToa, int soNgayHan, NguoiDung nguoiDung) {
        BigDecimal khauTruHopLe = khauTru == null ? BigDecimal.ZERO : khauTru.setScale(MONEY_SCALE);
        if (khauTruHopLe.signum() < 0 || (khauTruHopLe.signum() > 0 && (lyDo == null || lyDo.isBlank()))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khấu trừ hư hỏng cần số tiền không âm và lý do không rỗng.");
        BigDecimal daThu = giaoDichCocRepository.tongThuCoc(hopDongId).setScale(MONEY_SCALE);
        BigDecimal congNo = giaoDichCocRepository.tongCongNo(hopDongId).setScale(MONEY_SCALE);
        LocalDate ngay = LocalDate.now(clock);
        if (khauTruHopLe.signum() > 0) giaoDichCocRepository.ghi(new GiaoDichCocRepository.GiaoDichCocMoi(hopDongId, LoaiGiaoDichCoc.KHAU_TRU_COC, khauTruHopLe, ngay, nguoiDung.id(), lyDo.trim()));
        BigDecimal ketQua = daThu.subtract(congNo).subtract(khauTruHopLe);
        if (ketQua.signum() > 0) giaoDichCocRepository.ghi(new GiaoDichCocRepository.GiaoDichCocMoi(hopDongId, LoaiGiaoDichCoc.HOAN_COC, ketQua, ngay, nguoiDung.id(), null));
        if (ketQua.signum() < 0) giaoDichCocRepository.taoHoaDonQuyetToan(hopDongId, "QT-" + maToa + "-" + hopDongId, ngay, ngay.plusDays(soNgayHan), ketQua.negate());
    }

    /** FR-TNT-04, CR-009, BR-07, and US-09 record one immutable deposit receipt outside the invoice ledger. */
    @Transactional
    public ThongTinGiaoDichCoc thuCoc(Long hopDongId, YeuCauThuCoc yeuCau, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        YeuCauThuCoc hopLe = chuanHoa(yeuCau);
        GiaoDichCocRepository.HopDongTrongPhamVi hopDong = giaoDichCocRepository
                .timHopDongVaKhoa(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDong.toaNhaId());

        BigDecimal daThu = giaoDichCocRepository.tongThuCoc(hopDongId).setScale(MONEY_SCALE);
        BigDecimal tongSauKhiThu = daThu.add(hopLe.soTien());
        BigDecimal tienCocThoaThuan = hopDong.tienCoc().setScale(MONEY_SCALE);
        if (tongSauKhiThu.compareTo(tienCocThoaThuan) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    THONG_BAO_VUOT_MUC_COC.formatted(daThu.toPlainString(), tienCocThoaThuan.toPlainString())
            );
        }

        GiaoDichCocRepository.GiaoDichCocDaGhi giaoDich = giaoDichCocRepository.ghi(
                new GiaoDichCocRepository.GiaoDichCocMoi(
                        hopDongId,
                        LoaiGiaoDichCoc.THU_COC,
                        hopLe.soTien(),
                        hopLe.ngay(),
                        nguoiDung.id(),
                        hopLe.lyDo()
                )
        );
        nhatKyThaoTacRepository.ghi(
                nguoiDung.id(),
                "THU_COC",
                "HOP_DONG:" + hopDongId,
                daThu.toPlainString(),
                tongSauKhiThu.toPlainString(),
                null,
                null,
                hopLe.lyDo(),
                null
        );
        return ThongTinGiaoDichCoc.tao(giaoDich);
    }

    /** FR-TNT-04, CR-009, and BR-07 expose the agreed deposit, the collected total, and its independent transactions. */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public ThongTinTienCoc xem(Long hopDongId, NguoiDung nguoiDung) {
        kiemTraVaiTro(nguoiDung);
        GiaoDichCocRepository.HopDongTrongPhamVi hopDong = giaoDichCocRepository
                .timHopDong(hopDongId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        phanQuyenToaService.layToaNhaNeuNhanVienDuocXem(nguoiDung, hopDong.toaNhaId());
        BigDecimal tongDaThu = giaoDichCocRepository.tongThuCoc(hopDongId).setScale(MONEY_SCALE);
        return ThongTinTienCoc.tao(
                hopDongId,
                hopDong.tienCoc().setScale(MONEY_SCALE),
                tongDaThu,
                giaoDichCocRepository.timTheoHopDong(hopDongId).stream()
                        .map(ThongTinGiaoDichCoc::tao)
                        .toList()
        );
    }

    private YeuCauThuCoc chuanHoa(YeuCauThuCoc yeuCau) {
        if (yeuCau == null || yeuCau.soTien() == null || yeuCau.ngay() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        if (yeuCau.soTien().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_SO_TIEN_LON_HON_KHONG);
        }
        if (yeuCau.soTien().scale() > MONEY_SCALE
                || yeuCau.soTien().precision() - yeuCau.soTien().scale() > MONEY_PRECISION - MONEY_SCALE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, THONG_BAO_YEU_CAU_KHONG_HOP_LE);
        }
        return new YeuCauThuCoc(
                yeuCau.soTien().setScale(MONEY_SCALE),
                yeuCau.ngay(),
                yeuCau.lyDo() == null || yeuCau.lyDo().isBlank() ? null : yeuCau.lyDo().trim()
        );
    }

    private void kiemTraVaiTro(NguoiDung nguoiDung) {
        if (nguoiDung == null || (nguoiDung.vaiTro() != VaiTro.CHU && nguoiDung.vaiTro() != VaiTro.QUAN_LY)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
