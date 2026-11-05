package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;
import java.util.Objects;

public final class GiaCoDinh implements ChienLuocGia {
    private final TienTe donGia;

    public GiaCoDinh(TienTe donGia) {
        this.donGia = Objects.requireNonNull(donGia, "donGia must not be null");
    }

    public TienTe thanhTien(BigDecimal soLuong) {
        return donGia.nhan(Objects.requireNonNull(soLuong, "soLuong must not be null"));
    }

    @Override
    public TienTe thanhTien(BigDecimal soLuong, Integer soNguoiOTrongKy) {
        return thanhTien(soLuong);
    }

    public TienTe donGia() {
        return donGia;
    }
}
