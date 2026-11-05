package com.prj1.ccm.toanha;

public enum TrangThaiPhong {
    TRONG("Trống"),
    DANG_THUE("Đang thuê"),
    DA_COC("Đã đặt cọc"),
    DANG_SUA("Đang sửa"),
    NGUNG("Ngừng");

    private final String tenHienThi;

    TrangThaiPhong(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
