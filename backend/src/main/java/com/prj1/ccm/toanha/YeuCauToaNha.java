package com.prj1.ccm.toanha;

import java.math.BigDecimal;

public record YeuCauToaNha(
        String maToa,
        String ten,
        String diaChi,
        Integer soTang,
        Integer ngayChotSo,
        Integer soNgayHanTt,
        String tkNganHang,
        BigDecimal nguongThatThoat,
        Boolean batBuocAnhCongTo
) {
}
