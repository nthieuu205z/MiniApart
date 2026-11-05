package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;

import java.math.BigDecimal;
import java.time.LocalDate;

/** FR-NTF-01 is the scoped invoice snapshot shared by the operational dashboard and its worklist. */
public record HoaDonVanHanhDuLieu(
        Long hoaDonId,
        Long kyId,
        String maHoaDon,
        Long toaNhaId,
        String soPhong,
        String nguoiThue,
        LocalDate ngayPhatHanh,
        LocalDate hanThanhToan,
        TrangThaiHoaDon trangThai,
        BigDecimal tongTien,
        BigDecimal daThu
) {
    /** FR-NTF-01 never exposes a negative outstanding balance when an account is overpaid. */
    public BigDecimal conLai() {
        return tongTien.subtract(daThu).max(BigDecimal.ZERO);
    }
}
