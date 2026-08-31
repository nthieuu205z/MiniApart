package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.LyDoBoQua;

import java.util.List;

public record ThongTinTaoHoaDonHangLoat(
        Long kyId,
        int soHoaDonTaoMoi,
        int soHoaDonDaTonTai,
        int soPhongBoQua,
        List<ThongTinLyDoBoQua> lyDoBoQua
) {
    static ThongTinTaoHoaDonHangLoat tu(
            Long kyId,
            int soHoaDonTaoMoi,
            int soHoaDonDaTonTai,
            int soPhongBoQua,
            List<LyDoBoQua> lyDoBoQua
    ) {
        return new ThongTinTaoHoaDonHangLoat(
                kyId,
                soHoaDonTaoMoi,
                soHoaDonDaTonTai,
                soPhongBoQua,
                lyDoBoQua.stream().map(ThongTinLyDoBoQua::tu).toList()
        );
    }
}
