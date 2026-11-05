package com.prj1.ccm.hopdong;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class HopDongPhuLucRepository {
    private final JdbcTemplate jdbcTemplate;

    public HopDongPhuLucRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<HopDongPhuLuc> findByHopDongId(Long hopDongId) {
        String sql = """
                SELECT id, hop_dong_id, so_phu_luc, tieu_de, ngay_lap, ngay_hieu_luc,
                       noi_dung_thay_doi, trang_thai, nguoi_tao_id, tao_luc
                FROM HOP_DONG_PHU_LUC
                WHERE hop_dong_id = ?
                ORDER BY so_phu_luc ASC
                """;
        return jdbcTemplate.query(sql, this::mapRow, hopDongId);
    }

    public Optional<HopDongPhuLuc> findById(Long id) {
        String sql = """
                SELECT id, hop_dong_id, so_phu_luc, tieu_de, ngay_lap, ngay_hieu_luc,
                       noi_dung_thay_doi, trang_thai, nguoi_tao_id, tao_luc
                FROM HOP_DONG_PHU_LUC
                WHERE id = ?
                """;
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, this::mapRow, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public int getNextSoPhuLuc(Long hopDongId) {
        Integer max = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(so_phu_luc), 0) FROM HOP_DONG_PHU_LUC WHERE hop_dong_id = ?",
                Integer.class,
                hopDongId
        );
        return (max != null ? max : 0) + 1;
    }

    public Long insert(
            Long hopDongId,
            int soPhuLuc,
            String tieuDe,
            LocalDate ngayLap,
            LocalDate ngayHieuLuc,
            String noiDungThayDoi,
            String trangThai,
            Long nguoiTaoId
    ) {
        String sql = """
                INSERT INTO HOP_DONG_PHU_LUC (
                    hop_dong_id, so_phu_luc, tieu_de, ngay_lap, ngay_hieu_luc,
                    noi_dung_thay_doi, trang_thai, nguoi_tao_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """;
        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                hopDongId,
                soPhuLuc,
                tieuDe,
                Date.valueOf(ngayLap != null ? ngayLap : LocalDate.now()),
                Date.valueOf(ngayHieuLuc != null ? ngayHieuLuc : LocalDate.now()),
                noiDungThayDoi,
                trangThai != null ? trangThai : "DA_CHOT",
                nguoiTaoId
        );
    }

    private HopDongPhuLuc mapRow(ResultSet rs, int rowNum) throws SQLException {
        Date ngayLap = rs.getDate("ngay_lap");
        Date ngayHieuLuc = rs.getDate("ngay_hieu_luc");
        Timestamp taoLuc = rs.getTimestamp("tao_luc");

        return new HopDongPhuLuc(
                rs.getLong("id"),
                rs.getLong("hop_dong_id"),
                rs.getInt("so_phu_luc"),
                rs.getString("tieu_de"),
                ngayLap != null ? ngayLap.toLocalDate() : null,
                ngayHieuLuc != null ? ngayHieuLuc.toLocalDate() : null,
                rs.getString("noi_dung_thay_doi"),
                rs.getString("trang_thai"),
                rs.getObject("nguoi_tao_id", Long.class),
                taoLuc != null ? taoLuc.toLocalDateTime() : null
        );
    }
}

