package com.prj1.ccm.billing.calc;

public final class TinhCoDinh implements ChienLuocTinhTien {
    public DongChiTiet tinh(DichVu dichVu, TienTe donGia) {
        return new DongChiTiet(dichVu.ten(), null, null, java.math.BigDecimal.ONE, donGia, donGia, LoaiKhoan.DICH_VU);
    }

    @Override
    public boolean apDungCho(CachTinh cachTinh) {
        return cachTinh == CachTinh.CO_DINH;
    }

    @Override
    public DongChiTiet tinh(DichVu dichVu, BoiCanhTinh boiCanh) {
        BangGiaTaiThoiDiem bangGia = boiCanh.cacBangGia().get(dichVu);
        return bangGia == null ? null : tinh(dichVu, bangGia.donGia());
    }
}
