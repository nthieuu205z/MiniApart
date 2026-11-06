package com.prj1.ccm.suachua;

import java.math.BigDecimal;
import java.time.Instant;

public record ThanhToanTho(
        Long id,
        String maThanhToan,
        Long yeuCauId,
        Long baoGiaId,
        BigDecimal soTien,
        PhuongThucThanhToanTho phuongThuc,
        String maThamChieu,
        Long nguoiXacNhanId,
        Instant xacNhanLuc,
        String ghiChu,
        String fixtureKey
) {
}
