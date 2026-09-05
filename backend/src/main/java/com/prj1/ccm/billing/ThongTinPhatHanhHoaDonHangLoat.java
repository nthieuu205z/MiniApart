package com.prj1.ccm.billing;

import java.util.List;

public record ThongTinPhatHanhHoaDonHangLoat(
        Long kyId,
        int soHoaDonDaPhatHanh,
        int soHoaDonDaOTrangThaiKhac,
        int soHoaDonBoQua,
        List<ThongTinLyDoBoQua> lyDoBoQua
) {
    public ThongTinPhatHanhHoaDonHangLoat {
        lyDoBoQua = List.copyOf(lyDoBoQua);
    }
}
