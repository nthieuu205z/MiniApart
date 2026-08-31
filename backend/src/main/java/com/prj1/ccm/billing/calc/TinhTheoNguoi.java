package com.prj1.ccm.billing.calc;

import java.math.BigDecimal;

public final class TinhTheoNguoi implements ChienLuocTinhTien {
    public DongChiTiet tinh(DichVu dichVu, Integer soNguoiOTrongKy, TienTe donGia) {
        BigDecimal soLuong = BigDecimal.valueOf(soNguoiOTrongKy == null ? 0 : soNguoiOTrongKy);
        return new DongChiTiet(dichVu.ten(), null, null, soLuong, donGia, donGia.nhan(soLuong), LoaiKhoan.DICH_VU);
    }

    @Override
    public boolean apDungCho(CachTinh cachTinh) {
        return cachTinh == CachTinh.THEO_NGUOI;
    }

    @Override
    public DongChiTiet tinh(DichVu dichVu, BoiCanhTinh boiCanh) {
        BangGiaTaiThoiDiem bangGia = boiCanh.cacBangGia().get(dichVu);
        return bangGia == null ? null : tinh(dichVu, boiCanh.soNguoiOTrongKy(), bangGia.donGia());
    }
}
