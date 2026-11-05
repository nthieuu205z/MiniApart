package com.prj1.ccm.toanha;

import java.time.LocalDateTime;

public record MauHopDong(
        Long id,
        Long toaNhaId,
        String tenMau,
        int phienBan,
        String trangThai,
        String tieuDe,
        String noiDungDieuKhoan,
        Long nguoiTaoId,
        LocalDateTime taoLuc,
        LocalDateTime capNhatLuc
) {
}

