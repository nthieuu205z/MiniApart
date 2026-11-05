package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.List;

public record DongChiTiet(
        String tenKhoan,
        BigDecimal chiSoDau,
        BigDecimal chiSoCuoi,
        BigDecimal soLuong,
        TienTe donGia,
        TienTe thanhTien,
        LoaiKhoan loaiKhoan,
        Long dichVuId,
        List<BacTinhTien> cacBac
) {
    public DongChiTiet(
            String tenKhoan,
            BigDecimal chiSoDau,
            BigDecimal chiSoCuoi,
            BigDecimal soLuong,
            TienTe donGia,
            TienTe thanhTien,
            LoaiKhoan loaiKhoan
    ) {
        this(tenKhoan, chiSoDau, chiSoCuoi, soLuong, donGia, thanhTien, loaiKhoan, null, List.of());
    }

    public DongChiTiet {
        cacBac = List.copyOf(cacBac == null ? List.of() : cacBac);
    }
}
