package com.prj1.ccm.billing;
import java.math.BigDecimal;

public record ThongTinQuyetToan(
        Long hoaDonCuoiId,
        String tongHoaDonCuoi,
        String daThuCoc,
        String congNo,
        String khauTru,
        String hoanCoc,
        Long hoaDonQuyetToanId
) {
    public static ThongTinQuyetToan tao(
            Long hoaDonCuoiId,
            BigDecimal tongHoaDonCuoi,
            BigDecimal daThuCoc,
            BigDecimal congNo,
            BigDecimal khauTru,
            BigDecimal hoanCoc,
            Long hoaDonQuyetToanId
    ) {
        return new ThongTinQuyetToan(
                hoaDonCuoiId,
                tongHoaDonCuoi.toPlainString(),
                daThuCoc.toPlainString(),
                congNo.toPlainString(),
                khauTru.toPlainString(),
                hoanCoc.toPlainString(),
                hoaDonQuyetToanId
        );
    }
}
