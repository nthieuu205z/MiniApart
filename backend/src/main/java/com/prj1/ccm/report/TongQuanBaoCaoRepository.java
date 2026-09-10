package com.prj1.ccm.report;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** FR-RPT-01 reads report facts with the permission scope embedded in each SQL query. */
@Repository
public class TongQuanBaoCaoRepository {
    private final JdbcTemplate jdbcTemplate;

    public TongQuanBaoCaoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** FR-RPT-02 aggregates issued invoices by month after payment entries are summed per invoice. */
    public List<TongHopBaoCaoTheoThang> findTongHopTheoThang(
            Long nguoiDungId,
            Long toaNhaId,
            LocalDate tuNgay,
            LocalDate denNgay
    ) {
        StringBuilder sql = new StringBuilder(
                """
                        WITH hoa_don_pham_vi AS (
                            SELECT hd.id,
                                   DATE_TRUNC('month', hd.ngay_phat_hanh)::DATE AS thang,
                                   hd.tong_tien,
                                   hd.da_thu
                            FROM HOA_DON hd
                            JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                            JOIN PHONG p ON p.id = hop_dong.phong_id
                            WHERE EXISTS (
                                SELECT 1
                                FROM PHAN_QUYEN_TOA pqt
                                WHERE pqt.toa_nha_id = p.toa_nha_id
                                  AND pqt.nguoi_dung_id = ?
                            )
                              AND hd.ngay_phat_hanh BETWEEN ? AND ?
                              AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                        """
        );
        List<Object> thamSo = new ArrayList<>(List.of(nguoiDungId, tuNgay, denNgay));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            thamSo.add(toaNhaId);
        }
        sql.append(
                """
                        ),
                        tong_dai_so AS (
                            SELECT tt.hoa_don_id, SUM(tt.so_tien) AS tong_dai_so
                            FROM THANH_TOAN tt
                            JOIN hoa_don_pham_vi hd ON hd.id = tt.hoa_don_id
                            GROUP BY tt.hoa_don_id
                        )
                        SELECT hd.thang,
                               SUM(hd.tong_tien) AS doanh_thu_phat_hanh,
                               SUM(GREATEST(LEAST(COALESCE(td.tong_dai_so, hd.da_thu, 0), hd.tong_tien), 0)) AS da_thu,
                               SUM(hd.tong_tien - GREATEST(LEAST(COALESCE(td.tong_dai_so, hd.da_thu, 0), hd.tong_tien), 0)) AS cong_no
                        FROM hoa_don_pham_vi hd
                        LEFT JOIN tong_dai_so td ON td.hoa_don_id = hd.id
                        GROUP BY hd.thang ORDER BY hd.thang
                        """
        );

        return jdbcTemplate.query(
                sql.toString(),
                (resultSet, rowNum) -> new TongHopBaoCaoTheoThang(
                        resultSet.getObject("thang", LocalDate.class),
                        resultSet.getBigDecimal("doanh_thu_phat_hanh"),
                        resultSet.getBigDecimal("da_thu"),
                        resultSet.getBigDecimal("cong_no")
                ),
                thamSo.toArray()
        );
    }

    /** FR-RPT-01 calculates current room state from effective contracts, not the cached room label. */
    public HienTrangBaoCao layHienTrang(
            Long nguoiDungId,
            Long toaNhaId,
            LocalDate ngayTinh,
            Instant hienTai
    ) {
        StringBuilder roomSql = new StringBuilder(
                """
                        WITH tham_so AS (SELECT CAST(? AS DATE) AS ngay_tinh)
                        SELECT COUNT(*) AS tong_so_phong,
                               COUNT(*) FILTER (WHERE EXISTS (
                                   SELECT 1
                                   FROM HOP_DONG hd
                                   WHERE hd.phong_id = p.id
                                     AND hd.trang_thai = 'HIEU_LUC'
                                     AND hd.ngay_bat_dau <= t.ngay_tinh
                                     AND hd.ngay_ket_thuc >= t.ngay_tinh
                               )) AS so_phong_dang_thue,
                               COUNT(*) FILTER (WHERE p.ngung_cho_thue = FALSE
                                      AND NOT EXISTS (
                                          SELECT 1
                                          FROM HOP_DONG hd
                                          WHERE hd.phong_id = p.id
                                            AND hd.trang_thai = 'HIEU_LUC'
                                            AND hd.ngay_bat_dau <= t.ngay_tinh
                                            AND hd.ngay_ket_thuc >= t.ngay_tinh
                                      )
                                      AND NOT EXISTS (
                                          SELECT 1
                                          FROM HOP_DONG hd
                                          WHERE hd.phong_id = p.id
                                            AND hd.trang_thai = 'DA_COC'
                                            AND hd.ngay_bat_dau > t.ngay_tinh
                                      )) AS so_phong_trong
                        FROM PHONG p
                        CROSS JOIN tham_so t
                        WHERE EXISTS (
                            SELECT 1
                            FROM PHAN_QUYEN_TOA pqt
                            WHERE pqt.toa_nha_id = p.toa_nha_id
                              AND pqt.nguoi_dung_id = ?
                        )
                        """
        );
        List<Object> roomParams = new ArrayList<>(List.of(ngayTinh, nguoiDungId));
        if (toaNhaId != null) {
            roomSql.append(" AND p.toa_nha_id = ?");
            roomParams.add(toaNhaId);
        }

        Integer[] roomCounts = jdbcTemplate.queryForObject(
                roomSql.toString(),
                (resultSet, rowNum) -> new Integer[]{
                        resultSet.getInt("tong_so_phong"),
                        resultSet.getInt("so_phong_dang_thue"),
                        resultSet.getInt("so_phong_trong")
                },
                roomParams.toArray()
        );

        StringBuilder repairSql = new StringBuilder(
                """
                        SELECT COUNT(*)
                        FROM YEU_CAU_SUA_CHUA yc
                        JOIN PHONG p ON p.id = yc.phong_id
                        WHERE EXISTS (
                            SELECT 1
                            FROM PHAN_QUYEN_TOA pqt
                            WHERE pqt.toa_nha_id = p.toa_nha_id
                              AND pqt.nguoi_dung_id = ?
                        )
                          AND yc.trang_thai NOT IN ('DA_DONG', 'DA_HUY')
                          AND NOT (
                              yc.trang_thai = 'CHO_XAC_NHAN'
                              AND yc.cho_xac_nhan_luc IS NOT NULL
                              AND yc.cho_xac_nhan_luc < CAST(? AS TIMESTAMPTZ) - INTERVAL '72 hours'
                          )
                        """
        );
        List<Object> repairParams = new ArrayList<>(List.of(nguoiDungId, Timestamp.from(hienTai)));
        if (toaNhaId != null) {
            repairSql.append(" AND p.toa_nha_id = ?");
            repairParams.add(toaNhaId);
        }
        Integer openRepairs = jdbcTemplate.queryForObject(repairSql.toString(), Integer.class, repairParams.toArray());

        return new HienTrangBaoCao(
                roomCounts == null ? 0 : roomCounts[0],
                roomCounts == null ? 0 : roomCounts[1],
                roomCounts == null ? 0 : roomCounts[2],
                openRepairs == null ? 0 : openRepairs
        );
    }

    /** FR-RPT-02 reasserts the selected building permission inside the report read transaction. */
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
}
