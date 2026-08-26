package com.prj1.ccm.nguoidung;

import java.util.List;

public record ThongTinQuanLyNguoiDung(
        Long id,
        String hoTen,
        String soDienThoai,
        String vaiTro,
        String tenVaiTro,
        String trangThai,
        List<Long> toaNhaIds
) {
    public static ThongTinQuanLyNguoiDung tuNguoiDung(NguoiDung nguoiDung, List<Long> toaNhaIds) {
        return new ThongTinQuanLyNguoiDung(
                nguoiDung.id(),
                nguoiDung.hoTen(),
                nguoiDung.soDienThoai(),
                nguoiDung.vaiTro().name(),
                nguoiDung.vaiTro().tenHienThi(),
                nguoiDung.trangThai().name(),
                toaNhaIds
        );
    }
}
