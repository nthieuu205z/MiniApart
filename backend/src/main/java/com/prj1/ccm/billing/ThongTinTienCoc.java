package com.prj1.ccm.billing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public record ThongTinTienCoc(
        Long hopDongId,
        String tienCocThoaThuan,
        String tongDaThu,
        String conLaiChuaThu,
        List<ThongTinGiaoDichCoc> giaoDich
) {
    static ThongTinTienCoc tao(
            Long hopDongId,
            BigDecimal tienCocThoaThuan,
            BigDecimal tongDaThu,
            List<ThongTinGiaoDichCoc> giaoDich
    ) {
        return new ThongTinTienCoc(
                hopDongId,
                dinhDang(tienCocThoaThuan),
                dinhDang(tongDaThu),
                dinhDang(tienCocThoaThuan.subtract(tongDaThu).max(BigDecimal.ZERO)),
                List.copyOf(giaoDich)
        );
    }

    private static String dinhDang(BigDecimal soTien) {
        return soTien.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
    }
}
