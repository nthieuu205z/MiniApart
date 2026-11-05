package com.prj1.ccm.hopdong;

import java.math.BigDecimal;

public record HopDongDichVu(
        Long hopDongId,
        Long dichVuId,
        BigDecimal donGiaApDung
) {
}
