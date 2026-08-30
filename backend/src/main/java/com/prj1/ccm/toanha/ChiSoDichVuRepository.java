package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ChiSoDichVuRepository {
    private final JdbcTemplate jdbcTemplate;

    public ChiSoDichVuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DongChiSo> findChoNhap(Long toaNhaId, Long kyId, Long kyTruocId) {
        String chiSoDauSql = kyTruocId == null
                ? "CAST(0 AS NUMERIC(15,2))"
                : "COALESCE(prev.chi_so_cuoi, CAST(0 AS NUMERIC(15,2)))";
        String joinKyTruocSql = kyTruocId == null ? "" : """
                LEFT JOIN CHI_SO_DICH_VU prev
                       ON prev.ky_id = ?
                      AND prev.phong_id = p.id
                      AND prev.dich_vu_id = dv.id
                """;

        List<Object> params = new ArrayList<>();
        if (kyTruocId != null) {
            params.add(kyTruocId);
        }
        params.add(kyId);
        params.add(toaNhaId);

        return jdbcTemplate.query(
                """
                        SELECT DISTINCT
                            p.id AS phong_id,
                            p.so_phong,
                            p.tang,
                            dv.id AS dich_vu_id,
                            dv.ten AS ten_dich_vu,
                            dv.don_vi,
                            %s AS chi_so_dau,
                            cur.id AS chi_so_id,
                            cur.chi_so_cuoi,
                            cur.chi_so_cuoi_cong_to_cu,
                            cur.chi_so_dau_cong_to_moi,
                            COALESCE(cur.co_thay_cong_to, FALSE) AS co_thay_cong_to,
                            EXISTS (
                                SELECT 1
                                FROM XAC_NHAN_CANH_BAO_CHI_SO xac_nhan
                                WHERE xac_nhan.chi_so_dich_vu_id = cur.id
                            ) AS da_xac_nhan_canh_bao,
                            ls.so_ky_lich_su,
                            ls.trung_binh_ba_ky_truoc,
                            (
                                SELECT anh.id
                                FROM ANH_DINH_KEM anh
                                WHERE anh.doi_tuong_loai = 'CHI_SO_DICH_VU'
                                  AND anh.doi_tuong_id = cur.id
                                ORDER BY anh.id DESC
                                LIMIT 1
                            ) AS anh_cong_to_id
                        FROM KY_THANH_TOAN kt
                        JOIN PHONG p ON p.toa_nha_id = kt.toa_nha_id
                        JOIN HOP_DONG hd ON hd.phong_id = p.id
                        JOIN HOP_DONG_DICH_VU hddv ON hddv.hop_dong_id = hd.id
                        JOIN DICH_VU dv ON dv.id = hddv.dich_vu_id
                        LEFT JOIN CHI_SO_DICH_VU cur
                               ON cur.ky_id = kt.id
                              AND cur.phong_id = p.id
                              AND cur.dich_vu_id = dv.id
                        LEFT JOIN LATERAL (
                            SELECT COUNT(*) AS so_ky_lich_su,
                                   AVG(hist.muc_tieu_thu) AS trung_binh_ba_ky_truoc
                            FROM (
                                SELECT CASE
                                           WHEN prev.co_thay_cong_to THEN
                                               (prev.chi_so_cuoi_cong_to_cu - prev.chi_so_dau)
                                               + (prev.chi_so_cuoi - prev.chi_so_dau_cong_to_moi)
                                           ELSE prev.chi_so_cuoi - prev.chi_so_dau
                                       END AS muc_tieu_thu
                                FROM CHI_SO_DICH_VU prev
                                JOIN KY_THANH_TOAN prevkt ON prevkt.id = prev.ky_id
                                WHERE prev.phong_id = p.id
                                  AND prev.dich_vu_id = dv.id
                                  AND prevkt.ngay_bat_dau < kt.ngay_bat_dau
                                  AND prev.chi_so_dau IS NOT NULL
                                  AND prev.chi_so_cuoi IS NOT NULL
                                ORDER BY prevkt.ngay_bat_dau DESC
                                LIMIT 3
                            ) hist
                        ) ls ON TRUE
                        %s
                        WHERE kt.id = ?
                          AND kt.toa_nha_id = ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND dv.cach_tinh = 'THEO_CHI_SO'
                          AND dv.dang_su_dung = TRUE
                          AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                              && daterange(kt.ngay_bat_dau, kt.ngay_ket_thuc, '[]')
                        ORDER BY p.tang, p.so_phong, dv.id
                        """.formatted(chiSoDauSql, joinKyTruocSql),
                (resultSet, rowNum) -> new DongChiSo(
                        resultSet.getLong("phong_id"),
                        resultSet.getString("so_phong"),
                        resultSet.getInt("tang"),
                        resultSet.getLong("dich_vu_id"),
                        resultSet.getString("ten_dich_vu"),
                        resultSet.getString("don_vi"),
                        resultSet.getBigDecimal("chi_so_dau"),
                        getLongOrNull(resultSet, "chi_so_id"),
                        resultSet.getBigDecimal("chi_so_cuoi"),
                        resultSet.getBigDecimal("chi_so_cuoi_cong_to_cu"),
                        resultSet.getBigDecimal("chi_so_dau_cong_to_moi"),
                        resultSet.getBoolean("co_thay_cong_to"),
                        getLongOrNull(resultSet, "anh_cong_to_id"),
                        resultSet.getBoolean("da_xac_nhan_canh_bao"),
                        getLongOrNull(resultSet, "so_ky_lich_su"),
                        resultSet.getBigDecimal("trung_binh_ba_ky_truoc")
                ),
                params.toArray()
        );
    }

    public Optional<BigDecimal> findChiSoCuoi(Long kyId, Long phongId, Long dichVuId) {
        return jdbcTemplate.query(
                        """
                                SELECT chi_so_cuoi
                                FROM CHI_SO_DICH_VU
                                WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?
                                """,
                        (resultSet, rowNum) -> resultSet.getBigDecimal("chi_so_cuoi"),
                        kyId,
                        phongId,
                        dichVuId
                )
                .stream()
                .findFirst();
    }

    public Optional<ChiSoDichVu> findByKyPhongDichVu(Long kyId, Long phongId, Long dichVuId) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi,
                                       chi_so_cuoi_cong_to_cu, chi_so_dau_cong_to_moi, co_thay_cong_to,
                                       nguoi_ghi_id, thoi_diem_ghi
                                FROM CHI_SO_DICH_VU
                                WHERE ky_id = ? AND phong_id = ? AND dich_vu_id = ?
                                """,
                        (resultSet, rowNum) -> mapChiSoDichVu(resultSet),
                        kyId,
                        phongId,
                        dichVuId
                )
                .stream()
                .findFirst();
    }

    public Long upsert(ChiSoDichVu chiSoDichVu) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO CHI_SO_DICH_VU (
                            ky_id, phong_id, dich_vu_id, chi_so_dau, chi_so_cuoi, chi_so_cuoi_cong_to_cu, chi_so_dau_cong_to_moi,
                            co_thay_cong_to, nguoi_ghi_id, thoi_diem_ghi
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT (ky_id, phong_id, dich_vu_id)
                        DO UPDATE SET
                            chi_so_dau = EXCLUDED.chi_so_dau,
                            chi_so_cuoi = EXCLUDED.chi_so_cuoi,
                            chi_so_cuoi_cong_to_cu = EXCLUDED.chi_so_cuoi_cong_to_cu,
                            chi_so_dau_cong_to_moi = EXCLUDED.chi_so_dau_cong_to_moi,
                            co_thay_cong_to = EXCLUDED.co_thay_cong_to,
                            nguoi_ghi_id = EXCLUDED.nguoi_ghi_id,
                            thoi_diem_ghi = EXCLUDED.thoi_diem_ghi
                        RETURNING id
                        """,
                Long.class,
                chiSoDichVu.kyId(),
                chiSoDichVu.phongId(),
                chiSoDichVu.dichVuId(),
                chiSoDichVu.chiSoDau(),
                chiSoDichVu.chiSoCuoi(),
                chiSoDichVu.chiSoCuoiCongToCu(),
                chiSoDichVu.chiSoDauCongToMoi(),
                chiSoDichVu.coThayCongTo(),
                chiSoDichVu.nguoiGhiId(),
                Timestamp.valueOf(chiSoDichVu.thoiDiemGhi())
        );
    }

    public Long capNhat(ChiSoDichVu chiSoDichVu) {
        return jdbcTemplate.queryForObject(
                """
                        UPDATE CHI_SO_DICH_VU
                        SET chi_so_dau = ?,
                            chi_so_cuoi = ?,
                            chi_so_cuoi_cong_to_cu = ?,
                            chi_so_dau_cong_to_moi = ?,
                            co_thay_cong_to = ?
                        WHERE id = ?
                          AND ky_id = ?
                          AND phong_id = ?
                          AND dich_vu_id = ?
                        RETURNING id
                        """,
                Long.class,
                chiSoDichVu.chiSoDau(),
                chiSoDichVu.chiSoCuoi(),
                chiSoDichVu.chiSoCuoiCongToCu(),
                chiSoDichVu.chiSoDauCongToMoi(),
                chiSoDichVu.coThayCongTo(),
                chiSoDichVu.id(),
                chiSoDichVu.kyId(),
                chiSoDichVu.phongId(),
                chiSoDichVu.dichVuId()
        );
    }

    public Long insertXacNhanCanhBao(XacNhanCanhBaoChiSo xacNhanCanhBaoChiSo) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO XAC_NHAN_CANH_BAO_CHI_SO (
                            chi_so_dich_vu_id, nguoi_xac_nhan_id, muc_tieu_thu_ky_nay, trung_binh_ba_ky_truoc, gap_trung_binh, thoi_diem_xac_nhan
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                xacNhanCanhBaoChiSo.chiSoDichVuId(),
                xacNhanCanhBaoChiSo.nguoiXacNhanId(),
                xacNhanCanhBaoChiSo.mucTieuThuKyNay(),
                xacNhanCanhBaoChiSo.trungBinhBaKyTruoc(),
                xacNhanCanhBaoChiSo.gapTrungBinh(),
                Timestamp.valueOf(xacNhanCanhBaoChiSo.thoiDiemXacNhan())
        );
    }

    public Optional<Long> findToaNhaIdByChiSoId(Long chiSoId) {
        return jdbcTemplate.query("""
                        SELECT kt.toa_nha_id
                        FROM CHI_SO_DICH_VU cs
                        JOIN KY_THANH_TOAN kt ON kt.id = cs.ky_id
                        WHERE cs.id = ?
                        """,
                (resultSet, rowNum) -> resultSet.getLong("toa_nha_id"),
                chiSoId
        ).stream().findFirst();
    }

    private ChiSoDichVu mapChiSoDichVu(java.sql.ResultSet resultSet) throws java.sql.SQLException {
        return new ChiSoDichVu(
                resultSet.getLong("id"),
                resultSet.getLong("ky_id"),
                resultSet.getLong("phong_id"),
                resultSet.getLong("dich_vu_id"),
                resultSet.getBigDecimal("chi_so_dau"),
                resultSet.getBigDecimal("chi_so_cuoi"),
                resultSet.getBigDecimal("chi_so_cuoi_cong_to_cu"),
                resultSet.getBigDecimal("chi_so_dau_cong_to_moi"),
                resultSet.getBoolean("co_thay_cong_to"),
                resultSet.getLong("nguoi_ghi_id"),
                resultSet.getTimestamp("thoi_diem_ghi").toLocalDateTime()
        );
    }

    private Long getLongOrNull(java.sql.ResultSet resultSet, String column) throws java.sql.SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }

    record DongChiSo(
            Long phongId,
            String soPhong,
            int tang,
            Long dichVuId,
            String tenDichVu,
            String donVi,
            BigDecimal chiSoDau,
            Long chiSoId,
            BigDecimal chiSoCuoi,
            BigDecimal chiSoCuoiCongToCu,
            BigDecimal chiSoDauCongToMoi,
            boolean coThayCongTo,
            Long anhCongToId,
            boolean daXacNhanCanhBao,
            Long soKyLichSu,
            BigDecimal trungBinhBaKyTruoc
    ) {
    }

    record XacNhanCanhBaoChiSo(
            Long chiSoDichVuId,
            Long nguoiXacNhanId,
            BigDecimal mucTieuThuKyNay,
            BigDecimal trungBinhBaKyTruoc,
            BigDecimal gapTrungBinh,
            java.time.LocalDateTime thoiDiemXacNhan
    ) {
    }
}
