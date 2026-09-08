package com.prj1.ccm.suachua;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/** BR-16/FR-MNT-03 keeps the repair-request lifecycle independent from infrastructure. */
public final class QuyTacTrangThaiYeuCau {
    private static final Map<TrangThaiYeuCau, Set<TrangThaiYeuCau>> CAC_BUOC_CHUYEN_HOP_LE = taoBangChuyenHopLe();

    public TrangThaiYeuCau chuyen(TrangThaiYeuCau hienTai, TrangThaiYeuCau mongMuon, String lyDo) {
        if (hienTai == null || mongMuon == null) {
            throw new IllegalArgumentException("Trang thai yeu cau sua chua khong duoc null");
        }
        if (mongMuon == TrangThaiYeuCau.DA_HUY && (lyDo == null || lyDo.isBlank())) {
            throw new IllegalArgumentException("Ly do huy yeu cau sua chua la bat buoc");
        }
        if (!CAC_BUOC_CHUYEN_HOP_LE.get(hienTai).contains(mongMuon)) {
            throw new IllegalArgumentException(
                    "Khong the chuyen trang thai yeu cau sua chua tu %s sang %s".formatted(hienTai, mongMuon)
            );
        }
        return mongMuon;
    }

    public TrangThaiYeuCau tiepNhan(TrangThaiYeuCau hienTai) {
        return chuyen(hienTai, TrangThaiYeuCau.DA_TIEP_NHAN, null);
    }

    public TrangThaiYeuCau phanCong(TrangThaiYeuCau hienTai) {
        return chuyen(hienTai, TrangThaiYeuCau.DA_PHAN_CONG, null);
    }

    public TrangThaiYeuCau batDauXuLy(TrangThaiYeuCau hienTai) {
        return chuyen(hienTai, TrangThaiYeuCau.DANG_XU_LY, null);
    }

    public TrangThaiYeuCau baoDaSuaXong(TrangThaiYeuCau hienTai) {
        return chuyen(hienTai, TrangThaiYeuCau.CHO_XAC_NHAN, null);
    }

    public TrangThaiYeuCau xacNhanDong(TrangThaiYeuCau hienTai) {
        return chuyen(hienTai, TrangThaiYeuCau.DA_DONG, null);
    }

    public TrangThaiYeuCau huy(TrangThaiYeuCau hienTai, String lyDo) {
        return chuyen(hienTai, TrangThaiYeuCau.DA_HUY, lyDo);
    }

    private static Map<TrangThaiYeuCau, Set<TrangThaiYeuCau>> taoBangChuyenHopLe() {
        Map<TrangThaiYeuCau, Set<TrangThaiYeuCau>> hopLe = new EnumMap<>(TrangThaiYeuCau.class);
        hopLe.put(TrangThaiYeuCau.MOI_TIEP_NHAN, EnumSet.of(TrangThaiYeuCau.DA_TIEP_NHAN, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DA_TIEP_NHAN, EnumSet.of(TrangThaiYeuCau.DA_PHAN_CONG, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DA_PHAN_CONG, EnumSet.of(TrangThaiYeuCau.DANG_XU_LY, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DANG_XU_LY, EnumSet.of(TrangThaiYeuCau.CHO_XAC_NHAN, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.CHO_XAC_NHAN, EnumSet.of(TrangThaiYeuCau.DA_DONG, TrangThaiYeuCau.DA_HUY));
        hopLe.put(TrangThaiYeuCau.DA_DONG, EnumSet.noneOf(TrangThaiYeuCau.class));
        hopLe.put(TrangThaiYeuCau.DA_HUY, EnumSet.noneOf(TrangThaiYeuCau.class));
        return Map.copyOf(hopLe);
    }
}
