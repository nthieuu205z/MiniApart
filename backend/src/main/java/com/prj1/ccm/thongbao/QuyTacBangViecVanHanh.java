package com.prj1.ccm.thongbao;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import com.prj1.ccm.hopdong.HopDong;
import com.prj1.ccm.suachua.QuyTacTrangThaiYeuCau;
import com.prj1.ccm.suachua.TrangThaiYeuCau;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;

/** FR-NTF-01 and BR-14 keep dashboard boundaries as pure query-time rules. */
public final class QuyTacBangViecVanHanh {
    public static final String PCCC_TRANG_THAI = "CHUA_SAN_SANG";
    public static final Integer PCCC_SO_LUONG = null;

    private static final Duration TUOI_SU_CO_TOI_THIEU = Duration.ofHours(48);
    private static final QuyTacTrangThaiYeuCau QUY_TAC_SU_CO = new QuyTacTrangThaiYeuCau();

    /** BR-14 includes the end date and excludes expired or settled contracts. */
    public boolean hopDongSapHetHan(HopDong hopDong, LocalDate homNay) {
        return hopDong.sapHetHan(homNay);
    }

    /** FR-NTF-01 counts only issued, unpaid invoices strictly after their due date. */
    public boolean hoaDonQuaHanChuaThanhToan(
            LocalDate homNay,
            LocalDate hanThanhToan,
            BigDecimal tongTien,
            BigDecimal daThu,
            TrangThaiHoaDon trangThai
    ) {
        return trangThai != TrangThaiHoaDon.NHAP
                && trangThai != TrangThaiHoaDon.DA_HUY
                && homNay.isAfter(hanThanhToan)
                && daThu.compareTo(tongTien) < 0;
    }

    /** FR-NTF-01 counts an incident only while its effective lifecycle remains open and its age exceeds 48 hours. */
    public boolean suCoTonDongQuaHaiMuoiTamGio(
            Instant taoLuc,
            TrangThaiYeuCau trangThaiLuu,
            Instant choXacNhanLuc,
            Instant hienTai
    ) {
        TrangThaiYeuCau trangThaiHieuLuc = QUY_TAC_SU_CO.trangThaiHieuLuc(
                trangThaiLuu, choXacNhanLuc, hienTai
        );
        return trangThaiHieuLuc != TrangThaiYeuCau.DA_DONG
                && trangThaiHieuLuc != TrangThaiYeuCau.DA_HUY
                && hienTai.isAfter(taoLuc.plus(TUOI_SU_CO_TOI_THIEU));
    }

    /** FR-NTF-01 uses a semantic status so empty groups remain visible and actionable. */
    public String trangThaiNhom(int soLuong) {
        return soLuong == 0 ? "DA_XONG" : "CAN_XU_LY";
    }
}
