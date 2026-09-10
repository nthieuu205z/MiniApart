package com.prj1.ccm.report;

import java.util.List;

public record ThongTinTieuThuBaoCao(
        Long toaNhaId,
        Long phongId,
        Long kyId,
        String tinhLuc,
        List<ThongTinDongTieuThuBaoCao> cacDong,
        List<ThongTinDiemTieuThuBaoCao> bieuDo
) {
    public ThongTinTieuThuBaoCao {
        cacDong = List.copyOf(cacDong);
        bieuDo = List.copyOf(bieuDo);
    }
}
