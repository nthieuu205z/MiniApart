package com.prj1.ccm.nguoithue;

import java.time.LocalDate;

public record NguoiThue(
        Long id,
        String hoTen,
        LocalDate ngaySinh,
        String soDienThoai,
        String soGiayTo,
        String queQuan,
        String trangThaiLuuTru
) {
}
