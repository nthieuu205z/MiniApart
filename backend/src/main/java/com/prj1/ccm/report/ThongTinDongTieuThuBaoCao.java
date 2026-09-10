package com.prj1.ccm.report;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record ThongTinDongTieuThuBaoCao(
        Long kyId,
        Integer nam,
        Integer thang,
        String nhanKy,
        String tuNgay,
        String denNgay,
        Long toaNhaId,
        String maToa,
        String tenToaNha,
        Long phongId,
        String soPhong,
        Integer tang,
        Long hopDongId,
        Long dichVuId,
        String tenDichVu,
        String donVi,
        boolean laDien,
        String chiSoDau,
        String chiSoCuoi,
        boolean coThayCongTo,
        String chiSoCuoiCongToCu,
        String chiSoDauCongToMoi,
        String mucTieuThu,
        boolean coDuLieu
) {
    static ThongTinDongTieuThuBaoCao tu(KhoanTieuThuBaoCao dong) {
        return new ThongTinDongTieuThuBaoCao(
                dong.kyId(),
                dong.nam(),
                dong.thang(),
                "%02d/%d".formatted(dong.thang(), dong.nam()),
                dong.ngayBatDau().toString(),
                dong.ngayKetThuc().toString(),
                dong.toaNhaId(),
                dong.maToa(),
                dong.tenToaNha(),
                dong.phongId(),
                dong.soPhong(),
                dong.tang(),
                dong.hopDongId(),
                dong.dichVuId(),
                dong.tenDichVu(),
                dong.donVi(),
                dong.laDien(),
                toPlain(dong.chiSoDau()),
                toPlain(dong.chiSoCuoi()),
                dong.coThayCongTo(),
                toPlain(dong.chiSoCuoiCongToCu()),
                toPlain(dong.chiSoDauCongToMoi()),
                toPlain(dong.mucTieuThu()),
                dong.coDuLieu()
        );
    }

    private static String toPlain(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
    }
}
