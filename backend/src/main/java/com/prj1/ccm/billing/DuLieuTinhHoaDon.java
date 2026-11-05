package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.BoiCanhTinh;
import com.prj1.ccm.billing.calc.LyDoBoQua;

import java.util.List;

record DuLieuTinhHoaDon(
        BoiCanhTinh boiCanh,
        List<LyDoBoQua> lyDoKhongTheTinh
) {
    DuLieuTinhHoaDon {
        lyDoKhongTheTinh = List.copyOf(lyDoKhongTheTinh);
    }

    boolean coTheTinh() {
        return lyDoKhongTheTinh.isEmpty();
    }
}
