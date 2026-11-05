package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.KetQuaTinhHoaDon;
import com.prj1.ccm.billing.calc.LyDoBoQua;

import java.util.List;

public record ThongTinTinhHoaDon(
        Long kyId,
        Long hopDongId,
        String tongTien,
        boolean thanhCong,
        List<ThongTinDongHoaDon> cacDong,
        List<ThongTinLyDoBoQua> lyDoBoQua,
        Integer soNguoiO,
        Integer soHoQuyDoi,
        String giaiThichSoHo
) {
    static ThongTinTinhHoaDon tu(Long kyId, Long hopDongId, KetQuaTinhHoaDon ketQua) {
        return new ThongTinTinhHoaDon(
                kyId,
                hopDongId,
                ketQua.tongTien().giaTri().toPlainString(),
                ketQua.thanhCong(),
                ketQua.cacDong().stream().map(ThongTinDongHoaDon::tu).toList(),
                ketQua.lyDoBoQua().stream().map(ThongTinLyDoBoQua::tu).toList(),
                ketQua.soNguoiOTrongKy(),
                ketQua.soHoQuyDoi(),
                ketQua.soHoQuyDoi() == null ? null : "1 ho quy doi cho moi 4 nguoi o"
        );
    }

    static ThongTinTinhHoaDon khongTheTinh(Long kyId, Long hopDongId, List<LyDoBoQua> lyDoKhongTheTinh) {
        return new ThongTinTinhHoaDon(
                kyId,
                hopDongId,
                null,
                false,
                List.of(),
                lyDoKhongTheTinh.stream().map(ThongTinLyDoBoQua::tu).toList(),
                null,
                null,
                null
        );
    }
}
