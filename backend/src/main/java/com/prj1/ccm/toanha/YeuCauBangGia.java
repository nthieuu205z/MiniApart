package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDate;

public record YeuCauBangGia(
        BigDecimal donGia,
        LocalDate ngayHieuLuc
) {
}
