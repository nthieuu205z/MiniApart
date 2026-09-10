package com.prj1.ccm.report;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record ThongTinDiemTieuThuBaoCao(
        Long kyId,
        Integer nam,
        Integer thang,
        String nhanKy,
        String donVi,
        boolean laDien,
        String mucTieuThu,
        int soDong,
        int soDongCoDuLieu
) {
    static ThongTinDiemTieuThuBaoCao tu(KhoanTieuThuBaoCao dauTien, BigDecimal tong, int soDong, int soDongCoDuLieu) {
        return new ThongTinDiemTieuThuBaoCao(
                dauTien.kyId(),
                dauTien.nam(),
                dauTien.thang(),
                "%02d/%d".formatted(dauTien.thang(), dauTien.nam()),
                dauTien.donVi(),
                dauTien.laDien(),
                tong == null ? null : tong.setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                soDong,
                soDongCoDuLieu
        );
    }
}
