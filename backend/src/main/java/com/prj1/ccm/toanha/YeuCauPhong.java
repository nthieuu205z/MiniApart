package com.prj1.ccm.toanha;

import java.math.BigDecimal;

public record YeuCauPhong(
        String soPhong,
        Integer tang,
        BigDecimal dienTich,
        Integer sucChua,
        BigDecimal giaThueMacDinh,
        String loaiPhong
) {
}
