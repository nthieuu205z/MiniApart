package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ChiSoDichVu(
        Long id,
        Long kyId,
        Long phongId,
        Long dichVuId,
        BigDecimal chiSoDau,
        BigDecimal chiSoCuoi,
        BigDecimal chiSoCuoiCongToCu,
        BigDecimal chiSoDauCongToMoi,
        boolean coThayCongTo,
        Long nguoiGhiId,
        LocalDateTime thoiDiemGhi
) {
}
