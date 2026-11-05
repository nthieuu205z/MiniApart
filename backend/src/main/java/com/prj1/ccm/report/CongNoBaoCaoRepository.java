package com.prj1.ccm.report;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** FR-RPT-03 reads debt from the payment ledger while enforcing the building permission in SQL. */
@Repository
public class CongNoBaoCaoRepository {
    private final JdbcTemplate jdbcTemplate;

    public CongNoBaoCaoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** FR-RPT-02/FR-RPT-03 returns only positive outstanding balances in stable overdue order. */
    public List<KhoanNoBaoCao> findCongNo(Long nguoiDungId, Long toaNhaId, LocalDate ngayTinh) {
        StringBuilder sql = new StringBuilder(
                """
                        WITH hoa_don_co_pham_vi AS (
                            SELECT hd.id AS hoa_don_id,
                                   hd.ma_hoa_don,
                                   hd.ky_id,
                                   hd.hop_dong_id,
                                   p.toa_nha_id,
                                   tn.ten AS ten_toa_nha,
                                   p.so_phong,
                                   hop_dong.nguoi_thue_id,
                                   nt.ho_ten AS ho_ten_nguoi_thue,
                                   hd.ngay_phat_hanh,
                                   hd.han_thanh_toan,
                                   hd.tong_tien,
                                   hd.da_thu AS da_thu_cot_hoa_don,
                                   GREATEST(CAST(? AS DATE) - hd.han_thanh_toan, 0) AS so_ngay_qua_han
                            FROM HOA_DON hd
                            JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                            JOIN PHONG p ON p.id = hop_dong.phong_id
                            JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                            JOIN NGUOI_THUE nt ON nt.id = hop_dong.nguoi_thue_id
                            WHERE EXISTS (
                                SELECT 1
                                FROM PHAN_QUYEN_TOA pqt
                                WHERE pqt.toa_nha_id = p.toa_nha_id
                                  AND pqt.nguoi_dung_id = ?
                            )
                              AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                        """
        );
        List<Object> thamSo = new ArrayList<>(List.of(Date.valueOf(ngayTinh), nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            thamSo.add(toaNhaId);
        }
        sql.append(
                """
                        ),
                        thanh_toan_theo_hoa_don AS (
                            SELECT tt.hoa_don_id, SUM(tt.so_tien) AS da_thu
                            FROM THANH_TOAN tt
                            JOIN hoa_don_co_pham_vi hd ON hd.hoa_don_id = tt.hoa_don_id
                            GROUP BY tt.hoa_don_id
                        ),
                        hoa_don_pham_vi AS (
                            SELECT hd.*,
                                   GREATEST(
                                       LEAST(COALESCE(tt.da_thu, hd.da_thu_cot_hoa_don, 0.00), hd.tong_tien),
                                       0.00
                                   ) AS da_thu
                            FROM hoa_don_co_pham_vi hd
                            LEFT JOIN thanh_toan_theo_hoa_don tt ON tt.hoa_don_id = hd.hoa_don_id
                        )
                        SELECT hoa_don_id,
                               ma_hoa_don,
                               ky_id,
                               hop_dong_id,
                               toa_nha_id,
                               ten_toa_nha,
                               so_phong,
                               nguoi_thue_id,
                               ho_ten_nguoi_thue,
                               ngay_phat_hanh,
                               han_thanh_toan,
                               tong_tien,
                               da_thu,
                               GREATEST(tong_tien - da_thu, 0.00) AS con_lai,
                               so_ngay_qua_han
                        FROM hoa_don_pham_vi
                        WHERE tong_tien - da_thu > 0
                        ORDER BY so_ngay_qua_han DESC,
                                 toa_nha_id ASC,
                                 so_phong ASC,
                                 han_thanh_toan ASC,
                                 hoa_don_id ASC
                        """
        );

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> new KhoanNoBaoCao(
                        resultSet.getLong("hoa_don_id"),
                        resultSet.getString("ma_hoa_don"),
                        getLongOrNull(resultSet, "ky_id"),
                        resultSet.getLong("hop_dong_id"),
                        resultSet.getLong("toa_nha_id"),
                        resultSet.getString("ten_toa_nha"),
                        resultSet.getString("so_phong"),
                        resultSet.getLong("nguoi_thue_id"),
                        resultSet.getString("ho_ten_nguoi_thue"),
                        resultSet.getObject("ngay_phat_hanh", LocalDate.class),
                        resultSet.getObject("han_thanh_toan", LocalDate.class),
                        resultSet.getBigDecimal("tong_tien"),
                        resultSet.getBigDecimal("da_thu"),
                        resultSet.getBigDecimal("con_lai"),
                        resultSet.getInt("so_ngay_qua_han")
                ),
                thamSo.toArray()
        );
    }

    /** FR-RPT-03 reasserts a selected building permission in the same read transaction. */
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

    private Long getLongOrNull(java.sql.ResultSet resultSet, String column) throws java.sql.SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }
}
