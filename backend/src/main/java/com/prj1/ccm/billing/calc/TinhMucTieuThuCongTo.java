package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;

public final class TinhMucTieuThuCongTo {
    private TinhMucTieuThuCongTo() {
    }

    public static BigDecimal tinh(
            BigDecimal chiSoDau,
            BigDecimal chiSoCuoi,
            BigDecimal chiSoCuoiCongToCu,
            BigDecimal chiSoDauCongToMoi
    ) {
        if (chiSoCuoiCongToCu == null && chiSoDauCongToMoi == null) {
            return chiSoCuoi.subtract(chiSoDau);
        }
        return chiSoCuoiCongToCu.subtract(chiSoDau)
                .add(chiSoCuoi.subtract(chiSoDauCongToMoi));
    }
}
