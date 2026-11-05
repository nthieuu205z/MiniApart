package com.prj1.ccm.toanha;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class MauHopDongRepository {
    private final JdbcTemplate jdbcTemplate;

    public MauHopDongRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MauHopDong> findAllByToaNhaId(Long toaNhaId) {
        String sql = """
                SELECT id, toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan,
                       nguoi_tao_id, tao_luc, cap_nhat_luc
                FROM MAU_HOP_DONG
                WHERE toa_nha_id = ?
                ORDER BY phien_ban DESC
                """;
        return jdbcTemplate.query(sql, this::mapRow, toaNhaId);
    }

    public Optional<MauHopDong> findPublishedByToaNhaId(Long toaNhaId) {
        String sql = """
                SELECT id, toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan,
                       nguoi_tao_id, tao_luc, cap_nhat_luc
                FROM MAU_HOP_DONG
                WHERE toa_nha_id = ? AND trang_thai = 'PUBLISHED'
                ORDER BY phien_ban DESC
                LIMIT 1
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, this::mapRow, toaNhaId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<MauHopDong> findById(Long id) {
        String sql = """
                SELECT id, toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan,
                       nguoi_tao_id, tao_luc, cap_nhat_luc
                FROM MAU_HOP_DONG
                WHERE id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, this::mapRow, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Long insertNewVersion(Long toaNhaId, YeuCauMauHopDong req, Long nguoiTaoId) {
        Integer maxVersion = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(phien_ban), 0) FROM MAU_HOP_DONG WHERE toa_nha_id = ?",
                Integer.class,
                toaNhaId
        );
        int nextVersion = (maxVersion != null ? maxVersion : 0) + 1;

        String sql = """
                INSERT INTO MAU_HOP_DONG (
                    toa_nha_id, ten_mau, phien_ban, trang_thai, tieu_de, noi_dung_dieu_khoan, nguoi_tao_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                toaNhaId,
                req.tenMau() != null && !req.tenMau().isBlank() ? req.tenMau().trim() : "Mẫu hợp đồng phiên bản " + nextVersion,
                nextVersion,
                req.trangThai() != null ? req.trangThai() : "PUBLISHED",
                req.tieuDe() != null && !req.tieuDe().isBlank() ? req.tieuDe().trim() : "HỢP ĐỒNG THUÊ PHÒNG",
                req.noiDungDieuKhoan(),
                nguoiTaoId
        );
    }

    private MauHopDong mapRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp taoLucTs = rs.getTimestamp("tao_luc");
        Timestamp capNhatLucTs = rs.getTimestamp("cap_nhat_luc");
        return new MauHopDong(
                rs.getLong("id"),
                rs.getLong("toa_nha_id"),
                rs.getString("ten_mau"),
                rs.getInt("phien_ban"),
                rs.getString("trang_thai"),
                rs.getString("tieu_de"),
                rs.getString("noi_dung_dieu_khoan"),
                rs.getObject("nguoi_tao_id") != null ? rs.getLong("nguoi_tao_id") : null,
                taoLucTs != null ? taoLucTs.toLocalDateTime() : null,
                capNhatLucTs != null ? capNhatLucTs.toLocalDateTime() : null
        );
    }
}

