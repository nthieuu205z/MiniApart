package com.prj1.ccm.report;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** FR-RPT-02/FR-RPT-05 reads meter rows from the permission-filtered period and room scope. */
@Repository
public class TieuThuBaoCaoRepository {
    private final JdbcTemplate jdbcTemplate;

    public TieuThuBaoCaoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** FR-RPT-02/FR-RPT-05 keeps missing readings as rows instead of converting them to zero. */
    public List<KhoanTieuThuBaoCao> findTieuThu(
            Long nguoiDungId,
            Long toaNhaId,
            Long phongId,
            Long kyId
    ) {
        String sql = """
                WITH ky_pham_vi AS (
                    SELECT kt.id, kt.toa_nha_id, kt.nam, kt.thang, kt.ngay_bat_dau, kt.ngay_ket_thuc
                    FROM KY_THANH_TOAN kt
                    WHERE EXISTS (
                        SELECT 1
                        FROM PHAN_QUYEN_TOA pqt
                        WHERE pqt.toa_nha_id = kt.toa_nha_id
                          AND pqt.nguoi_dung_id = ?
                    )
                      AND (CAST(? AS BIGINT) IS NULL OR kt.toa_nha_id = ?)
                      AND (CAST(? AS BIGINT) IS NULL OR kt.id = ?)
                ), hop_dong_theo_ky AS (
                    SELECT DISTINCT ON (kt.id, p.id)
                           kt.id AS ky_id,
                           p.id AS phong_id,
                           hd.id AS hop_dong_id
                    FROM ky_pham_vi kt
                    JOIN PHONG p ON p.toa_nha_id = kt.toa_nha_id
                    JOIN HOP_DONG hd ON hd.phong_id = p.id
                    WHERE hd.trang_thai IN ('HIEU_LUC', 'DA_THANH_LY')
                      AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                          && daterange(kt.ngay_bat_dau, kt.ngay_ket_thuc, '[]')
                    ORDER BY kt.id, p.id,
                             CASE WHEN hd.trang_thai = 'HIEU_LUC' THEN 0 ELSE 1 END,
                             hd.ngay_bat_dau DESC, hd.id DESC
                )
                SELECT kt.id AS ky_id,
                       kt.nam,
                       kt.thang,
                       kt.ngay_bat_dau,
                       kt.ngay_ket_thuc,
                       toa.id AS toa_nha_id,
                       toa.ma_toa,
                       toa.ten AS ten_toa_nha,
                       p.id AS phong_id,
                       p.so_phong,
                       p.tang,
                       hd.hop_dong_id,
                       dv.id AS dich_vu_id,
                       dv.ten AS ten_dich_vu,
                       dv.don_vi,
                       dv.la_dien,
                       cs.chi_so_dau,
                       cs.chi_so_cuoi,
                       cs.co_thay_cong_to,
                       cs.chi_so_cuoi_cong_to_cu,
                       cs.chi_so_dau_cong_to_moi
                FROM ky_pham_vi kt
                JOIN hop_dong_theo_ky hd ON hd.ky_id = kt.id
                JOIN PHONG p ON p.id = hd.phong_id
                JOIN TOA_NHA toa ON toa.id = p.toa_nha_id
                JOIN HOP_DONG_DICH_VU hddv ON hddv.hop_dong_id = hd.hop_dong_id
                JOIN DICH_VU dv ON dv.id = hddv.dich_vu_id
                LEFT JOIN CHI_SO_DICH_VU cs
                       ON cs.ky_id = kt.id
                      AND cs.phong_id = p.id
                      AND cs.dich_vu_id = dv.id
                WHERE (CAST(? AS BIGINT) IS NULL OR p.id = ?)
                  AND dv.cach_tinh = 'THEO_CHI_SO'
                  AND dv.dang_su_dung = TRUE
                ORDER BY kt.ngay_bat_dau, kt.id, p.tang, p.so_phong, dv.la_dien DESC, dv.id
                """;
        return jdbcTemplate.query(
                sql,
                (resultSet, rowNum) -> new KhoanTieuThuBaoCao(
                        resultSet.getLong("ky_id"),
                        resultSet.getInt("nam"),
                        resultSet.getInt("thang"),
                        resultSet.getObject("ngay_bat_dau", java.time.LocalDate.class),
                        resultSet.getObject("ngay_ket_thuc", java.time.LocalDate.class),
                        resultSet.getLong("toa_nha_id"),
                        resultSet.getString("ma_toa"),
                        resultSet.getString("ten_toa_nha"),
                        resultSet.getLong("phong_id"),
                        resultSet.getString("so_phong"),
                        resultSet.getInt("tang"),
                        resultSet.getLong("hop_dong_id"),
                        resultSet.getLong("dich_vu_id"),
                        resultSet.getString("ten_dich_vu"),
                        resultSet.getString("don_vi"),
                        resultSet.getBoolean("la_dien"),
                        resultSet.getBigDecimal("chi_so_dau"),
                        resultSet.getBigDecimal("chi_so_cuoi"),
                        resultSet.getBigDecimal("chi_so_cuoi_cong_to_cu"),
                        resultSet.getBigDecimal("chi_so_dau_cong_to_moi"),
                        resultSet.getBoolean("co_thay_cong_to")
                ),
                nguoiDungId,
                toaNhaId,
                toaNhaId,
                kyId,
                kyId,
                phongId,
                phongId
        );
    }

    public Optional<Long> findToaNhaIdByPhongId(Long phongId) {
        return jdbcTemplate.query(
                        "SELECT toa_nha_id FROM PHONG WHERE id = ?",
                        (resultSet, rowNum) -> resultSet.getLong("toa_nha_id"),
                        phongId
                )
                .stream()
                .findFirst();
    }

    public Optional<Long> findToaNhaIdByKyId(Long kyId) {
        return jdbcTemplate.query(
                        "SELECT toa_nha_id FROM KY_THANH_TOAN WHERE id = ?",
                        (resultSet, rowNum) -> resultSet.getLong("toa_nha_id"),
                        kyId
                )
                .stream()
                .findFirst();
    }

    public boolean xacNhanPhanQuyenToa(Long nguoiDungId, Long toaNhaId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM PHAN_QUYEN_TOA WHERE nguoi_dung_id = ? AND toa_nha_id = ?",
                Integer.class,
                nguoiDungId,
                toaNhaId
        );
        return count != null && count > 0;
    }
}
