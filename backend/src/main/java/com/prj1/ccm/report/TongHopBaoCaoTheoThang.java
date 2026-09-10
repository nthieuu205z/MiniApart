package com.prj1.ccm.report;

import java.math.BigDecimal;
import java.time.LocalDate;

record TongHopBaoCaoTheoThang(
        LocalDate thang,
        BigDecimal doanhThuPhatHanh,
        BigDecimal daThu,
        BigDecimal congNo
) {
}
