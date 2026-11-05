package com.prj1.ccm.billing.calc;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public final class QuyTacTrangThaiHoaDon {
    private static final Map<TrangThaiHoaDon, Set<TrangThaiHoaDon>> CAC_BUOC_CHUYEN_HOP_LE = taoBangChuyenHopLe();

    public TrangThaiHoaDon chuyen(TrangThaiHoaDon hienTai, TrangThaiHoaDon mongMuon) {
        if (hienTai == null || mongMuon == null) {
            throw new IllegalArgumentException("Trang thai hoa don khong duoc null");
        }
        if (hienTai == mongMuon) {
            return hienTai;
        }
        if (!CAC_BUOC_CHUYEN_HOP_LE.get(hienTai).contains(mongMuon)) {
            throw new IllegalArgumentException(
                    "Khong the chuyen trang thai hoa don tu %s sang %s".formatted(hienTai, mongMuon)
            );
        }
        return mongMuon;
    }

    public TrangThaiHoaDon phatHanh(TrangThaiHoaDon hienTai) {
        return chuyen(hienTai, TrangThaiHoaDon.DA_PHAT_HANH);
    }

    public TrangThaiHoaDon ghiNhanThanhToan(
            TrangThaiHoaDon hienTai,
            TienTe tongPhaiThu,
            TienTe soTienDaThu,
            LocalDate ngayHienTai,
            LocalDate hanThanhToan
    ) {
        return chuyen(hienTai, xacDinhTrangThaiSauThanhToan(
                tongPhaiThu,
                soTienDaThu,
                ngayHienTai,
                hanThanhToan
        ));
    }

    /**
     * BR-08/FR-INV-14: recalculate the invoice state for an explicit counter-entry.
     * The regular payment path deliberately keeps paid invoices terminal; only this
     * named path may reflect a paid amount reduced by an accounting correction.
     */
    public TrangThaiHoaDon ghiNhanThanhToanDoiUng(
            TrangThaiHoaDon hienTai,
            TienTe tongPhaiThu,
            TienTe soTienDaThu,
            LocalDate ngayHienTai,
            LocalDate hanThanhToan
    ) {
        TrangThaiHoaDon mongMuon = xacDinhTrangThaiSauThanhToan(
                tongPhaiThu,
                soTienDaThu,
                ngayHienTai,
                hanThanhToan
        );
        if (hienTai == TrangThaiHoaDon.DA_THANH_TOAN
                && mongMuon != TrangThaiHoaDon.DA_THANH_TOAN) {
            return mongMuon;
        }
        return chuyen(hienTai, mongMuon);
    }

    private TrangThaiHoaDon xacDinhTrangThaiSauThanhToan(
            TienTe tongPhaiThu,
            TienTe soTienDaThu,
            LocalDate ngayHienTai,
            LocalDate hanThanhToan
    ) {
        if (soTienDaThu.giaTri().compareTo(tongPhaiThu.giaTri()) >= 0) {
            return TrangThaiHoaDon.DA_THANH_TOAN;
        }
        return ngayHienTai.isAfter(hanThanhToan)
                ? TrangThaiHoaDon.QUA_HAN
                : TrangThaiHoaDon.DA_THU_MOT_PHAN;
    }

    public TrangThaiHoaDon huy(TrangThaiHoaDon hienTai, boolean laChuSoHuu, String lyDo) {
        if (!laChuSoHuu || lyDo == null || lyDo.isBlank()) {
            throw new IllegalArgumentException("Chu so huu va ly do huy hoa don la bat buoc");
        }
        return chuyen(hienTai, TrangThaiHoaDon.DA_HUY);
    }

    public boolean choPhepSuaNoiDung(TrangThaiHoaDon hienTai) {
        return hienTai == TrangThaiHoaDon.NHAP;
    }

    private static Map<TrangThaiHoaDon, Set<TrangThaiHoaDon>> taoBangChuyenHopLe() {
        Map<TrangThaiHoaDon, Set<TrangThaiHoaDon>> hopLe = new EnumMap<>(TrangThaiHoaDon.class);
        hopLe.put(TrangThaiHoaDon.NHAP, EnumSet.of(TrangThaiHoaDon.DA_PHAT_HANH, TrangThaiHoaDon.DA_HUY));
        hopLe.put(TrangThaiHoaDon.DA_PHAT_HANH, EnumSet.of(
                TrangThaiHoaDon.DA_THU_MOT_PHAN,
                TrangThaiHoaDon.DA_THANH_TOAN,
                TrangThaiHoaDon.QUA_HAN,
                TrangThaiHoaDon.DA_HUY
        ));
        hopLe.put(TrangThaiHoaDon.DA_THU_MOT_PHAN, EnumSet.of(
                TrangThaiHoaDon.DA_THANH_TOAN,
                TrangThaiHoaDon.QUA_HAN
        ));
        hopLe.put(TrangThaiHoaDon.QUA_HAN, EnumSet.of(TrangThaiHoaDon.DA_THANH_TOAN, TrangThaiHoaDon.DA_HUY));
        hopLe.put(TrangThaiHoaDon.DA_THANH_TOAN, EnumSet.noneOf(TrangThaiHoaDon.class));
        hopLe.put(TrangThaiHoaDon.DA_HUY, EnumSet.noneOf(TrangThaiHoaDon.class));
        return Map.copyOf(hopLe);
    }
}
