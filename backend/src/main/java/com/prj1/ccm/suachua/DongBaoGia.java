package com.prj1.ccm.suachua;

import java.math.BigDecimal;

public record DongBaoGia(
        Long id,
        Long baoGiaId,
        int thuTu,
        String tenHangMuc,
        BigDecimal soLuong,
        String donVi,
        BigDecimal donGia,
        BigDecimal thanhTien
) {
}
