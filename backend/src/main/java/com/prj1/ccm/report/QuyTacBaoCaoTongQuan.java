package com.prj1.ccm.report;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** FR-RPT-01 centralises the arithmetic used by the financial and operational overview. */
public final class QuyTacBaoCaoTongQuan {
    private static final BigDecimal KHONG = BigDecimal.ZERO.setScale(2);
    private static final BigDecimal MOT_TRAM = new BigDecimal("100.00");

    /** BR-08 sums the ledger algebraically and clamps the result to the invoice total. */
    public BigDecimal gioiHanDaThu(BigDecimal tongTien, BigDecimal tongDaiSo) {
        BigDecimal tongTienChuanHoa = chuanHoaKhongAm(tongTien);
        BigDecimal tongDaiSoChuanHoa = tongDaiSo == null ? KHONG : tongDaiSo.setScale(2, RoundingMode.UNNECESSARY);
        return tongDaiSoChuanHoa.max(KHONG).min(tongTienChuanHoa).setScale(2, RoundingMode.UNNECESSARY);
    }

    /** BR-08 keeps debt non-negative after the ledger cap has been applied. */
    public BigDecimal congNo(BigDecimal tongTien, BigDecimal daThuGioiHan) {
        BigDecimal tongTienChuanHoa = chuanHoaKhongAm(tongTien);
        BigDecimal daThu = daThuGioiHan == null ? KHONG : daThuGioiHan;
        return tongTienChuanHoa.subtract(daThu).max(KHONG).setScale(2, RoundingMode.UNNECESSARY);
    }

    /** FR-RPT-01 presents occupancy as a percentage with two decimal places. */
    public BigDecimal tyLeLapDay(int soPhongDangThue, int tongSoPhong) {
        if (tongSoPhong <= 0) {
            return KHONG;
        }
        return BigDecimal.valueOf(soPhongDangThue)
                .multiply(MOT_TRAM)
                .divide(BigDecimal.valueOf(tongSoPhong), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal chuanHoaKhongAm(BigDecimal giaTri) {
        if (giaTri == null || giaTri.signum() < 0) {
            return KHONG;
        }
        return giaTri.setScale(2, RoundingMode.UNNECESSARY);
    }
}
