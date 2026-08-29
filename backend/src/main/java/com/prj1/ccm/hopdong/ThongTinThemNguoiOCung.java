package com.prj1.ccm.hopdong;

import java.time.LocalDate;

public record ThongTinThemNguoiOCung(
        Long id,
        Long hopDongId,
        Long nguoiThueId,
        String hoTenNguoiThue,
        String quanHe,
        LocalDate tuNgay,
        LocalDate denNgay,
        boolean canhBaoQuaSucChua,
        Integer soNguoiHienTai,
        Integer sucChua,
        String thongBaoCanhBao
) {
    static ThongTinThemNguoiOCung tu(NguoiOCung nguoiOCung, int soNguoiHienTai, int sucChua, String thongBaoCanhBao) {
        return new ThongTinThemNguoiOCung(
                nguoiOCung.id(),
                nguoiOCung.hopDongId(),
                nguoiOCung.nguoiThueId(),
                nguoiOCung.hoTenNguoiThue(),
                nguoiOCung.quanHe(),
                nguoiOCung.tuNgay(),
                nguoiOCung.denNgay(),
                thongBaoCanhBao != null,
                soNguoiHienTai,
                sucChua,
                thongBaoCanhBao
        );
    }
}
