package com.prj1.ccm.nguoithue;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class NguoiThueRepository {
    private final JdbcTemplate jdbcTemplate;

    public NguoiThueRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<NguoiThue> findAllTrongPhamVi(Long nguoiDungId) {
        return jdbcTemplate.query(
                cauLenhCoBan() + dieuKienNguoiThueTrongPhamVi() + " ORDER BY nt.ho_ten, nt.id",
                (resultSet, rowNum) -> mapNguoiThue(resultSet),
                nguoiDungId
        );
    }

    public List<NguoiThue> searchTrongPhamVi(String q, Long nguoiDungId) {
        String tenPattern = "%" + q.trim().toLowerCase() + "%";
        String soDienThoaiPattern = "%" + q.replaceAll("\\s+", "") + "%";
        return jdbcTemplate.query(
                cauLenhCoBan()
                        + dieuKienNguoiThueTrongPhamVi()
                        + """
                           AND (LOWER(nt.ho_ten) LIKE ?
                                OR nt.so_dien_thoai LIKE ?)
                           ORDER BY nt.ho_ten, nt.id
                           """,
                (resultSet, rowNum) -> mapNguoiThue(resultSet),
                nguoiDungId,
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

    public boolean coNguoiThueTrongPhamVi(Long nguoiDungId, Long nguoiThueId) {
        Boolean trongPhamVi = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                                   SELECT 1
                                   FROM NGUOI_THUE nt
                                   WHERE nt.id = ?
                               )
                               AND (
                                   NOT EXISTS (
                                       SELECT 1
                                       FROM HOP_DONG hd_chua_gan
                                       WHERE hd_chua_gan.nguoi_thue_id = ?
                                   )
                                   OR EXISTS (
                                       SELECT 1
                                       FROM HOP_DONG hd
                                       JOIN PHONG p ON p.id = hd.phong_id
                                       JOIN PHAN_QUYEN_TOA pqt ON pqt.toa_nha_id = p.toa_nha_id
                                       WHERE hd.nguoi_thue_id = ?
                                         AND pqt.nguoi_dung_id = ?
                                   )
                               )
                        """,
                Boolean.class,
                nguoiThueId,
                nguoiThueId,
                nguoiThueId,
                nguoiDungId
        );
        return Boolean.TRUE.equals(trongPhamVi);
    }

    public boolean coNguoiThueTrongToaDuocPhanCong(Long nguoiDungId, Long nguoiThueId) {
        Boolean trongToaDuocPhanCong = jdbcTemplate.queryForObject(
                """
                        SELECT EXISTS (
                            SELECT 1
                            FROM HOP_DONG hd
                            JOIN PHONG p ON p.id = hd.phong_id
                            JOIN PHAN_QUYEN_TOA pqt ON pqt.toa_nha_id = p.toa_nha_id
                            WHERE hd.nguoi_thue_id = ?
                              AND pqt.nguoi_dung_id = ?
                        )
                        """,
                Boolean.class,
                nguoiThueId,
                nguoiDungId
        );
        return Boolean.TRUE.equals(trongToaDuocPhanCong);
    }

    private String cauLenhCoBan() {
        return """
                SELECT nt.id, nt.ho_ten, nt.ngay_sinh, nt.so_dien_thoai, nt.so_giay_to, nt.que_quan, nt.trang_thai_luu_tru
                FROM NGUOI_THUE nt
                """;
    }

    private String dieuKienNguoiThueTrongPhamVi() {
        return """
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM HOP_DONG hd_chua_gan
                    WHERE hd_chua_gan.nguoi_thue_id = nt.id
                )
                OR EXISTS (
                    SELECT 1
                    FROM HOP_DONG hd
                    JOIN PHONG p ON p.id = hd.phong_id
                    JOIN PHAN_QUYEN_TOA pqt ON pqt.toa_nha_id = p.toa_nha_id
                    WHERE hd.nguoi_thue_id = nt.id
                      AND pqt.nguoi_dung_id = ?
                )
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
