package com.prj1.ccm.toanha;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.RoundingMode;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinBacGia(
        Integer bac,
        String tuSoLuong,
        String denSoLuong,
        String tyLe,
        String donGia
) {
    public static ThongTinBacGia tuBangGiaBacThang(BangGiaBacThang bangGiaBacThang) {
        return new ThongTinBacGia(
                bangGiaBacThang.bac(),
                bangGiaBacThang.tuSoLuong().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                bangGiaBacThang.denSoLuong() == null ? null : bangGiaBacThang.denSoLuong().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                bangGiaBacThang.tyLe().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                bangGiaBacThang.donGia().setScale(2, RoundingMode.UNNECESSARY).toPlainString()
        );
    }
}
