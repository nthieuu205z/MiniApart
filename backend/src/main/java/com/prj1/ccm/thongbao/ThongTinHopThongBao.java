package com.prj1.ccm.thongbao;

import java.util.List;

public record ThongTinHopThongBao(
        List<ThongTinThongBao> thongBao,
        int soChuaDoc
) {
    public ThongTinHopThongBao {
        thongBao = List.copyOf(thongBao);
    }
}
