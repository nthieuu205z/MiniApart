package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.time.LocalDate;

public record YeuCauGiaHanHopDong(
        LocalDate ngayKetThuc,
        BigDecimal giaThue
) {
}
