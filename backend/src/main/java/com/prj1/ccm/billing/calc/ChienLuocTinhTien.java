package com.prj1.ccm.billing.calc;

public interface ChienLuocTinhTien {
    boolean apDungCho(CachTinh cachTinh);

    DongChiTiet tinh(DichVu dichVu, BoiCanhTinh boiCanh);
}
