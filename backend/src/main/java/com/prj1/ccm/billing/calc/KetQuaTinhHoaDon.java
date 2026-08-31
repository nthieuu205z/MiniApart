package com.prj1.ccm.billing.calc;

import java.util.List;

public record KetQuaTinhHoaDon(
        List<DongChiTiet> cacDong,
        TienTe tongTien,
        List<LyDoBoQua> lyDoBoQua,
        Integer soNguoiOTrongKy,
        Integer soHoQuyDoi
) {
    public KetQuaTinhHoaDon(List<DongChiTiet> cacDong, TienTe tongTien, List<LyDoBoQua> lyDoBoQua) {
        this(cacDong, tongTien, lyDoBoQua, null, null);
    }

    public KetQuaTinhHoaDon {
        cacDong = List.copyOf(cacDong);
        lyDoBoQua = List.copyOf(lyDoBoQua);
    }

    public boolean thanhCong() {
        return lyDoBoQua.isEmpty();
    }
}
