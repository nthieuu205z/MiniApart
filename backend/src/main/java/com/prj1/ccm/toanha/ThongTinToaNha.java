package com.prj1.ccm.toanha;

import java.math.RoundingMode;

public record ThongTinToaNha(
        Long id,
        String maToa,
        String ten,
        String diaChi,
        int soTang,
        int ngayChotSo,
        int soNgayHanTt,
        String tkNganHang,
        String nguongThatThoat
) {
    public static ThongTinToaNha tuToaNha(ToaNha toaNha) {
        return new ThongTinToaNha(
                toaNha.id(),
                toaNha.maToa(),
                toaNha.ten(),
                toaNha.diaChi(),
                toaNha.soTang(),
                toaNha.ngayChotSo(),
                toaNha.soNgayHanTt(),
                toaNha.tkNganHang(),
                toaNha.nguongThatThoat().setScale(2, RoundingMode.UNNECESSARY).toPlainString()
        );
    }
}
