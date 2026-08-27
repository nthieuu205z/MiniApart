package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class DichVuRepository {
    private final JdbcTemplate jdbcTemplate;

    public DichVuRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DichVu> findByToaNhaId(Long toaNhaId) {
        return jdbcTemplate.query(
                cauLenhDichVuCoBan() + " WHERE toa_nha_id = ? ORDER BY ten, id",
                (resultSet, rowNum) -> mapDichVu(resultSet),
                toaNhaId
        );
    }

    public Optional<DichVu> findByIdAndToaNhaId(Long id, Long toaNhaId) {
        return jdbcTemplate.query(
                        cauLenhDichVuCoBan() + " WHERE id = ? AND toa_nha_id = ?",
                        (resultSet, rowNum) -> mapDichVu(resultSet),
                        id,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    public Optional<DichVu> findById(Long id) {
        return jdbcTemplate.query(
                        cauLenhDichVuCoBan() + " WHERE id = ?",
                        (resultSet, rowNum) -> mapDichVu(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public Long insert(DichVu dichVu) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO DICH_VU (toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                dichVu.toaNhaId(),
                dichVu.ten(),
                dichVu.cachTinh().name(),
                dichVu.cheDoGia().name(),
                dichVu.donVi(),
                dichVu.laDien(),
                dichVu.dangSuDung()
        );
    }

    public void update(DichVu dichVu) {
        jdbcTemplate.update(
                """
                        UPDATE DICH_VU
                        SET ten = ?, cach_tinh = ?, don_vi = ?, la_dien = ?
                        WHERE id = ? AND toa_nha_id = ?
                        """,
                dichVu.ten(),
                dichVu.cachTinh().name(),
                dichVu.donVi(),
                dichVu.laDien(),
                dichVu.id(),
                dichVu.toaNhaId()
        );
    }

    public void updateTrangThai(Long id, Long toaNhaId, boolean dangSuDung) {
        jdbcTemplate.update(
                """
                        UPDATE DICH_VU
                        SET dang_su_dung = ?
                        WHERE id = ? AND toa_nha_id = ?
                        """,
                dangSuDung,
                id,
                toaNhaId
        );
    }

    private String cauLenhDichVuCoBan() {
        return """
                SELECT id, toa_nha_id, ten, cach_tinh, che_do_gia, don_vi, la_dien, dang_su_dung
                FROM DICH_VU
                """;
    }

    private DichVu mapDichVu(ResultSet resultSet) throws SQLException {
        return new DichVu(
                resultSet.getLong("id"),
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("ten"),
                CachTinh.valueOf(resultSet.getString("cach_tinh")),
                CheDoGia.valueOf(resultSet.getString("che_do_gia")),
                resultSet.getString("don_vi"),
                resultSet.getBoolean("la_dien"),
                resultSet.getBoolean("dang_su_dung")
        );
    }
}
