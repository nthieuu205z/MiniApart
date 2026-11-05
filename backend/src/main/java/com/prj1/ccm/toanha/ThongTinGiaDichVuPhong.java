package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ThongTinGiaDichVuPhong(
        Long dichVuId,
        String tenDichVu,
        String donVi,
        CachTinh cachTinh,
        CheDoGia cheDoGia,
        BigDecimal donGia,
        String nguonGia, // "GHI_DE", "KE_THUA", "THIEU_BANG_GIA"
        LocalDate ngayHieuLuc,
        Long bangGiaPhongId
) {
}
