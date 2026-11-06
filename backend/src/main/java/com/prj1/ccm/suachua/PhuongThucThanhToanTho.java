package com.prj1.ccm.suachua;

public enum PhuongThucThanhToanTho {
    TIEN_MAT("Tiền mặt"),
    CHUYEN_KHOAN("Chuyển khoản"),
    KHONG_THU_PHI("Không phát sinh tiền / Bảo hành");

    private final String tenHienThi;

    PhuongThucThanhToanTho(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String getTenHienThi() {
        return tenHienThi;
    }
}
