package com.prj1.ccm.hopdong;

import java.math.RoundingMode;

public record ThongTinHopDongDichVu(
        Long dichVuId,
        String tenDichVu,
        String donGiaApDung
) {
    public static ThongTinHopDongDichVu tao(Long dichVuId, String tenDichVu, java.math.BigDecimal donGiaApDung) {
        return new ThongTinHopDongDichVu(
                dichVuId,
                tenDichVu,
                donGiaApDung.setScale(2, RoundingMode.UNNECESSARY).toPlainString()
        );
    }
}
