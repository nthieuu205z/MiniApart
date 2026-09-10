package com.prj1.ccm.thongbao;

import java.time.Instant;
import java.util.List;

public record YeuCauThongBaoChung(
        Long toaNhaId,
        String phamVi,
        Integer tang,
        List<Long> phongIds,
        String tieuDe,
        String noiDung,
        Instant hetHanLuc
) {
    public YeuCauThongBaoChung {
        phongIds = phongIds == null ? List.of() : List.copyOf(phongIds);
    }
}
