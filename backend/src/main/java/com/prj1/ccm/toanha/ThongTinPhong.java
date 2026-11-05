package com.prj1.ccm.toanha;

import java.math.RoundingMode;

public record ThongTinPhong(
        Long id,
        Long toaNhaId,
        String soPhong,
        int tang,
        String dienTich,
        int sucChua,
        String giaThueMacDinh,
        String loaiPhong,
        String trangThai,
        String tenTrangThai
) {
    public static ThongTinPhong tuPhong(Phong phong) {
        return new ThongTinPhong(
                phong.id(),
                phong.toaNhaId(),
                phong.soPhong(),
                phong.tang(),
                phong.dienTich().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                phong.sucChua(),
                phong.giaThueMacDinh().setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                phong.loaiPhong(),
                phong.trangThaiDem().name(),
                phong.trangThaiDem().tenHienThi()
        );
    }
}
