package com.prj1.ccm.toanha;

import java.math.BigDecimal;

public record YeuCauPhongHangLoat(
        String soBatDau,
        String soKetThuc,
        Integer tang,
        BigDecimal dienTich,
        Integer sucChua,
        BigDecimal giaThueMacDinh,
        String loaiPhong
) {
}
