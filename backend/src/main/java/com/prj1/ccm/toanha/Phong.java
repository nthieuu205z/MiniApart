package com.prj1.ccm.toanha;

import java.math.BigDecimal;

public record Phong(
        Long id,
        Long toaNhaId,
        String soPhong,
        int tang,
        BigDecimal dienTich,
        int sucChua,
        BigDecimal giaThueMacDinh,
        String loaiPhong,
        TrangThaiPhong trangThaiDem
) {
}
