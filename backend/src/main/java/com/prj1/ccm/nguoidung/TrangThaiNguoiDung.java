package com.prj1.ccm.nguoidung;

public enum TrangThaiNguoiDung {
    HOAT_DONG("Hoạt động"),
    BI_KHOA("Bị khoá");

    private final String tenHienThi;

    TrangThaiNguoiDung(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
