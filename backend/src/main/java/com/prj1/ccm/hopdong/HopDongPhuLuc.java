package com.prj1.ccm.hopdong;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record HopDongPhuLuc(
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
) {}

