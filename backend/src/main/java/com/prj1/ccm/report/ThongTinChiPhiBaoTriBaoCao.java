package com.prj1.ccm.report;

import java.util.List;

/** FR-RPT-04 is one owner-scoped, timestamped maintenance-cost snapshot for table and chart consumers. */
public record ThongTinChiPhiBaoTriBaoCao(
        Long toaNhaId,
        Long phongId,
        String tuNgay,
        String denNgay,
        String tinhLuc,
        String tongChiPhiChuNha,
        String tongChiPhiNguoiThue,
        int soDong,
        int soDongCoChiPhi,
        int soDongThieuChiPhi,
        List<ThongTinDongChiPhiBaoTriBaoCao> cacDong,
        List<ThongTinNhomChiPhiBaoTriBaoCao> cacNhom,
        List<ThongTinDiemChiPhiBaoTriBaoCao> bieuDo
) {
    public ThongTinChiPhiBaoTriBaoCao {
        cacDong = List.copyOf(cacDong);
        cacNhom = List.copyOf(cacNhom);
        bieuDo = List.copyOf(bieuDo);
    }
}
