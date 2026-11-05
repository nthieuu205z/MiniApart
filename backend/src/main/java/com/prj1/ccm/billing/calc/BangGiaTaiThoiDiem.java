package com.prj1.ccm.billing.calc;

import java.time.LocalDate;
import java.util.List;

public record BangGiaTaiThoiDiem(
        LocalDate ngayHieuLuc,
        TienTe donGia,
        List<Bac> cacBac
) {
    public BangGiaTaiThoiDiem {
        cacBac = List.copyOf(cacBac);
    }
}
