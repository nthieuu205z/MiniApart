package com.prj1.ccm.nguoidung;

public record ThongTinVaiTro(
        String vaiTro,
        String tenVaiTro
) {
    public static ThongTinVaiTro tuVaiTro(VaiTro vaiTro) {
        return new ThongTinVaiTro(vaiTro.name(), vaiTro.tenHienThi());
    }
}
