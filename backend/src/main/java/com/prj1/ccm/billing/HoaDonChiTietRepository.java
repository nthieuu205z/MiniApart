package com.prj1.ccm.billing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
class HoaDonChiTietRepository {
    private final JdbcTemplate jdbcTemplate;

    HoaDonChiTietRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Optional<HoaDonDuLieu> find(Long toaNhaId, Long kyId, Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hd.ma_hoa_don, hd.ky_id, hd.hop_dong_id,
                                       hd.ngay_phat_hanh, hd.han_thanh_toan, hd.tong_tien,
                                       COALESCE(
                                           (SELECT SUM(tt.so_tien) FROM THANH_TOAN tt WHERE tt.hoa_don_id = hd.id),
                                           0.00
                                       ) AS da_thu,
                                       hd.so_nguoi_o, hd.so_ho_quy_doi, hd.giai_thich_so_ho,
                                       hop_dong.nguoi_thue_id, p.so_phong, nt.ho_ten
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                JOIN NGUOI_THUE nt ON nt.id = hop_dong.nguoi_thue_id
                                WHERE hd.id = ?
                                  AND hd.ky_id IS NOT DISTINCT FROM ?
                                  AND p.toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> {
                            HoaDonDuLieu hoaDon = new HoaDonDuLieu(
                                    resultSet.getLong("id"),
                                    resultSet.getString("ma_hoa_don"),
                                    getLongOrNull(resultSet, "ky_id"),
                                    resultSet.getLong("hop_dong_id"),
                                    resultSet.getLong("nguoi_thue_id"),
                                    resultSet.getObject("ngay_phat_hanh", LocalDate.class),
                                    resultSet.getObject("han_thanh_toan", LocalDate.class),
                                    resultSet.getBigDecimal("tong_tien"),
                                    resultSet.getBigDecimal("da_thu"),
                                    resultSet.getObject("so_nguoi_o", Integer.class),
                                    resultSet.getObject("so_ho_quy_doi", Integer.class),
                                    resultSet.getString("giai_thich_so_ho"),
                                    resultSet.getString("so_phong"),
                                    resultSet.getString("ho_ten"),
                                    List.of()
                            );
                            return new HoaDonDuLieu(
                                    hoaDon.id(), hoaDon.maHoaDon(), hoaDon.kyId(), hoaDon.hopDongId(),
                                    hoaDon.nguoiThueId(),
                                    hoaDon.ngayPhatHanh(), hoaDon.hanThanhToan(), hoaDon.tongTien(), hoaDon.daThu(),
                                    hoaDon.soNguoiO(), hoaDon.soHoQuyDoi(), hoaDon.giaiThichSoHo(),
                                    hoaDon.soPhong(), hoaDon.hoTen(), findLines(hoaDon.id())
                            );
                        },
                        hoaDonId,
                        kyId,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    Optional<HoaDonPhamVi> findPhamViByHoaDonId(Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hd.ky_id, p.toa_nha_id
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                WHERE hd.id = ?
                                """,
                        (resultSet, rowNum) -> new HoaDonPhamVi(
                                resultSet.getLong("id"),
                                getLongOrNull(resultSet, "ky_id"),
                                resultSet.getLong("toa_nha_id")
                        ),
                        hoaDonId
                )
                .stream()
                .findFirst();
    }

    Optional<HoaDonPhamVi> findHoaDonMoiNhatCuaNguoiThue(Long nguoiThueId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hd.ky_id, p.toa_nha_id
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                JOIN KY_THANH_TOAN ky ON ky.id = hd.ky_id
                                WHERE hop_dong.nguoi_thue_id = ?
                                  AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                                ORDER BY ky.ngay_ket_thuc DESC, hd.id DESC
                                LIMIT 1
                                """,
                        (resultSet, rowNum) -> new HoaDonPhamVi(
                                resultSet.getLong("id"),
                                getLongOrNull(resultSet, "ky_id"),
                                resultSet.getLong("toa_nha_id")
                        ),
                        nguoiThueId
                )
                .stream()
                .findFirst();
    }

    List<HoaDonLichSuDuLieu> findLichSuCuaNguoiThue(Long nguoiThueId) {
        return jdbcTemplate.query(
                """
                        SELECT hd.id, hd.ma_hoa_don, hd.ky_id, hd.hop_dong_id,
                               hd.ngay_phat_hanh, hd.han_thanh_toan, hd.tong_tien,
                               COALESCE(
                                   (SELECT SUM(tt.so_tien) FROM THANH_TOAN tt WHERE tt.hoa_don_id = hd.id),
                                   0.00
                               ) AS da_thu,
                               hd.trang_thai, hop_dong.trang_thai AS hop_dong_trang_thai,
                               p.toa_nha_id, toa.ma_toa, toa.ten AS ten_toa_nha,
                               p.so_phong, ky.nam, ky.thang, ky.ngay_bat_dau, ky.ngay_ket_thuc
                        FROM HOA_DON hd
                        JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                        JOIN PHONG p ON p.id = hop_dong.phong_id
                        JOIN TOA_NHA toa ON toa.id = p.toa_nha_id
                        LEFT JOIN KY_THANH_TOAN ky ON ky.id = hd.ky_id
                        WHERE hop_dong.nguoi_thue_id = ?
                          AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                        ORDER BY CASE WHEN ky.id IS NULL THEN 1 ELSE 0 END,
                                 ky.ngay_ket_thuc DESC, hd.ngay_phat_hanh DESC, hd.id DESC
                        """,
                (resultSet, rowNum) -> new HoaDonLichSuDuLieu(
                        resultSet.getLong("id"),
                        resultSet.getString("ma_hoa_don"),
                        resultSet.getLong("toa_nha_id"),
                        getLongOrNull(resultSet, "ky_id"),
                        resultSet.getLong("hop_dong_id"),
                        resultSet.getObject("nam", Integer.class),
                        resultSet.getObject("thang", Integer.class),
                        resultSet.getObject("ngay_bat_dau", LocalDate.class),
                        resultSet.getObject("ngay_ket_thuc", LocalDate.class),
                        resultSet.getString("so_phong"),
                        resultSet.getString("trang_thai"),
                        resultSet.getString("hop_dong_trang_thai"),
                        resultSet.getString("ma_toa"),
                        resultSet.getString("ten_toa_nha"),
                        resultSet.getObject("ngay_phat_hanh", LocalDate.class),
                        resultSet.getObject("han_thanh_toan", LocalDate.class),
                        resultSet.getBigDecimal("tong_tien"),
                        resultSet.getBigDecimal("da_thu")
                ),
                nguoiThueId
        );
    }

    List<TieuThuDuLieu> findTieuThuCuaNguoiThue(Long nguoiThueId, int soKy) {
        return jdbcTemplate.query(
                """
                        WITH ky_gan_nhat AS (
                            SELECT ky.id, ky.ngay_ket_thuc
                            FROM HOA_DON hd
                            JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                            JOIN KY_THANH_TOAN ky ON ky.id = hd.ky_id
                            WHERE hop_dong.nguoi_thue_id = ?
                              AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                            GROUP BY ky.id, ky.ngay_ket_thuc
                            ORDER BY ky.ngay_ket_thuc DESC, ky.id DESC
                            LIMIT ?
                        )
                        SELECT ky.id AS ky_id, ky.nam, ky.thang,
                               hd.id AS hoa_don_id, hop_dong.id AS hop_dong_id,
                               p.so_phong, ct.dich_vu_id, dv.ten AS ten_dich_vu,
                               dv.don_vi, dv.la_dien,
                               ct.chi_so_dau, ct.chi_so_cuoi, ct.so_luong
                        FROM ky_gan_nhat gan
                        JOIN KY_THANH_TOAN ky ON ky.id = gan.id
                        JOIN HOA_DON hd ON hd.ky_id = ky.id
                        JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                        JOIN PHONG p ON p.id = hop_dong.phong_id
                        JOIN CHI_TIET_HOA_DON ct ON ct.hoa_don_id = hd.id
                        JOIN DICH_VU dv ON dv.id = ct.dich_vu_id
                        WHERE hop_dong.nguoi_thue_id = ?
                          AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                          AND ct.loai_khoan = 'DICH_VU'
                          AND ct.so_luong IS NOT NULL
                          AND dv.cach_tinh = 'THEO_CHI_SO'
                        ORDER BY ky.ngay_ket_thuc DESC, ky.id DESC,
                                 CASE WHEN dv.la_dien THEN 0 ELSE 1 END,
                                 dv.id, hd.id, ct.id
                        """,
                (resultSet, rowNum) -> new TieuThuDuLieu(
                        resultSet.getLong("ky_id"),
                        resultSet.getLong("hoa_don_id"),
                        resultSet.getInt("nam"),
                        resultSet.getInt("thang"),
                        resultSet.getLong("hop_dong_id"),
                        resultSet.getString("so_phong"),
                        resultSet.getLong("dich_vu_id"),
                        resultSet.getString("ten_dich_vu"),
                        resultSet.getString("don_vi"),
                        resultSet.getBigDecimal("chi_so_dau"),
                        resultSet.getBigDecimal("chi_so_cuoi"),
                        resultSet.getBigDecimal("so_luong"),
                        resultSet.getBoolean("la_dien")
                ),
                nguoiThueId,
                soKy,
                nguoiThueId
        );
    }

    private List<DongHoaDonDuLieu> findLines(Long hoaDonId) {
        return jdbcTemplate.query(
                """
                        SELECT ct.id, ct.dich_vu_id, ct.ten_khoan, ct.chi_so_dau, ct.chi_so_cuoi,
                               ct.so_luong, ct.don_gia, ct.thanh_tien, ct.loai_khoan, ct.dien_giai, ct.ly_do,
                               anh.id AS anh_cong_to_id
                        FROM CHI_TIET_HOA_DON ct
                        JOIN HOA_DON hd ON hd.id = ct.hoa_don_id
                        JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                        LEFT JOIN LATERAL (
                            SELECT anh.id
                            FROM CHI_SO_DICH_VU cs
                            JOIN ANH_DINH_KEM anh
                              ON anh.doi_tuong_loai = 'CHI_SO_DICH_VU'
                             AND anh.doi_tuong_id = cs.id
                            WHERE cs.ky_id = hd.ky_id
                              AND cs.phong_id = hop_dong.phong_id
                              AND cs.dich_vu_id = ct.dich_vu_id
                            ORDER BY anh.id DESC
                            LIMIT 1
                        ) anh ON TRUE
                        WHERE ct.hoa_don_id = ?
                        ORDER BY ct.id
                        """,
                (resultSet, rowNum) -> new DongHoaDonDuLieu(
                        resultSet.getLong("id"),
                        getLongOrNull(resultSet, "dich_vu_id"),
                        resultSet.getString("ten_khoan"),
                        resultSet.getBigDecimal("chi_so_dau"),
                        resultSet.getBigDecimal("chi_so_cuoi"),
                        resultSet.getBigDecimal("so_luong"),
                        resultSet.getBigDecimal("don_gia"),
                        resultSet.getBigDecimal("thanh_tien"),
                        resultSet.getString("loai_khoan"),
                        resultSet.getString("dien_giai"),
                        getLongOrNull(resultSet, "anh_cong_to_id"),
                        resultSet.getString("ly_do"),
                        findTiers(resultSet.getLong("id"))
                ),
                hoaDonId
        );
    }

    private List<BacHoaDonDuLieu> findTiers(Long chiTietId) {
        return jdbcTemplate.query(
                """
                        SELECT bac, tu_so_luong, den_so_luong, dinh_muc_quy_doi, so_luong, don_gia, thanh_tien
                        FROM CHI_TIET_HOA_DON_BAC_THANG
                        WHERE chi_tiet_hoa_don_id = ?
                        ORDER BY bac
                        """,
                (resultSet, rowNum) -> new BacHoaDonDuLieu(
                        resultSet.getInt("bac"),
                        resultSet.getBigDecimal("tu_so_luong"),
                        resultSet.getBigDecimal("den_so_luong"),
                        resultSet.getBigDecimal("dinh_muc_quy_doi"),
                        resultSet.getBigDecimal("so_luong"),
                        resultSet.getBigDecimal("don_gia"),
                        resultSet.getBigDecimal("thanh_tien")
                ),
                chiTietId
        );
    }

    private Long getLongOrNull(java.sql.ResultSet resultSet, String column) throws java.sql.SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }
}

record HoaDonDuLieu(
        Long id,
        String maHoaDon,
        Long kyId,
        Long hopDongId,
        Long nguoiThueId,
        LocalDate ngayPhatHanh,
        LocalDate hanThanhToan,
        BigDecimal tongTien,
        BigDecimal daThu,
        Integer soNguoiO,
        Integer soHoQuyDoi,
        String giaiThichSoHo,
        String soPhong,
        String hoTen,
        List<DongHoaDonDuLieu> cacDong
) {
}

record DongHoaDonDuLieu(
        Long id,
        Long dichVuId,
        String tenKhoan,
        BigDecimal chiSoDau,
        BigDecimal chiSoCuoi,
        BigDecimal soLuong,
        BigDecimal donGia,
        BigDecimal thanhTien,
        String loaiKhoan,
        String dienGiai,
        Long anhCongToId,
        String lyDo,
        List<BacHoaDonDuLieu> cacBac
) {
}

record BacHoaDonDuLieu(
        int bac,
        BigDecimal tuSoLuong,
        BigDecimal denSoLuong,
        BigDecimal dinhMucQuyDoi,
        BigDecimal soLuong,
        BigDecimal donGia,
        BigDecimal thanhTien
) {
}

record HoaDonPhamVi(Long hoaDonId, Long kyId, Long toaNhaId) {
}

record HoaDonLichSuDuLieu(
        Long hoaDonId,
        String maHoaDon,
        Long toaNhaId,
        Long kyId,
        Long hopDongId,
        Integer nam,
        Integer thang,
        LocalDate ngayBatDau,
        LocalDate ngayKetThuc,
        String soPhong,
        String trangThai,
        String hopDongTrangThai,
        String maToa,
        String tenToaNha,
        LocalDate ngayPhatHanh,
        LocalDate hanThanhToan,
        BigDecimal tongTien,
        BigDecimal daThu
) {
}

record TieuThuDuLieu(
        Long kyId,
        Long hoaDonId,
        Integer nam,
        Integer thang,
        Long hopDongId,
        String soPhong,
        Long dichVuId,
        String tenDichVu,
        String donVi,
        BigDecimal chiSoDau,
        BigDecimal chiSoCuoi,
        BigDecimal mucTieuThu,
        boolean laDien
) {
}
