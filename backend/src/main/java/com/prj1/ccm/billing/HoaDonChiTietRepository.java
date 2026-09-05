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
                                  AND hd.ky_id = ?
                                  AND p.toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> {
                            HoaDonDuLieu hoaDon = new HoaDonDuLieu(
                                    resultSet.getLong("id"),
                                    resultSet.getString("ma_hoa_don"),
                                    resultSet.getLong("ky_id"),
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
