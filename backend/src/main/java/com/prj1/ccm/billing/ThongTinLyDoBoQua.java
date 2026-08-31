package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.LyDoBoQua;

public record ThongTinLyDoBoQua(
        Long phongId,
        String ma,
        String moTa
) {
    static ThongTinLyDoBoQua tu(LyDoBoQua lyDo) {
        return new ThongTinLyDoBoQua(lyDo.phongId(), lyDo.ma().name(), lyDo.moTa());
    }
}
