package com.prj1.ccm.report;

/** FR-RPT-02/FR-RPT-08 is the monthly chart point from the same repair snapshot as the detail table. */
public record ThongTinDiemChiPhiBaoTriBaoCao(
        String thang,
        String nhan,
        String chiPhiChuNha,
        String chiPhiNguoiThue,
        int soDong,
        int soDongCoChiPhi,
        int soDongThieuChiPhi,
        int soDongThieuBenChiuChiPhi
) {
}
