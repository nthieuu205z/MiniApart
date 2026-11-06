package com.prj1.ccm.suachua;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record BaoGiaSuaChua(
        Long id,
        String maBaoGia,
        Long yeuCauId,
        int phienBan,
        TrangThaiBaoGia trangThai,
        BigDecimal tongTien,
        String moTa,
        String ghiChu,
        String lyDoTuChoi,
        Long nguoiTaoId,
        Instant taoLuc,
        Long nguoiDuyetId,
        Instant duyetLuc,
        String fixtureKey,
        List<DongBaoGia> dongBaoGia
) {
}
