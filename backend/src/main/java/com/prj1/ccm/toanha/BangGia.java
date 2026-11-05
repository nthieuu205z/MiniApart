package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BangGia(
        Long id,
        Long dichVuId,
        BigDecimal donGia,
        LocalDate ngayHieuLuc
) {
}
