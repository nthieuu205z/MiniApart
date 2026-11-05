package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record YeuCauNguoiOCung(
        Long nguoiThueId,
        String quanHe,
        LocalDate tuNgay,
        LocalDate denNgay
) {
}
