package com.prj1.ccm.toanha;

import java.time.LocalDate;

public record KyThanhToan(
        Long id,
        Long toaNhaId,
        int nam,
        int thang,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        TrangThaiKy trangThai
) {
}
