package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;

public final class TinhTheoSoLuong implements ChienLuocTinhTien {
    public DongChiTiet tinh(DichVu dichVu, BigDecimal soLuong, TienTe donGia) {
        return new DongChiTiet(dichVu.ten(), null, null, soLuong, donGia, donGia.nhan(soLuong), LoaiKhoan.DICH_VU);
    }

    @Override
    public boolean apDungCho(CachTinh cachTinh) {
        return cachTinh == CachTinh.THEO_SO_LUONG;
    }

    @Override
    public DongChiTiet tinh(DichVu dichVu, BoiCanhTinh boiCanh) {
        BangGiaTaiThoiDiem bangGia = boiCanh.cacBangGia().get(dichVu);
        BigDecimal soLuong = boiCanh.cacSoLuongDichVu().getOrDefault(dichVu, BigDecimal.ZERO);
        return bangGia == null ? null : tinh(dichVu, soLuong, bangGia.donGia());
    }
}
