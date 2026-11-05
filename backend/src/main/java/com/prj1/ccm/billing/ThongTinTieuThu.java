package com.prj1.ccm.billing;

import java.math.BigDecimal;

/** FR-POR-05 exposes the exact meter values needed by both the chart and its accessible table. */
public record ThongTinTieuThu(
        Long kyId,
        Long hoaDonId,
        Integer nam,
        Integer thang,
        Long hopDongId,
        String soPhong,
        Long dichVuId,
        String tenDichVu,
        String donVi,
        String chiSoDau,
        String chiSoCuoi,
        String mucTieuThu
) {
    static ThongTinTieuThu tu(TieuThuDuLieu dong) {
        return new ThongTinTieuThu(
                dong.kyId(),
                dong.hoaDonId(),
                dong.nam(),
                dong.thang(),
                dong.hopDongId(),
                dong.soPhong(),
                dong.dichVuId(),
                dong.tenDichVu(),
                dong.donVi(),
                toPlain(dong.chiSoDau()),
                toPlain(dong.chiSoCuoi()),
                toPlain(dong.mucTieuThu())
        );
    }

    private static String toPlain(BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }
}
