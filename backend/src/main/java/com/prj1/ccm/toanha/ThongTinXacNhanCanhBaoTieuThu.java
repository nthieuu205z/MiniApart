package com.prj1.ccm.toanha;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ThongTinXacNhanCanhBaoTieuThu(
        boolean coCanhBao,
        String thongBaoCanhBao,
        String mucTieuThuKyNay,
        String trungBinhBaKyTruoc,
        String gapTrungBinh,
        String nguongCanhBao
) {
    BigDecimal mucTieuThuKyNayAsBigDecimal() {
        return new BigDecimal(mucTieuThuKyNay);
    }

    BigDecimal trungBinhBaKyTruocAsBigDecimal() {
        return new BigDecimal(trungBinhBaKyTruoc);
    }

    BigDecimal gapTrungBinhAsBigDecimal() {
        return new BigDecimal(gapTrungBinh);
    }
}
