package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;

public record ThongTinNguoiDung(
        Long id,
        String hoTen,
        String soDienThoai,
        String vaiTro,
        String tenVaiTro
) {
    public static ThongTinNguoiDung tuNguoiDung(NguoiDung nguoiDung) {
        return new ThongTinNguoiDung(
                nguoiDung.id(),
                nguoiDung.hoTen(),
                nguoiDung.soDienThoai(),
                nguoiDung.vaiTro().name(),
                nguoiDung.vaiTro().tenHienThi()
        );
    }
}
