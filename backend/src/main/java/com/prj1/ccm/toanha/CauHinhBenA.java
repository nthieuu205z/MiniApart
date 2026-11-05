package com.prj1.ccm.toanha;

import java.time.LocalDateTime;

public record CauHinhBenA(
        Long id,
        Long toaNhaId,
        String loaiChuThe,
        String tenChuThe,
        String maSoDinhDanh,
        String diaChiLienHe,
        String soDienThoai,
        String email,
        String hoTenNguoiKy,
        String chucVuNguoiKy,
        String tuCachKy,
        String canCuUyQuyen,
        String thongTinDonViQuanLy,
        String soTaiKhoan,
        String tenNganHang,
        String chuTaiKhoan,
        LocalDateTime capNhatLuc
) {
}

