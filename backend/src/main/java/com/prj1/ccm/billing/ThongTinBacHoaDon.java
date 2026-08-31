package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.BacTinhTien;

public record ThongTinBacHoaDon(
        int bac,
        String tuSoLuong,
        String denSoLuong,
        String dinhMucQuyDoi,
        String soLuong,
        String donGia,
        String thanhTien,
        String dienGiai
) {
    static ThongTinBacHoaDon tu(BacTinhTien bac) {
        return new ThongTinBacHoaDon(
                bac.bac(),
                bac.tuSoLuong().toPlainString(),
                bac.denSoLuong() == null ? null : bac.denSoLuong().toPlainString(),
                bac.dinhMucQuyDoi() == null ? null : bac.dinhMucQuyDoi().toPlainString(),
                bac.soLuong().toPlainString(),
                bac.donGia().giaTri().toPlainString(),
                bac.thanhTien().giaTri().toPlainString(),
                dienGiai(bac)
        );
    }

    static ThongTinBacHoaDon tu(BacHoaDonDuLieu bac) {
        return new ThongTinBacHoaDon(
                bac.bac(),
                bac.tuSoLuong().toPlainString(),
                bac.denSoLuong() == null ? null : bac.denSoLuong().toPlainString(),
                bac.dinhMucQuyDoi() == null ? null : bac.dinhMucQuyDoi().toPlainString(),
                bac.soLuong().toPlainString(),
                bac.donGia().toPlainString(),
                bac.thanhTien().toPlainString(),
                dienGiai(bac)
        );
    }

    private static String dienGiai(BacTinhTien bac) {
        return "Bac " + bac.bac() + ": " + bac.soLuong().toPlainString() + " x "
                + bac.donGia().giaTri().toPlainString() + " = " + bac.thanhTien().giaTri().toPlainString();
    }

    private static String dienGiai(BacHoaDonDuLieu bac) {
        return "Bac " + bac.bac() + ": " + bac.soLuong().toPlainString() + " x "
                + bac.donGia().toPlainString() + " = " + bac.thanhTien().toPlainString();
    }
}
