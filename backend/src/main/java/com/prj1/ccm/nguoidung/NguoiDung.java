package com.prj1.ccm.nguoidung;

public record NguoiDung(
        Long id,
        String hoTen,
        String soDienThoai,
        String matKhauHash,
        VaiTro vaiTro,
        TrangThaiNguoiDung trangThai,
        int phienBanToken,
        Long nguoiThueId
) {
    public boolean hoatDong() {
        return trangThai == TrangThaiNguoiDung.HOAT_DONG;
    }
}
