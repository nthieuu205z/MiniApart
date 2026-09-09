package com.prj1.ccm.suachua;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class YeuCauSuaChuaRepository {
    private final JdbcTemplate jdbcTemplate;

    public YeuCauSuaChuaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(YeuCauSuaChua yeuCau) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO YEU_CAU_SUA_CHUA(
                            phong_id, hop_dong_id, nguoi_tao_id, hang_muc, mo_ta, muc_do, trang_thai, tao_luc
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                yeuCau.phongId(),
                yeuCau.hopDongId(),
                yeuCau.nguoiTaoId(),
                yeuCau.hangMuc(),
                yeuCau.moTa(),
                yeuCau.mucDo().name(),
                yeuCau.trangThai().name(),
                Timestamp.from(yeuCau.taoLuc())
        );
    }

    public Optional<YeuCauSuaChuaView> findById(Long id) {
        return jdbcTemplate.query(cauLenhView() + " WHERE yc.id = ?",
                        (resultSet, rowNum) -> mapView(resultSet), id)
                .stream()
                .findFirst();
    }

    public Optional<YeuCauSuaChuaView> findByIdForUpdate(Long id) {
        return jdbcTemplate.query(cauLenhView() + " WHERE yc.id = ? FOR UPDATE OF yc",
                        (resultSet, rowNum) -> mapView(resultSet), id)
                .stream()
                .findFirst();
    }

    public List<YeuCauSuaChuaView> findByToaNhaId(Long toaNhaId, TrangThaiYeuCau trangThai) {
        String sql = cauLenhView() + " WHERE p.toa_nha_id = ?";
        if (trangThai != null) {
            sql += " AND yc.trang_thai = ?";
        }
        sql += " ORDER BY yc.tao_luc DESC, yc.id DESC";
        return trangThai == null
                ? jdbcTemplate.query(sql, (resultSet, rowNum) -> mapView(resultSet), toaNhaId)
                : jdbcTemplate.query(sql, (resultSet, rowNum) -> mapView(resultSet), toaNhaId, trangThai.name());
    }

    public List<YeuCauSuaChuaView> findByNguoiQuanLy(Long nguoiDungId, TrangThaiYeuCau trangThai) {
        String sql = cauLenhView() + """
                JOIN PHAN_QUYEN_TOA pqt
                  ON pqt.toa_nha_id = p.toa_nha_id
                 AND pqt.nguoi_dung_id = ?
                WHERE 1 = 1
                """;
        if (trangThai != null) {
            sql += " AND yc.trang_thai = ?";
        }
        sql += " ORDER BY yc.tao_luc DESC, yc.id DESC";
        return trangThai == null
                ? jdbcTemplate.query(sql, (resultSet, rowNum) -> mapView(resultSet), nguoiDungId)
                : jdbcTemplate.query(sql, (resultSet, rowNum) -> mapView(resultSet), nguoiDungId, trangThai.name());
    }

    public List<YeuCauSuaChuaView> findLichSuByNguoiQuanLy(
            Long nguoiDungId,
            Long toaNhaId,
            Long phongId,
            String hangMuc
    ) {
        StringBuilder sql = new StringBuilder(cauLenhView() + """
                JOIN PHAN_QUYEN_TOA pqt
                  ON pqt.toa_nha_id = p.toa_nha_id
                 AND pqt.nguoi_dung_id = ?
                WHERE 1 = 1
                """);
        List<Object> thamSo = new ArrayList<>(List.of(nguoiDungId));
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            thamSo.add(toaNhaId);
        }
        if (phongId != null) {
            sql.append(" AND yc.phong_id = ?");
            thamSo.add(phongId);
        }
        if (hangMuc != null) {
            sql.append(" AND yc.hang_muc = ?");
            thamSo.add(hangMuc);
        }
        sql.append(" ORDER BY yc.tao_luc DESC, yc.id DESC");
        return jdbcTemplate.query(sql.toString(), (resultSet, rowNum) -> mapView(resultSet), thamSo.toArray());
    }

    public List<YeuCauSuaChuaView> findByNguoiXuLy(Long nguoiXuLyId) {
        return jdbcTemplate.query(
                cauLenhView() + """
                        WHERE yc.nguoi_xu_ly_id = ?
                          AND yc.trang_thai NOT IN ('DA_DONG', 'DA_HUY')
                        ORDER BY yc.tao_luc DESC, yc.id DESC
                        """,
                (resultSet, rowNum) -> mapView(resultSet), nguoiXuLyId
        );
    }

    public List<Long> findAnhIds(Long yeuCauId) {
        return jdbcTemplate.queryForList(
                """
                        SELECT id
                        FROM ANH_DINH_KEM
                        WHERE doi_tuong_loai = 'YEU_CAU_SUA_CHUA' AND doi_tuong_id = ?
                        ORDER BY id
                        """,
                Long.class,
                yeuCauId
        );
    }

    public int capNhatTiepNhan(
            Long yeuCauId,
            Long nguoiDungId,
            Instant thoiDiem,
            TrangThaiYeuCau trangThaiCu
    ) {
        return jdbcTemplate.update(
                """
                        UPDATE YEU_CAU_SUA_CHUA
                        SET trang_thai = 'DA_TIEP_NHAN', nguoi_tiep_nhan_id = ?, tiep_nhan_luc = ?
                        WHERE id = ? AND trang_thai = ?
                        """,
                nguoiDungId, Timestamp.from(thoiDiem), yeuCauId, trangThaiCu.name()
        );
    }

    public int capNhatPhanCong(
            Long yeuCauId,
            Long nguoiXuLyId,
            Instant thoiDiem,
            TrangThaiYeuCau trangThaiCu
    ) {
        return jdbcTemplate.update(
                """
                        UPDATE YEU_CAU_SUA_CHUA
                        SET trang_thai = 'DA_PHAN_CONG', nguoi_xu_ly_id = ?, phan_cong_luc = ?
                        WHERE id = ? AND trang_thai = ?
                        """,
                nguoiXuLyId, Timestamp.from(thoiDiem), yeuCauId, trangThaiCu.name()
        );
    }

    public int capNhatTrangThai(Long yeuCauId, TrangThaiYeuCau trangThaiMoi, TrangThaiYeuCau trangThaiCu) {
        return jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET trang_thai = ? WHERE id = ? AND trang_thai = ?",
                trangThaiMoi.name(), yeuCauId, trangThaiCu.name()
        );
    }

    public int capNhatChoXacNhan(Long yeuCauId, Instant thoiDiem, TrangThaiYeuCau trangThaiCu) {
        return jdbcTemplate.update(
                """
                        UPDATE YEU_CAU_SUA_CHUA
                        SET trang_thai = 'CHO_XAC_NHAN', cho_xac_nhan_luc = ?
                        WHERE id = ? AND trang_thai = ?
                        """,
                Timestamp.from(thoiDiem), yeuCauId, trangThaiCu.name()
        );
    }

    public int capNhatHuy(Long yeuCauId, String lyDo, TrangThaiYeuCau trangThaiCu) {
        return jdbcTemplate.update(
                "UPDATE YEU_CAU_SUA_CHUA SET trang_thai = 'DA_HUY', ly_do_huy = ? WHERE id = ? AND trang_thai = ?",
                lyDo, yeuCauId, trangThaiCu.name()
        );
    }

    public int capNhatChiPhi(
            Long yeuCauId,
            BigDecimal chiPhi,
            BenChiuChiPhi benChiuChiPhi,
            TrangThaiYeuCau trangThaiCu
    ) {
        return jdbcTemplate.update(
                """
                        UPDATE YEU_CAU_SUA_CHUA
                        SET chi_phi = ?, ben_chiu_chi_phi = ?
                        WHERE id = ? AND trang_thai = ?
                        """,
                chiPhi,
                benChiuChiPhi.name(),
                yeuCauId,
                trangThaiCu.name()
        );
    }

    public boolean coHopDongHieuLucCuaNguoiThue(Long phongId, Long nguoiThueId, LocalDate ngay) {
        return timHopDongHieuLucCuaNguoiThue(phongId, nguoiThueId, ngay).isPresent();
    }

    public Optional<Long> timHopDongHieuLucCuaNguoiThue(Long phongId, Long nguoiThueId, LocalDate ngay) {
        return jdbcTemplate.query(
                """
                        SELECT id
                        FROM HOP_DONG
                        WHERE phong_id = ?
                          AND nguoi_thue_id = ?
                          AND trang_thai = 'HIEU_LUC'
                          AND ngay_bat_dau <= ?
                          AND ngay_ket_thuc >= ?
                        ORDER BY ngay_bat_dau DESC, id DESC
                        LIMIT 1
                        """,
                (resultSet, rowNum) -> resultSet.getLong("id"),
                phongId,
                nguoiThueId,
                java.sql.Date.valueOf(ngay),
                java.sql.Date.valueOf(ngay)
        ).stream().findFirst();
    }

    public Optional<Long> timHopDongHieuLucCuaPhong(Long phongId, LocalDate ngay) {
        return jdbcTemplate.query(
                """
                        SELECT id
                        FROM HOP_DONG
                        WHERE phong_id = ?
                          AND trang_thai = 'HIEU_LUC'
                          AND ngay_bat_dau <= ?
                          AND ngay_ket_thuc >= ?
                        ORDER BY ngay_bat_dau DESC, id DESC
                        LIMIT 1
                        """,
                (resultSet, rowNum) -> resultSet.getLong("id"),
                phongId,
                java.sql.Date.valueOf(ngay),
                java.sql.Date.valueOf(ngay)
        ).stream().findFirst();
    }

    public Optional<PhamViAnh> findPhamViAnh(Long yeuCauId) {
        return jdbcTemplate.query(
                        """
                                SELECT yc.phong_id, p.toa_nha_id, yc.nguoi_tao_id,
                                       yc.nguoi_xu_ly_id
                                FROM YEU_CAU_SUA_CHUA yc
                                JOIN PHONG p ON p.id = yc.phong_id
                                WHERE yc.id = ?
                                """,
                        (resultSet, rowNum) -> new PhamViAnh(
                                resultSet.getLong("phong_id"),
                                resultSet.getLong("toa_nha_id"),
                                resultSet.getLong("nguoi_tao_id"),
                                layLongNullable(resultSet, "nguoi_xu_ly_id")
                        ),
                        yeuCauId
                )
                .stream()
                .findFirst();
    }

    private YeuCauSuaChuaView mapView(ResultSet resultSet) throws SQLException {
        return new YeuCauSuaChuaView(
                new YeuCauSuaChua(
                        resultSet.getLong("id"),
                        resultSet.getString("ma_yeu_cau"),
                        resultSet.getLong("phong_id"),
                        layLongNullable(resultSet, "hop_dong_id"),
                        resultSet.getLong("nguoi_tao_id"),
                        resultSet.getString("hang_muc"),
                        resultSet.getString("mo_ta"),
                        MucDo.valueOf(resultSet.getString("muc_do")),
                        TrangThaiYeuCau.valueOf(resultSet.getString("trang_thai")),
                        layLongNullable(resultSet, "nguoi_tiep_nhan_id"),
                        layInstantNullable(resultSet, "tiep_nhan_luc"),
                        layLongNullable(resultSet, "nguoi_xu_ly_id"),
                        layInstantNullable(resultSet, "phan_cong_luc"),
                        resultSet.getBigDecimal("chi_phi"),
                        layBenChiuChiPhi(resultSet.getString("ben_chiu_chi_phi")),
                        layInstantNullable(resultSet, "cho_xac_nhan_luc"),
                        resultSet.getString("ly_do_huy"),
                        resultSet.getTimestamp("tao_luc").toInstant()
                ),
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("toa_nha"),
                resultSet.getString("so_phong"),
                resultSet.getInt("tang"),
                resultSet.getString("so_dien_thoai_lien_he")
        );
    }

    private String cauLenhView() {
        return """
                SELECT yc.id, yc.ma_yeu_cau, yc.phong_id, yc.hop_dong_id, yc.nguoi_tao_id,
                       yc.hang_muc, yc.mo_ta, yc.muc_do, yc.trang_thai,
                       yc.nguoi_tiep_nhan_id, yc.tiep_nhan_luc,
                       yc.nguoi_xu_ly_id, yc.phan_cong_luc, yc.chi_phi,
                       yc.ben_chiu_chi_phi, yc.cho_xac_nhan_luc, yc.ly_do_huy, yc.tao_luc,
                       p.toa_nha_id, tn.ten AS toa_nha, p.so_phong, p.tang,
                       nguoi_thue.so_dien_thoai AS so_dien_thoai_lien_he
                FROM YEU_CAU_SUA_CHUA yc
                JOIN PHONG p ON p.id = yc.phong_id
                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                LEFT JOIN LATERAL (
                    SELECT nt.so_dien_thoai
                    FROM HOP_DONG hd
                    JOIN NGUOI_THUE nt ON nt.id = hd.nguoi_thue_id
                    WHERE hd.phong_id = yc.phong_id
                      AND hd.trang_thai = 'HIEU_LUC'
                    ORDER BY hd.ngay_bat_dau DESC, hd.id DESC
                    LIMIT 1
                ) nguoi_thue ON TRUE
                """;
    }

    private Long layLongNullable(ResultSet resultSet, String column) throws SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }

    private Instant layInstantNullable(ResultSet resultSet, String column) throws SQLException {
        Timestamp value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private BenChiuChiPhi layBenChiuChiPhi(String value) {
        return value == null ? null : BenChiuChiPhi.valueOf(value);
    }

    public record YeuCauSuaChuaView(
            YeuCauSuaChua yeuCau,
            Long toaNhaId,
            String toaNha,
            String soPhong,
            int tang,
            String soDienThoaiLienHe
    ) {
    }

    public record PhamViAnh(
            Long phongId,
            Long toaNhaId,
            Long nguoiTaoId,
            Long nguoiXuLyId
    ) {
    }
}
