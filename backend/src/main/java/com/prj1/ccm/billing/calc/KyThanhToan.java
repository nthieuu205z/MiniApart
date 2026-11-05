package com.prj1.ccm.billing.calc;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record KyThanhToan(
        Long id,
        Long toaNhaId,
        int nam,
        int thang,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc
) {
    public int soNgayTrongKy() {
        return Math.toIntExact(ChronoUnit.DAYS.between(ngayBatDau, ngayKetThuc));
    }
}
