package com.prj1.ccm.report;

import java.util.List;

public record ThongTinTongQuanBaoCao(
        Long toaNhaId,
        String tenToaNha,
        String tuNgay,
        String denNgay,
        String tinhLuc,
        boolean coDuLieuTaiChinh,
        ThongTinKpiTongQuan kpi,
        List<ThongTinBaoCaoTheoThang> theoThang
) {
    public ThongTinTongQuanBaoCao {
        theoThang = List.copyOf(theoThang);
    }
}
