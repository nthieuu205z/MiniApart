package com.prj1.ccm.nguoidung;

public enum VaiTro {
    QTHT("Quản trị hệ thống"),
    CHU("Chủ sở hữu"),
    QUAN_LY("Quản lý toà nhà"),
    THO("Thợ sửa chữa"),
    NGUOI_THUE("Người thuê");

    private final String tenHienThi;

    VaiTro(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
