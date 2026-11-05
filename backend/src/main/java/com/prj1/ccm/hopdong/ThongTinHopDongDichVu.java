package com.prj1.ccm.hopdong;

import java.math.RoundingMode;

public record ThongTinHopDongDichVu(
        Long dichVuId,
        String tenDichVu,
        String donGiaApDung,
        String cheDoGia
) {
    public ThongTinHopDongDichVu(Long dichVuId, String tenDichVu, String donGiaApDung) {
        this(dichVuId, tenDichVu, donGiaApDung, null);
    }

    public static ThongTinHopDongDichVu tao(Long dichVuId, String tenDichVu, java.math.BigDecimal donGiaApDung) {
        return tao(dichVuId, tenDichVu, donGiaApDung, null);
    }

    public static ThongTinHopDongDichVu tao(Long dichVuId, String tenDichVu, java.math.BigDecimal donGiaApDung, String cheDoGia) {
        return new ThongTinHopDongDichVu(
                dichVuId,
                tenDichVu,
                donGiaApDung == null ? "0.00" : donGiaApDung.setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                cheDoGia
        );
    }
}
