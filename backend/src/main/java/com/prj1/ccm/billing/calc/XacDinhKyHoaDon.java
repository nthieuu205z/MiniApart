package com.prj1.ccm.billing.calc;

import java.time.LocalDate;
import java.time.YearMonth;

public final class XacDinhKyHoaDon {
    public KyThanhToan tinh(Long toaNhaId, int nam, int thang, int ngayChotSo) {
        YearMonth thangHienTai = YearMonth.of(nam, thang);
        YearMonth thangTruoc = thangHienTai.minusMonths(1);
        return new KyThanhToan(
                null,
                toaNhaId,
                nam,
                thang,
                ngayChot(thangTruoc, ngayChotSo),
                ngayChot(thangHienTai, ngayChotSo)
        );
    }

    private static LocalDate ngayChot(YearMonth thang, int ngayChotSo) {
        return thang.atDay(Math.min(ngayChotSo, thang.lengthOfMonth()));
    }
}
