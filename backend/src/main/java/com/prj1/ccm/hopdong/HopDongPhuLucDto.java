package com.prj1.ccm.hopdong;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record HopDongPhuLucDto(
        Long id,
        Long hopDongId,
        int soPhuLuc,
        String tieuDe,
        LocalDate ngayLap,
        LocalDate ngayHieuLuc,
        String noiDungThayDoi,
        String trangThai,
        Long nguoiTaoId,
        LocalDateTime taoLuc
) {
    public static HopDongPhuLucDto tu(HopDongPhuLuc pl) {
        return new HopDongPhuLucDto(
                pl.id(),
                pl.hopDongId(),
                pl.soPhuLuc(),
                pl.tieuDe(),
                pl.ngayLap(),
                pl.ngayHieuLuc(),
                pl.noiDungThayDoi(),
                pl.trangThai(),
                pl.nguoiTaoId(),
                pl.taoLuc()
        );
    }
}

