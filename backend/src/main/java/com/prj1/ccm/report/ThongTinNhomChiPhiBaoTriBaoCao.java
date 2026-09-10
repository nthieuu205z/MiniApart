package com.prj1.ccm.report;

import java.util.List;

/** FR-RPT-04 groups repair rows by building, category, calendar month, and room for reconciliation. */
public record ThongTinNhomChiPhiBaoTriBaoCao(
        Long toaNhaId,
        String maToa,
        String tenToaNha,
        Long phongId,
        String soPhong,
        String hangMuc,
        String thang,
        String nhan,
        String chiPhiChuNha,
        String chiPhiNguoiThue,
        int soDong,
        int soDongCoChiPhi,
        int soDongThieuChiPhi,
        List<Long> yeuCauIds
) {
    public ThongTinNhomChiPhiBaoTriBaoCao {
        yeuCauIds = List.copyOf(yeuCauIds);
    }
}
