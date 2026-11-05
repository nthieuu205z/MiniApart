package com.prj1.ccm.toanha;

import java.time.LocalDate;
import java.util.List;

public record ThongTinBangGiaBacThang(
        LocalDate ngayHieuLuc,
        boolean dangApDung,
        List<ThongTinBacGia> cacBac
) {
    public static ThongTinBangGiaBacThang tuDanhSachBangGia(LocalDate ngayHieuLuc, boolean dangApDung, List<BangGiaBacThang> cacBac) {
        return new ThongTinBangGiaBacThang(
                ngayHieuLuc,
                dangApDung,
                cacBac.stream().map(ThongTinBacGia::tuBangGiaBacThang).toList()
        );
    }
}
