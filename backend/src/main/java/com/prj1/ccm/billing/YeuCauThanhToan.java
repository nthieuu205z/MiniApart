package com.prj1.ccm.billing;

import java.math.BigDecimal;
import java.time.LocalDate;

public record YeuCauThanhToan(
        BigDecimal soTien,
        HinhThucThanhToan hinhThuc,
        LocalDate ngayThu,
        Boolean xacNhanThuThem
) {
}
