package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record ThongTinGiaHanHopDong(
        ThongTinHopDong hopDong,
        String tienCocCanThu,
        boolean canhBaoThongBaoGiaThue
) {
    static ThongTinGiaHanHopDong tao(
            ThongTinHopDong hopDong,
            BigDecimal tienCocCanThu,
            boolean canhBaoThongBaoGiaThue
    ) {
        return new ThongTinGiaHanHopDong(
                hopDong,
                tienCocCanThu.setScale(2, RoundingMode.UNNECESSARY).toPlainString(),
                canhBaoThongBaoGiaThue
        );
    }
}
