package com.prj1.ccm.nguoithue;

import java.time.LocalDate;

public record YeuCauNguoiThue(
        String hoTen,
        LocalDate ngaySinh,
        String soDienThoai,
        String soGiayTo,
        String queQuan,
        String loaiGiayTo,
        LocalDate ngayCapGiayTo,
        String noiCapGiayTo,
        String diaChiThuongTru,
        String diaChiLienHe,
        String email
) {
    public YeuCauNguoiThue(String hoTen, LocalDate ngaySinh, String soDienThoai, String soGiayTo, String queQuan) {
        this(hoTen, ngaySinh, soDienThoai, soGiayTo, queQuan, "CCCD", null, null, null, null, null);
    }
}
