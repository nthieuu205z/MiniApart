package com.prj1.ccm.suachua;

public enum MucDo {
    THUONG("Thường"),
    GAP("Gấp"),
    KHAN_CAP("Khẩn cấp");

    private final String tenHienThi;

    MucDo(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
