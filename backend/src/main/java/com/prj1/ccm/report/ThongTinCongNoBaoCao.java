package com.prj1.ccm.report;

import java.util.List;

/** FR-RPT-02/FR-RPT-03 is one server-sorted debt snapshot with its calculation timestamp. */
public record ThongTinCongNoBaoCao(
        Long toaNhaId,
        String tinhLuc,
        List<ThongTinKhoanNoBaoCao> congNo
) {
    public ThongTinCongNoBaoCao {
        congNo = List.copyOf(congNo);
    }
}
