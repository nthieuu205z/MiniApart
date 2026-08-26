package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;

import java.time.Instant;

public record NguoiDungDangNhap(
        Long id,
        String hoTen,
        String soDienThoai,
        String matKhauHash,
        VaiTro vaiTro,
        TrangThaiNguoiDung trangThai,
        int phienBanToken,
        int soLanSai,
        Instant lanSaiDauTien,
        Instant khoaDen
) {
    public boolean hoatDong() {
        return trangThai == TrangThaiNguoiDung.HOAT_DONG;
    }
}
