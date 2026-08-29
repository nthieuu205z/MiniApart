package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record NguoiOCung(
        Long id,
        Long hopDongId,
        Long nguoiThueId,
        String hoTenNguoiThue,
        String quanHe,
        LocalDate tuNgay,
        LocalDate denNgay
) {
}
