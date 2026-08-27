package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class BangGiaRepository {
    private final JdbcTemplate jdbcTemplate;

    public BangGiaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BangGia> findByDichVuId(Long dichVuId) {
        return jdbcTemplate.query(
                """
                        SELECT id, dich_vu_id, don_gia, ngay_hieu_luc
                        FROM BANG_GIA
                        WHERE dich_vu_id = ?
                        ORDER BY ngay_hieu_luc DESC, id DESC
                        """,
                (resultSet, rowNum) -> mapBangGia(resultSet),
                dichVuId
        );
    }

    public Optional<BangGia> findApplicableByDichVuIdAndNgay(Long dichVuId, LocalDate ngay) {
        return jdbcTemplate.query(
                        """
                                SELECT id, dich_vu_id, don_gia, ngay_hieu_luc
                                FROM BANG_GIA
                                WHERE dich_vu_id = ? AND ngay_hieu_luc <= ?
                                ORDER BY ngay_hieu_luc DESC, id DESC
                                LIMIT 1
                                """,
                        (resultSet, rowNum) -> mapBangGia(resultSet),
                        dichVuId,
                        Date.valueOf(ngay)
                )
                .stream()
                .findFirst();
    }

    public Long insert(BangGia bangGia) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO BANG_GIA (dich_vu_id, don_gia, ngay_hieu_luc)
                        VALUES (?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                bangGia.dichVuId(),
                bangGia.donGia(),
                Date.valueOf(bangGia.ngayHieuLuc())
        );
    }

    public BangGia findById(Long id) {
        return jdbcTemplate.queryForObject(
                """
                        SELECT id, dich_vu_id, don_gia, ngay_hieu_luc
                        FROM BANG_GIA
                        WHERE id = ?
                        """,
                (resultSet, rowNum) -> mapBangGia(resultSet),
                id
        );
    }

    private BangGia mapBangGia(ResultSet resultSet) throws SQLException {
        return new BangGia(
                resultSet.getLong("id"),
                resultSet.getLong("dich_vu_id"),
                resultSet.getBigDecimal("don_gia"),
                resultSet.getObject("ngay_hieu_luc", LocalDate.class)
        );
    }
}
