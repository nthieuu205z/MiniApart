package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record YeuCauNguoiOCung(
        Long nguoiThueId,
        String quanHe,
        LocalDate tuNgay,
        LocalDate denNgay,
        String vaiTro
) {
    public YeuCauNguoiOCung(Long nguoiThueId, String quanHe, LocalDate tuNgay, LocalDate denNgay) {
        this(nguoiThueId, quanHe, tuNgay, denNgay, "NGUOI_O");
    }
}
