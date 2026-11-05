package com.prj1.ccm.toanha;

import java.time.LocalDateTime;

public record CauHinhBenADto(
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
    public static CauHinhBenADto tu(CauHinhBenA entity) {
        if (entity == null) return null;
        return new CauHinhBenADto(
                entity.id(),
                entity.toaNhaId(),
                entity.loaiChuThe(),
                entity.tenChuThe(),
                entity.maSoDinhDanh(),
                entity.diaChiLienHe(),
                entity.soDienThoai(),
                entity.email(),
                entity.hoTenNguoiKy(),
                entity.chucVuNguoiKy(),
                entity.tuCachKy(),
                entity.canCuUyQuyen(),
                entity.thongTinDonViQuanLy(),
                entity.soTaiKhoan(),
                entity.tenNganHang(),
                entity.chuTaiKhoan(),
                entity.capNhatLuc()
        );
    }
}

