package com.prj1.ccm.suachua;

public enum BenChiuChiPhi {
    CHU_NHA("Chủ nhà"),
    NGUOI_THUE("Người thuê");

    private final String tenHienThi;

    BenChiuChiPhi(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
