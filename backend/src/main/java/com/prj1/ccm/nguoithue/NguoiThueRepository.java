package com.prj1.ccm.nguoithue;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
class NguoiThueRepository {
    private final JdbcTemplate jdbcTemplate;

    NguoiThueRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<NguoiThue> findAll() {
        return jdbcTemplate.query(
                cauLenhCoBan() + " ORDER BY ho_ten, id",
                (resultSet, rowNum) -> mapNguoiThue(resultSet)
        );
    }

    public List<NguoiThue> search(String q) {
        String tenPattern = "%" + q.trim().toLowerCase() + "%";
        String soDienThoaiPattern = "%" + q.replaceAll("\\s+", "") + "%";
        return jdbcTemplate.query(
                cauLenhCoBan()
                        + """
                           WHERE LOWER(ho_ten) LIKE ?
                              OR so_dien_thoai LIKE ?
                           ORDER BY ho_ten, id
                           """,
                (resultSet, rowNum) -> mapNguoiThue(resultSet),
                tenPattern,
                soDienThoaiPattern
        );
    }

    public Optional<NguoiThue> findById(Long id) {
        return jdbcTemplate.query(
                        cauLenhCoBan() + " WHERE id = ?",
                        (resultSet, rowNum) -> mapNguoiThue(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public Long insert(NguoiThue nguoiThue) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_THUE(ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru)
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                nguoiThue.hoTen(),
                java.sql.Date.valueOf(nguoiThue.ngaySinh()),
                nguoiThue.soDienThoai(),
                nguoiThue.soGiayTo(),
                nguoiThue.queQuan(),
                nguoiThue.trangThaiLuuTru()
        );
    }

    public void update(NguoiThue nguoiThue) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_THUE
                        SET ho_ten = ?,
                            ngay_sinh = ?,
                            so_dien_thoai = ?,
                            so_giay_to = ?,
                            que_quan = ?
                        WHERE id = ?
                        """,
                nguoiThue.hoTen(),
                java.sql.Date.valueOf(nguoiThue.ngaySinh()),
                nguoiThue.soDienThoai(),
                nguoiThue.soGiayTo(),
                nguoiThue.queQuan(),
                nguoiThue.id()
        );
    }

    public boolean existsBySoGiayToExceptId(String soGiayTo, Long nguoiThueId) {
        Integer soLuong = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM NGUOI_THUE
                        WHERE so_giay_to = ?
                          AND (? IS NULL OR id <> ?)
                        """,
                Integer.class,
                soGiayTo,
                nguoiThueId,
                nguoiThueId
        );
        return soLuong != null && soLuong > 0;
    }

    private String cauLenhCoBan() {
        return """
                SELECT id, ho_ten, ngay_sinh, so_dien_thoai, so_giay_to, que_quan, trang_thai_luu_tru
                FROM NGUOI_THUE
                """;
    }

    private NguoiThue mapNguoiThue(ResultSet resultSet) throws SQLException {
        LocalDate ngaySinh = resultSet.getDate("ngay_sinh").toLocalDate();
        return new NguoiThue(
                resultSet.getLong("id"),
                resultSet.getString("ho_ten"),
                ngaySinh,
                resultSet.getString("so_dien_thoai"),
                resultSet.getString("so_giay_to"),
                resultSet.getString("que_quan"),
                resultSet.getString("trang_thai_luu_tru")
        );
    }
}
