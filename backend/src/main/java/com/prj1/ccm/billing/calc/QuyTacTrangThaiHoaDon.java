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
        TrangThaiHoaDon mongMuon;
        if (soTienDaThu.giaTri().compareTo(tongPhaiThu.giaTri()) >= 0) {
            mongMuon = TrangThaiHoaDon.DA_THANH_TOAN;
        } else if (ngayHienTai.isAfter(hanThanhToan)) {
            mongMuon = TrangThaiHoaDon.QUA_HAN;
        } else {
            mongMuon = TrangThaiHoaDon.DA_THU_MOT_PHAN;
        }
        return chuyen(hienTai, mongMuon);
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
                TrangThaiHoaDon.QUA_HAN,
                TrangThaiHoaDon.DA_HUY
        ));
        hopLe.put(TrangThaiHoaDon.DA_THU_MOT_PHAN, EnumSet.of(
                TrangThaiHoaDon.DA_THANH_TOAN,
                TrangThaiHoaDon.QUA_HAN
        ));
        hopLe.put(TrangThaiHoaDon.QUA_HAN, EnumSet.of(TrangThaiHoaDon.DA_THANH_TOAN));
        hopLe.put(TrangThaiHoaDon.DA_THANH_TOAN, EnumSet.noneOf(TrangThaiHoaDon.class));
        hopLe.put(TrangThaiHoaDon.DA_HUY, EnumSet.noneOf(TrangThaiHoaDon.class));
        return Map.copyOf(hopLe);
    }
}
