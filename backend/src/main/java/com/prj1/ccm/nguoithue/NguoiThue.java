package com.prj1.ccm.nguoithue;

import java.time.LocalDate;

public record NguoiThue(
        Long id,
        String hoTen,
        LocalDate ngaySinh,
        String soDienThoai,
        String soGiayTo,
        String queQuan,
        String trangThaiLuuTru,
        String loaiGiayTo,
        LocalDate ngayCapGiayTo,
        String noiCapGiayTo,
        String diaChiThuongTru,
        String diaChiLienHe,
        String email
) {
    public NguoiThue(
            Long id,
            String hoTen,
            LocalDate ngaySinh,
            String soDienThoai,
            String soGiayTo,
            String queQuan,
            String trangThaiLuuTru
    ) {
        this(id, hoTen, ngaySinh, soDienThoai, soGiayTo, queQuan, trangThaiLuuTru, "CCCD", null, null, null, null, null);
    }
}
