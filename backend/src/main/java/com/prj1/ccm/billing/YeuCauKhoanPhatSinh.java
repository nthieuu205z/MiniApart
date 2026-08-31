package com.prj1.ccm.billing;

import java.math.BigDecimal;

public record YeuCauKhoanPhatSinh(
        NguonKhoanPhatSinh nguonLoai,
        Long nguonId,
        String tenKhoan,
        BigDecimal soTien,
        LoaiKhoanPhatSinh loai
) {
}
