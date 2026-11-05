package com.prj1.ccm.toanha;

import java.time.LocalDateTime;

public record MauHopDongDto(
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
    public static MauHopDongDto tu(MauHopDong entity) {
        if (entity == null) return null;
        return new MauHopDongDto(
                entity.id(),
                entity.toaNhaId(),
                entity.tenMau(),
                entity.phienBan(),
                entity.trangThai(),
                entity.tieuDe(),
                entity.noiDungDieuKhoan(),
                entity.nguoiTaoId(),
                entity.taoLuc(),
                entity.capNhatLuc()
        );
    }
}

