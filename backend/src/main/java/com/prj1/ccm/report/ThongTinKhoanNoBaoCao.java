package com.prj1.ccm.report;

import java.math.RoundingMode;

/** FR-RPT-03 is the exact-decimal API row used by the debt table and invoice drill-down. */
public record ThongTinKhoanNoBaoCao(
        Long hoaDonId,
        String maHoaDon,
        Long kyId,
        Long hopDongId,
        Long toaNhaId,
        String tenToaNha,
        String soPhong,
        Long nguoiThueId,
        String hoTenNguoiThue,
        String ngayPhatHanh,
        String hanThanhToan,
        String tongTien,
        String daThu,
        String conLai,
        Integer soNgayQuaHan
) {
    static ThongTinKhoanNoBaoCao tu(KhoanNoBaoCao no) {
        return new ThongTinKhoanNoBaoCao(
                no.hoaDonId(),
                no.maHoaDon(),
                no.kyId(),
                no.hopDongId(),
                no.toaNhaId(),
                no.tenToaNha(),
                no.soPhong(),
                no.nguoiThueId(),
                no.hoTenNguoiThue(),
                no.ngayPhatHanh().toString(),
                no.hanThanhToan().toString(),
                tien(no.tongTien()),
                tien(no.daThu()),
                tien(no.conLai()),
                no.soNgayQuaHan()
        );
    }

    private static String tien(java.math.BigDecimal value) {
        return value.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
    }
}
