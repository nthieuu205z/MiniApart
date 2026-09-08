package com.prj1.ccm.thongbao;

import java.time.Instant;
import java.util.UUID;

record ThongBao(
        Long id,
        UUID maThamChieu,
        Long nguoiNhanId,
        LoaiDoiTuongThongBao doiTuongLoai,
        Long doiTuongId,
        String tieuDe,
        String noiDung,
        boolean daDoc,
        Instant docLuc,
        Instant taoLuc
) {
}
