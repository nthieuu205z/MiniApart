package com.prj1.ccm.toanha;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BangGiaPhong(
        Long id,
        Long phongId,
        Long dichVuId,
        BigDecimal donGia,
        LocalDate ngayHieuLuc,
        Long nguoiTaoId,
        LocalDateTime taoLuc
) {
    public BangGiaPhong(Long phongId, Long dichVuId, BigDecimal donGia, LocalDate ngayHieuLuc, Long nguoiTaoId) {
        this(null, phongId, dichVuId, donGia, ngayHieuLuc, nguoiTaoId, null);
    }
}

