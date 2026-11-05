package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record YeuCauBangGiaBacThang(
        BigDecimal giaBanLeBinhQuan,
        LocalDate ngayHieuLuc,
        List<YeuCauBacGia> cacBac
) {
}
