package com.prj1.ccm.billing;

import java.time.LocalDate;

/** FR-NTF-01 is the compact invoice worklist representation used by manager screens. */
public record ThongTinHoaDonDanhSach(
        Long hoaDonId,
        Long kyId,
        String maHoaDon,
        String soPhong,
        String nguoiThue,
        LocalDate ngayPhatHanh,
        LocalDate hanThanhToan,
        String trangThai,
        String tongTien,
        String daThu,
        String conLai,
        Long toaNhaId
) {
    /** FR-NTF-01 maps the exact decimal snapshot without converting money through binary floating point. */
    static ThongTinHoaDonDanhSach tu(HoaDonVanHanhDuLieu duLieu) {
        return new ThongTinHoaDonDanhSach(
                duLieu.hoaDonId(),
                duLieu.kyId(),
                duLieu.maHoaDon(),
                duLieu.soPhong(),
                duLieu.nguoiThue(),
                duLieu.ngayPhatHanh(),
                duLieu.hanThanhToan(),
                duLieu.trangThai().name(),
                duLieu.tongTien().toPlainString(),
                duLieu.daThu().toPlainString(),
                duLieu.conLai().toPlainString(),
                duLieu.toaNhaId()
        );
    }
}
