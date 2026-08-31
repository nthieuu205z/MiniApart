package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;

import java.math.BigDecimal;
import java.util.List;

public record ThongTinHoaDonChiTiet(
        Long hoaDonId,
        String maHoaDon,
        Long kyId,
        Long hopDongId,
        String soPhong,
        String nguoiThue,
        String ngayPhatHanh,
        String hanThanhToan,
        String trangThai,
        String tongTien,
        String daThu,
        String conLai,
        Integer soNguoiO,
        Integer soHoQuyDoi,
        String giaiThichSoHo,
        List<ThongTinDongHoaDon> cacDong
) {
    static ThongTinHoaDonChiTiet tu(
            HoaDonDuLieu hoaDon,
            TrangThaiHoaDon trangThai,
            List<ThongTinDongHoaDon> cacDong
    ) {
        BigDecimal conLai = hoaDon.tongTien().subtract(hoaDon.daThu());
        return new ThongTinHoaDonChiTiet(
                hoaDon.id(),
                hoaDon.maHoaDon(),
                hoaDon.kyId(),
                hoaDon.hopDongId(),
                hoaDon.soPhong(),
                hoaDon.hoTen(),
                hoaDon.ngayPhatHanh().toString(),
                hoaDon.hanThanhToan().toString(),
                trangThai.name(),
                hoaDon.tongTien().toPlainString(),
                hoaDon.daThu().toPlainString(),
                conLai.toPlainString(),
                hoaDon.soNguoiO(),
                hoaDon.soHoQuyDoi(),
                hoaDon.giaiThichSoHo(),
                List.copyOf(cacDong)
        );
    }
}
