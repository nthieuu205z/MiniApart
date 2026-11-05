package com.prj1.ccm.toanha;

import java.math.BigDecimal;

public record ToaNha(
        Long id,
        String maToa,
        String ten,
        String diaChi,
        int soTang,
        int ngayChotSo,
        int soNgayHanTt,
        String maNganHang,
        String tkNganHang,
        BigDecimal nguongThatThoat,
        boolean batBuocAnhCongTo
) {
}
