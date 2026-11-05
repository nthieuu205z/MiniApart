package com.prj1.ccm.toanha;

import java.math.BigDecimal;

public record YeuCauGhiChiSo(
        Long phongId,
        Long dichVuId,
        BigDecimal chiSoCuoi,
        Boolean coThayCongTo,
        BigDecimal chiSoCuoiCongToCu,
        BigDecimal chiSoDauCongToMoi,
        Boolean xacNhanCanhBao
) {
}
