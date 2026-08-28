package com.prj1.ccm.toanha;

import java.math.RoundingMode;
import java.time.LocalDate;

public record ThongTinBangGia(
        Long id,
        Long dichVuId,
        String donGia,
        LocalDate ngayHieuLuc,
        boolean dangApDung
) {
    public static ThongTinBangGia tuBangGia(BangGia bangGia, boolean dangApDung) {
        return new ThongTinBangGia(
                bangGia.id(),
                bangGia.dichVuId(),
                bangGia.donGia().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                bangGia.ngayHieuLuc(),
                dangApDung
        );
    }
}
