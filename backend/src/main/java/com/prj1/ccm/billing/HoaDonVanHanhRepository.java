package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * FR-NTF-01 reads invoice worklist candidates through the caller's building permission.
 * The permission join is deliberately part of every result query, not only a service pre-check.
 */
@Repository
public class HoaDonVanHanhRepository {
    private final JdbcTemplate jdbcTemplate;

    public HoaDonVanHanhRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** FR-NTF-01 returns only invoice rows inside the authenticated user's building scope. */
    public List<HoaDonVanHanhDuLieu> findTrongPhamVi(Long nguoiDungId, Long toaNhaId) {
        return jdbcTemplate.query(
                """
                        SELECT hd.id AS hoa_don_id,
                               hd.ky_id,
                               hd.ma_hoa_don,
                               p.toa_nha_id,
                               p.so_phong,
                               nt.ho_ten,
                               hd.ngay_phat_hanh,
                               hd.han_thanh_toan,
                               hd.trang_thai,
                               hd.tong_tien,
                               COALESCE(
                                   (SELECT SUM(tt.so_tien)
                                    FROM THANH_TOAN tt
                                    WHERE tt.hoa_don_id = hd.id),
                                   hd.da_thu
                               ) AS da_thu
                        FROM HOA_DON hd
                        JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                        JOIN PHONG p ON p.id = hop_dong.phong_id
                        JOIN NGUOI_THUE nt ON nt.id = hop_dong.nguoi_thue_id
                        JOIN PHAN_QUYEN_TOA pqt
                          ON pqt.toa_nha_id = p.toa_nha_id
                         AND pqt.nguoi_dung_id = ?
                        WHERE p.toa_nha_id = ?
                        ORDER BY hd.han_thanh_toan ASC, hd.id ASC
                        """,
                (resultSet, rowNum) -> new HoaDonVanHanhDuLieu(
                        resultSet.getLong("hoa_don_id"),
                        layLongNullable(resultSet, "ky_id"),
                        resultSet.getString("ma_hoa_don"),
                        resultSet.getLong("toa_nha_id"),
                        resultSet.getString("so_phong"),
                        resultSet.getString("ho_ten"),
                        resultSet.getObject("ngay_phat_hanh", LocalDate.class),
                        resultSet.getObject("han_thanh_toan", LocalDate.class),
                        TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai")),
                        resultSet.getBigDecimal("tong_tien"),
                        resultSet.getBigDecimal("da_thu")
                ),
                nguoiDungId,
                toaNhaId
        );
    }

    /** FR-NTF-01 reasserts the permission for the complete read transaction. */
    public boolean xacNhanPhanQuyenToa(Long nguoiDungId, Long toaNhaId) {
        return !jdbcTemplate.query(
                """
                        SELECT 1
                        FROM PHAN_QUYEN_TOA
                        WHERE nguoi_dung_id = ? AND toa_nha_id = ?
                        """,
                (resultSet, rowNum) -> resultSet.getInt(1),
                nguoiDungId,
                toaNhaId
        ).isEmpty();
    }

    private Long layLongNullable(java.sql.ResultSet resultSet, String column) throws java.sql.SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }
}
