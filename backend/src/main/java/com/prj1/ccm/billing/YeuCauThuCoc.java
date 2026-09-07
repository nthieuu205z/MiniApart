package com.prj1.ccm.billing;

import java.math.BigDecimal;
import java.time.LocalDate;

public record YeuCauThuCoc(
        BigDecimal soTien,
        LocalDate ngay,
        String lyDo
) {
}
