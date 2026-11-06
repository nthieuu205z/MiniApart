package com.prj1.ccm.suachua;

public enum TrangThaiBaoGia {
    NHAP("Bản nháp"),
    CHO_DUYET("Chờ duyệt"),
    DA_DUYET("Đã duyệt"),
    TU_CHOI("Từ chối"),
    BI_THAY_THE("Bị thay thế");

    private final String tenHienThi;

    TrangThaiBaoGia(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
