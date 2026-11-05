package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record HopDongHoSo(
        Long id,
        Long hopDongId,
        int revision,
        String trangThaiTaiLieu,
        Long mauHopDongId,
        Integer mauPhienBan,
        String tieuDe,
        LocalDate ngayLap,
        String diaDiemLap,
        String mucDichThue,
        String phamViSuDung,
        LocalDate ngayNhanPhong,
        String phuongThucThanhToan,
        int kyThanhToanThang,
        int hanThanhToanNgay,
        String taiKhoanNhanTien,
        String dieuKienDieuChinhGia,
        Long bienBanBanGiaoId,

        // Snapshot Bên A
        String benALoaiChuThe,
        String benATenChuThe,
        String benADinhDanh,
        String benADiaChi,
        String benADienThoai,
        String benAEmail,
        String benANguoiKy,
        String benAChucVu,
        String benATuCachKy,
        String benACanCuUyQuyen,
        String benADonViQuanLy,

        // Snapshot Bên B
        String benBHoTen,
        LocalDate benBNgaySinh,
        String benBLoaiGiayTo,
        String benBSoGiayTo,
        LocalDate benBNgayCap,
        String benBNoiCap,
        String benBThuongTru,
        String benBLienHe,
        String benBDienThoai,
        String benBEmail,

        // Snapshot Bất động sản
        String bdsTenToaNha,
        String bdsDiaChiToaNha,
        String bdsSoPhong,
        Integer bdsTang,
        BigDecimal bdsDienTich,

        // Snapshot Điều khoản & Phụ lục (JSON snapshot)
        String dieuKhoanTuyBien,
        String snapshotDichVuJson,
        String snapshotTaiSanJson,
        String snapshotNguoiOCungJson,

        // Metadata chốt hợp đồng & Ghi nhận ký
        Long chotBoiNguoiDungId,
        LocalDateTime thoiDiemChot,
        Long ghiNhanKyBoiId,
        LocalDate ngayKy,
        LocalDateTime thoiDiemGhiNhanKy,
        String ghiChuKy,
        String fileScanDinhKem,

        LocalDateTime taoLuc,
        LocalDateTime capNhatLuc,

        // Chính sách vận hành thỏa thuận (V60)
        Integer soNguoiToiDa,
        Integer soNgayBaoTruocGiaHan,
        Integer soNgayHoanCoc,
        String khungGioYenTinh
) {
    public HopDongHoSo(
            Long id, Long hopDongId, int revision, String trangThaiTaiLieu, Long mauHopDongId, Integer mauPhienBan,
            String tieuDe, LocalDate ngayLap, String diaDiemLap, String mucDichThue, String phamViSuDung,
            LocalDate ngayNhanPhong, String phuongThucThanhToan, int kyThanhToanThang, int hanThanhToanNgay,
            String taiKhoanNhanTien, String dieuKienDieuChinhGia, Long bienBanBanGiaoId,
            String benALoaiChuThe, String benATenChuThe, String benADinhDanh, String benADiaChi, String benADienThoai,
            String benAEmail, String benANguoiKy, String benAChucVu, String benATuCachKy, String benACanCuUyQuyen,
            String benADonViQuanLy, String benBHoTen, LocalDate benBNgaySinh, String benBLoaiGiayTo, String benBSoGiayTo,
            LocalDate benBNgayCap, String benBNoiCap, String benBThuongTru, String benBLienHe, String benBDienThoai,
            String benBEmail, String bdsTenToaNha, String bdsDiaChiToaNha, String bdsSoPhong, Integer bdsTang,
            BigDecimal bdsDienTich, String dieuKhoanTuyBien, String snapshotDichVuJson, String snapshotTaiSanJson,
            String snapshotNguoiOCungJson, Long chotBoiNguoiDungId, LocalDateTime thoiDiemChot, Long ghiNhanKyBoiId,
            LocalDate ngayKy, LocalDateTime thoiDiemGhiNhanKy, String ghiChuKy, String fileScanDinhKem,
            LocalDateTime taoLuc, LocalDateTime capNhatLuc
    ) {
        this(
                id, hopDongId, revision, trangThaiTaiLieu, mauHopDongId, mauPhienBan, tieuDe, ngayLap, diaDiemLap,
                mucDichThue, phamViSuDung, ngayNhanPhong, phuongThucThanhToan, kyThanhToanThang, hanThanhToanNgay,
                taiKhoanNhanTien, dieuKienDieuChinhGia, bienBanBanGiaoId, benALoaiChuThe, benATenChuThe, benADinhDanh,
                benADiaChi, benADienThoai, benAEmail, benANguoiKy, benAChucVu, benATuCachKy, benACanCuUyQuyen,
                benADonViQuanLy, benBHoTen, benBNgaySinh, benBLoaiGiayTo, benBSoGiayTo, benBNgayCap, benBNoiCap,
                benBThuongTru, benBLienHe, benBDienThoai, benBEmail, bdsTenToaNha, bdsDiaChiToaNha, bdsSoPhong,
                bdsTang, bdsDienTich, dieuKhoanTuyBien, snapshotDichVuJson, snapshotTaiSanJson, snapshotNguoiOCungJson,
                chotBoiNguoiDungId, thoiDiemChot, ghiNhanKyBoiId, ngayKy, thoiDiemGhiNhanKy, ghiChuKy, fileScanDinhKem,
                taoLuc, capNhatLuc, null, 30, 7, "22h00 - 06h00"
        );
    }
}

