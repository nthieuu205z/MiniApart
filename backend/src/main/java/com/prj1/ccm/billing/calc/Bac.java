package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;

public record Bac(
        int thuTu,
        BigDecimal tuSoLuong,
        BigDecimal denSoLuong,
        TienTe donGia
) {
    public BigDecimal phanRoiVao(BigDecimal soLuong) {
        if (soLuong.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal mocDuoi = tuSoLuong().signum() == 0
                ? tuSoLuong()
                : tuSoLuong().subtract(BigDecimal.ONE);
        return soLuong.min(denSoLuong()).subtract(mocDuoi).max(BigDecimal.ZERO);
    }
}
