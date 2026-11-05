package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BangGiaBacThang(
        Long id,
        Long dichVuId,
        Integer bac,
        BigDecimal tuSoLuong,
        BigDecimal denSoLuong,
        BigDecimal tyLe,
        BigDecimal donGia,
        LocalDate ngayHieuLuc
) {
}
