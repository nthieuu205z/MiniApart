package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record ThongTinNguoiOCung(
        Long id,
        Long hopDongId,
        Long nguoiThueId,
        String hoTenNguoiThue,
        String quanHe,
        LocalDate tuNgay,
        LocalDate denNgay
) {
    static ThongTinNguoiOCung tu(NguoiOCung nguoiOCung) {
        return new ThongTinNguoiOCung(
                nguoiOCung.id(),
                nguoiOCung.hopDongId(),
                nguoiOCung.nguoiThueId(),
                nguoiOCung.hoTenNguoiThue(),
                nguoiOCung.quanHe(),
                nguoiOCung.tuNgay(),
                nguoiOCung.denNgay()
        );
    }
}
