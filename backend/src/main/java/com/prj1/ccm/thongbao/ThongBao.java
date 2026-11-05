package com.prj1.ccm.thongbao;

import java.time.Instant;
import java.util.List;
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
        Instant taoLuc,
        Instant hetHanLuc,
        List<Long> anhIds
) {
    ThongBao {
        anhIds = anhIds == null ? List.of() : List.copyOf(anhIds);
    }

    ThongBao(
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
        this(id, maThamChieu, nguoiNhanId, doiTuongLoai, doiTuongId, tieuDe, noiDung,
                daDoc, docLuc, taoLuc, null, List.of());
    }
}
