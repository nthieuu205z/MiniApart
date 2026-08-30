package com.prj1.ccm.toanha;

import java.time.LocalDate;

public record ThongTinKyThanhToan(
        Long id,
        int nam,
        int thang,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        String trangThai
) {
    public static ThongTinKyThanhToan tuKyThanhToan(KyThanhToan kyThanhToan) {
        return new ThongTinKyThanhToan(
                kyThanhToan.id(),
                kyThanhToan.nam(),
                kyThanhToan.thang(),
                kyThanhToan.ngayBatDau(),
                kyThanhToan.ngayKetThuc(),
                kyThanhToan.trangThai().name()
        );
    }
}
