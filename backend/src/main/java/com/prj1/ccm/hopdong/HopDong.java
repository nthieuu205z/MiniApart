package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record HopDong(
        Long id,
        Long phongId,
        Long nguoiThueId,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        BigDecimal giaThue,
        BigDecimal tienCoc,
        int soNgayBaoTruoc,
        TrangThaiHopDong trangThai
) {
    public boolean sapHetHan(LocalDate tai) {
        long soNgayConLai = soNgayConLai(tai);
        return trangThai == TrangThaiHopDong.HIEU_LUC && soNgayConLai >= 0 && soNgayConLai < 30;
    }

    public long soNgayConLai(LocalDate tai) {
        return ChronoUnit.DAYS.between(tai, ngayKetThuc);
    }
}
