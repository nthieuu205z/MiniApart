package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;

public record ChiSoDichVu(
        Long id,
        Long kyId,
        Long phongId,
        Long dichVuId,
        BigDecimal chiSoDau,
        BigDecimal chiSoCuoi,
        BigDecimal chiSoCuoiCongToCu,
        BigDecimal chiSoDauCongToMoi,
        boolean coThayCongTo
) {
}
