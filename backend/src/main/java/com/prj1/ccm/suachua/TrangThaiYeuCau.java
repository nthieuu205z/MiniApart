package com.prj1.ccm.suachua;

public enum TrangThaiYeuCau {
    MOI_TIEP_NHAN("Mới tiếp nhận"),
    DA_TIEP_NHAN("Đã tiếp nhận"),
    DA_PHAN_CONG("Đã phân công"),
    DANG_XU_LY("Đang xử lý"),
    CHO_XAC_NHAN("Chờ xác nhận"),
    DA_DONG("Đã đóng"),
    DA_HUY("Đã huỷ");

    private final String tenHienThi;

    TrangThaiYeuCau(String tenHienThi) {
        this.tenHienThi = tenHienThi;
    }

    public String tenHienThi() {
        return tenHienThi;
    }
}
