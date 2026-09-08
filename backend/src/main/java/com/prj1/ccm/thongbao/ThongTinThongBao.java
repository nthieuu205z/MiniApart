package com.prj1.ccm.thongbao;

import java.time.Instant;

public record ThongTinThongBao(
        String maThamChieu,
        String tieuDe,
        String noiDung,
        boolean daDoc,
        Instant docLuc,
        Instant taoLuc
) {
    static ThongTinThongBao tu(ThongBao thongBao) {
        return new ThongTinThongBao(
                thongBao.maThamChieu().toString(),
                thongBao.tieuDe(),
                thongBao.noiDung(),
                thongBao.daDoc(),
                thongBao.docLuc(),
                thongBao.taoLuc()
        );
    }
}
