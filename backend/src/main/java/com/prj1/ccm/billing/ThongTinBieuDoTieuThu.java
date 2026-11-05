package com.prj1.ccm.billing;

import java.util.List;

/** FR-POR-05 keeps electricity and water in separate series so their units are never compared on one axis. */
public record ThongTinBieuDoTieuThu(
        List<ThongTinTieuThu> dien,
        List<ThongTinTieuThu> nuoc
) {
    static ThongTinBieuDoTieuThu tu(List<TieuThuDuLieu> duLieu) {
        return new ThongTinBieuDoTieuThu(
                duLieu.stream()
                        .filter(TieuThuDuLieu::laDien)
                        .map(ThongTinTieuThu::tu)
                        .toList(),
                duLieu.stream()
                        .filter(dong -> !dong.laDien())
                        .map(ThongTinTieuThu::tu)
                        .toList()
        );
    }
}
