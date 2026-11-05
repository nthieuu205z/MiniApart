package com.prj1.ccm.thongbao;

import java.time.Instant;
import java.util.List;

public record ThongTinThongBao(
        String maThamChieu,
        String tieuDe,
        String noiDung,
        boolean daDoc,
        Instant docLuc,
        Instant taoLuc,
        Instant hetHanLuc,
        boolean daLuuTru,
        List<ThongTinAnhThongBao> anh
) {
    public ThongTinThongBao {
        anh = anh == null ? List.of() : List.copyOf(anh);
    }

    static ThongTinThongBao tu(ThongBao thongBao, Instant hienTai) {
        return new ThongTinThongBao(
                thongBao.maThamChieu().toString(),
                thongBao.tieuDe(),
                thongBao.noiDung(),
                thongBao.daDoc(),
                thongBao.docLuc(),
                thongBao.taoLuc(),
                thongBao.hetHanLuc(),
                thongBao.hetHanLuc() != null && !thongBao.hetHanLuc().isAfter(hienTai),
                thongBao.anhIds().stream().map(ThongTinAnhThongBao::new).toList()
        );
    }
}
