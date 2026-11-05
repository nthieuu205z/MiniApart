package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class BangGiaPhongRepository {
    private final JdbcTemplate jdbcTemplate;

    public BangGiaPhongRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(BangGiaPhong bg) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO BANG_GIA_PHONG (phong_id, dich_vu_id, don_gia, ngay_hieu_luc, nguoi_tao_id)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                bg.phongId(),
                bg.dichVuId(),
                bg.donGia(),
                Date.valueOf(bg.ngayHieuLuc()),
                bg.nguoiTaoId()
        );
    }

    public Optional<BangGiaPhong> findApplicableByPhongIdAndDichVuIdAndNgay(Long phongId, Long dichVuId, LocalDate ngay) {
        return jdbcTemplate.query(
                """
                SELECT id, phong_id, dich_vu_id, don_gia, ngay_hieu_luc, nguoi_tao_id, tao_luc
                FROM BANG_GIA_PHONG
                WHERE phong_id = ? AND dich_vu_id = ? AND ngay_hieu_luc <= ?
                ORDER BY ngay_hieu_luc DESC, id DESC
                LIMIT 1
                """,
                (rs, rowNum) -> mapBangGiaPhong(rs),
                phongId,
                dichVuId,
                Date.valueOf(ngay)
        ).stream().findFirst();
    }

    public List<BangGiaPhong> findByPhongId(Long phongId) {
        return jdbcTemplate.query(
                """
                SELECT id, phong_id, dich_vu_id, don_gia, ngay_hieu_luc, nguoi_tao_id, tao_luc
                FROM BANG_GIA_PHONG
                WHERE phong_id = ?
                ORDER BY dich_vu_id, ngay_hieu_luc DESC, id DESC
                """,
                (rs, rowNum) -> mapBangGiaPhong(rs),
                phongId
        );
    }

    public void delete(Long id) {
        jdbcTemplate.update("DELETE FROM BANG_GIA_PHONG WHERE id = ?", id);
    }

    private BangGiaPhong mapBangGiaPhong(ResultSet rs) throws SQLException {
        return new BangGiaPhong(
                rs.getLong("id"),
                rs.getLong("phong_id"),
                rs.getLong("dich_vu_id"),
                rs.getBigDecimal("don_gia"),
                rs.getObject("ngay_hieu_luc", LocalDate.class),
                rs.getObject("nguoi_tao_id", Long.class),
                rs.getObject("tao_luc", LocalDateTime.class)
        );
    }
}

