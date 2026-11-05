package com.prj1.ccm.thongbao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;

@Repository
class BangViecVanHanhRepository {
    private final JdbcTemplate jdbcTemplate;

    BangViecVanHanhRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** FR-NTF-01 reasserts the permission inside the dashboard read transaction. */
    boolean xacNhanPhanQuyenToa(Long nguoiDungId, Long toaNhaId) {
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

    /** FR-NTF-01 counts missing readings only through the authenticated user's building permission. */
    int demPhongThieuChiSoSauNgayChot(Long nguoiDungId, Long toaNhaId, LocalDate homNay) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(DISTINCT p.id)
                        FROM KY_THANH_TOAN kt
                        JOIN PHONG p ON p.toa_nha_id = kt.toa_nha_id
                        JOIN PHAN_QUYEN_TOA pqt
                          ON pqt.toa_nha_id = p.toa_nha_id
                         AND pqt.nguoi_dung_id = ?
                        JOIN HOP_DONG hd ON hd.phong_id = p.id
                        JOIN HOP_DONG_DICH_VU hddv ON hddv.hop_dong_id = hd.id
                        JOIN DICH_VU dv ON dv.id = hddv.dich_vu_id
                        LEFT JOIN CHI_SO_DICH_VU cs
                               ON cs.ky_id = kt.id
                              AND cs.phong_id = p.id
                              AND cs.dich_vu_id = dv.id
                        WHERE kt.toa_nha_id = ?
                          AND kt.trang_thai = 'DANG_MO'
                          AND kt.ngay_ket_thuc <= ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND dv.cach_tinh = 'THEO_CHI_SO'
                          AND dv.dang_su_dung = TRUE
                          AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                              && daterange(kt.ngay_bat_dau, kt.ngay_ket_thuc, '[]')
                          AND cs.id IS NULL
                """,
                Integer.class,
                nguoiDungId,
                toaNhaId,
                homNay
        );
        return dem == null ? 0 : dem;
    }

    /** FR-NTF-01 counts near-expiry contracts only through the authenticated user's building permission. */
    int demHopDongSapHetHan(Long nguoiDungId, Long toaNhaId, LocalDate homNay) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        JOIN PHAN_QUYEN_TOA pqt
                          ON pqt.toa_nha_id = p.toa_nha_id
                         AND pqt.nguoi_dung_id = ?
                        WHERE p.toa_nha_id = ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND hd.ngay_ket_thuc BETWEEN ? AND ?
                """,
                Integer.class,
                nguoiDungId,
                toaNhaId,
                homNay,
                homNay.plusDays(30)
        );
        return dem == null ? 0 : dem;
    }

    /** FR-NTF-01 counts repairs strictly older than 48 hours in SQL and derives 72-hour closure in the predicate. */
    int demSuCoTonDongQuaHaiMuoiTamGio(Long nguoiDungId, Long toaNhaId, Instant hienTai) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM YEU_CAU_SUA_CHUA yc
                        JOIN PHONG p ON p.id = yc.phong_id
                        JOIN PHAN_QUYEN_TOA pqt
                          ON pqt.toa_nha_id = p.toa_nha_id
                         AND pqt.nguoi_dung_id = ?
                        WHERE p.toa_nha_id = ?
                          AND yc.trang_thai NOT IN ('DA_DONG', 'DA_HUY')
                          AND yc.tao_luc < CAST(? AS TIMESTAMPTZ) - INTERVAL '48 hours'
                          AND NOT (
                              yc.trang_thai = 'CHO_XAC_NHAN'
                              AND yc.cho_xac_nhan_luc IS NOT NULL
                              AND yc.cho_xac_nhan_luc < CAST(? AS TIMESTAMPTZ) - INTERVAL '72 hours'
                          )
                        """,
                Integer.class,
                nguoiDungId,
                toaNhaId,
                Timestamp.from(hienTai),
                Timestamp.from(hienTai)
        );
        return dem == null ? 0 : dem;
    }
}
