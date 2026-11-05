package com.prj1.ccm.billing;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.prj1.ccm.billing.calc.BacTinhTien;
import com.prj1.ccm.billing.calc.DongChiTiet;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinDongHoaDon(
        String tenKhoan,
        String chiSoDau,
        String chiSoCuoi,
        String soLuong,
        String donGia,
        String thanhTien,
        String loaiKhoan,
        Long dichVuId,
        String dienGiai,
        Long anhCongToId,
        String anhCongToUrl,
        List<ThongTinBacHoaDon> cacBac,
        String lyDo
) {
    public ThongTinDongHoaDon(
            String tenKhoan,
            String chiSoDau,
            String chiSoCuoi,
            String soLuong,
            String donGia,
            String thanhTien,
            String loaiKhoan
    ) {
        this(tenKhoan, chiSoDau, chiSoCuoi, soLuong, donGia, thanhTien, loaiKhoan,
                null, null, null, null, List.of(), null);
    }

    static ThongTinDongHoaDon tu(DongChiTiet dong) {
        return new ThongTinDongHoaDon(
                dong.tenKhoan(),
                dong.chiSoDau() == null ? null : dong.chiSoDau().toPlainString(),
                dong.chiSoCuoi() == null ? null : dong.chiSoCuoi().toPlainString(),
                dong.soLuong() == null ? null : dong.soLuong().toPlainString(),
                dong.donGia() == null ? null : dong.donGia().giaTri().toPlainString(),
                dong.thanhTien().giaTri().toPlainString(),
                dong.loaiKhoan().name(),
                dong.dichVuId(),
                dienGiai(dong),
                null,
                null,
                dong.cacBac().stream().map(ThongTinBacHoaDon::tu).toList(),
                null
        );
    }

    static ThongTinDongHoaDon tu(DongHoaDonDuLieu dong) {
        return new ThongTinDongHoaDon(
                dong.tenKhoan(),
                toPlain(dong.chiSoDau()),
                toPlain(dong.chiSoCuoi()),
                toPlain(dong.soLuong()),
                toPlain(dong.donGia()),
                toPlain(dong.thanhTien()),
                dong.loaiKhoan(),
                dong.dichVuId(),
                dong.dienGiai() == null ? dienGiai(dong) : dong.dienGiai(),
                dong.anhCongToId(),
                null,
                dong.cacBac().stream().map(ThongTinBacHoaDon::tu).toList(),
                dong.lyDo()
        );
    }

    private static String dienGiai(DongChiTiet dong) {
        if (dong.loaiKhoan().name().equals("LAM_TRON")) {
            return "Lam tron = " + dong.thanhTien().giaTri().toPlainString();
        }
        if (dong.chiSoDau() != null && dong.chiSoCuoi() != null && dong.donGia() != null) {
            return "(" + dong.chiSoCuoi().toPlainString() + " - " + dong.chiSoDau().toPlainString()
                    + ") x " + dong.donGia().giaTri().toPlainString() + " = "
                    + dong.thanhTien().giaTri().toPlainString();
        }
        if (dong.chiSoDau() != null && dong.chiSoCuoi() != null && !dong.cacBac().isEmpty()) {
            return "(" + dong.chiSoCuoi().toPlainString() + " - " + dong.chiSoDau().toPlainString()
                    + ") = " + dong.soLuong().toPlainString() + "; xem chi tiet tung bac";
        }
        if (dong.soLuong() != null && dong.donGia() != null) {
            return dong.soLuong().toPlainString() + " x " + dong.donGia().giaTri().toPlainString()
                    + " = " + dong.thanhTien().giaTri().toPlainString();
        }
        return dong.tenKhoan();
    }

    static String dienGiai(DongHoaDonDuLieu dong) {
        if (dong.thanhTien() == null) return dong.tenKhoan();
        if (dong.tenKhoan().contains("(") && dong.soLuong() != null && dong.donGia() != null) {
            return dong.tenKhoan() + ": " + dong.soLuong().toPlainString() + " x "
                    + dong.donGia().toPlainString() + " = " + dong.thanhTien().toPlainString();
        }
        if (dong.chiSoDau() != null && dong.chiSoCuoi() != null && dong.donGia() != null) {
            return "(" + dong.chiSoCuoi().toPlainString() + " - " + dong.chiSoDau().toPlainString()
                    + ") x " + dong.donGia().toPlainString() + " = " + dong.thanhTien().toPlainString();
        }
        if (dong.soLuong() != null && dong.donGia() != null) {
            return dong.soLuong().toPlainString() + " x " + dong.donGia().toPlainString()
                    + " = " + dong.thanhTien().toPlainString();
        }
        return dong.tenKhoan() + " = " + dong.thanhTien().toPlainString();
    }

    private static String toPlain(java.math.BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }
}
