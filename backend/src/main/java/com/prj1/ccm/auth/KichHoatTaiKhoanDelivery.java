package com.prj1.ccm.auth;

public interface KichHoatTaiKhoanDelivery {
    void guiMaKichHoat(String soDienThoai, String maKichHoat);

    default void guiMaDatLaiMatKhau(String soDienThoai, String maXacThuc) {
        guiMaKichHoat(soDienThoai, maXacThuc);
    }
}
