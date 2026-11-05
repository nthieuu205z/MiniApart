package com.prj1.ccm.hopdong;

import java.math.BigDecimal;
import java.time.LocalDate;

public record YeuCauLuuDraftHoSo(
        Integer expectedRevision,
        Integer revision,
        Long mauHopDongId,
        String tieuDe,
        LocalDate ngayLap,
        String diaDiemLap,
        String mucDichThue,
        String phamViSuDung,
        LocalDate ngayNhanPhong,
        String phuongThucThanhToan,
        Integer kyThanhToanThang,
        Integer hanThanhToanNgay,
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

        // Điều khoản tùy biến
        String dieuKhoanTuyBien,

        // Chính sách vận hành thỏa thuận (V60)
        Integer soNguoiToiDa,
        Integer soNgayBaoTruocGiaHan,
        Integer soNgayHoanCoc,
        String khungGioYenTinh
) {
    public YeuCauLuuDraftHoSo(
            Integer expectedRevision, Integer revision, Long mauHopDongId, String tieuDe, LocalDate ngayLap,
            String diaDiemLap, String mucDichThue, String phamViSuDung, LocalDate ngayNhanPhong,
            String phuongThucThanhToan, Integer kyThanhToanThang, Integer hanThanhToanNgay, String taiKhoanNhanTien,
            String dieuKienDieuChinhGia, Long bienBanBanGiaoId, String benALoaiChuThe, String benATenChuThe,
            String benADinhDanh, String benADiaChi, String benADienThoai, String benAEmail, String benANguoiKy,
            String benAChucVu, String benATuCachKy, String benACanCuUyQuyen, String benADonViQuanLy,
            String benBHoTen, LocalDate benBNgaySinh, String benBLoaiGiayTo, String benBSoGiayTo,
            LocalDate benBNgayCap, String benBNoiCap, String benBThuongTru, String benBLienHe,
            String benBDienThoai, String benBEmail, String dieuKhoanTuyBien
    ) {
        this(
                expectedRevision, revision, mauHopDongId, tieuDe, ngayLap, diaDiemLap, mucDichThue, phamViSuDung,
                ngayNhanPhong, phuongThucThanhToan, kyThanhToanThang, hanThanhToanNgay, taiKhoanNhanTien,
                dieuKienDieuChinhGia, bienBanBanGiaoId, benALoaiChuThe, benATenChuThe, benADinhDanh, benADiaChi,
                benADienThoai, benAEmail, benANguoiKy, benAChucVu, benATuCachKy, benACanCuUyQuyen, benADonViQuanLy,
                benBHoTen, benBNgaySinh, benBLoaiGiayTo, benBSoGiayTo, benBNgayCap, benBNoiCap, benBThuongTru,
                benBLienHe, benBDienThoai, benBEmail, dieuKhoanTuyBien, null, 30, 7, "22h00 - 06h00"
        );
    }
    public Integer getEffectiveRevision() {
        return expectedRevision != null ? expectedRevision : revision;
    }
}
