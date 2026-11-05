package com.prj1.ccm.billing;

import java.math.BigDecimal;

public record YeuCauNoiDungHoaDon(
        String tenKhoan,
        BigDecimal soTien,
        LoaiKhoanPhatSinh loai,
        String lyDo
) {
}
