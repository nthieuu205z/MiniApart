package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;

public record BacTinhTien(
        int bac,
        BigDecimal tuSoLuong,
        BigDecimal denSoLuong,
        BigDecimal dinhMucQuyDoi,
        BigDecimal soLuong,
        TienTe donGia,
        TienTe thanhTien
) {
}
