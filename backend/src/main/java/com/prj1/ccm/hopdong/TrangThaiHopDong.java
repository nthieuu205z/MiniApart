package com.prj1.ccm.hopdong;

public enum TrangThaiHopDong {
    CHO_KY("Chờ ký"),
    DA_COC("Đã cọc"),
    HIEU_LUC("Hiệu lực"),
    DA_THANH_LY("Đã thanh lý");

    private final String tenHienThi;

    TrangThaiHopDong(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
