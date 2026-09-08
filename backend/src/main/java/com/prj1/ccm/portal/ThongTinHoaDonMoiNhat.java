package com.prj1.ccm.portal;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.prj1.ccm.billing.ThongTinHoaDonChiTiet;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinHoaDonMoiNhat(
        boolean coHoaDon,
        String thongBao,
        ThongTinHoaDonChiTiet hoaDon
) {
    public static ThongTinHoaDonMoiNhat coHoaDon(ThongTinHoaDonChiTiet hoaDon) {
        return new ThongTinHoaDonMoiNhat(true, null, hoaDon);
    }

    public static ThongTinHoaDonMoiNhat rong() {
        return new ThongTinHoaDonMoiNhat(false, "Chưa có hoá đơn nào cho tài khoản này.", null);
    }
}
