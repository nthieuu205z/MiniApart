package com.prj1.ccm.toanha;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ToaNhaRepository {
    private final JdbcTemplate jdbcTemplate;

    public ToaNhaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ToaNha> findAllVisibleByNguoiDung(NguoiDung nguoiDung) {
        if (nguoiDung.vaiTro() == VaiTro.QTHT) {
            return jdbcTemplate.query(
                    cauLenhToaNhaCoBan() + " ORDER BY id",
                    (resultSet, rowNum) -> mapToaNha(resultSet)
            );
        }

        return jdbcTemplate.query(
                cauLenhToaNhaCoBan()
                        + """
                           AND EXISTS (
                               SELECT 1
                               FROM PHAN_QUYEN_TOA p
                               WHERE p.toa_nha_id = TOA_NHA.id
                                 AND p.nguoi_dung_id = ?
                           )
                           ORDER BY id
                           """,
                (resultSet, rowNum) -> mapToaNha(resultSet),
                nguoiDung.id()
        );
    }

    public Optional<ToaNha> findById(Long id) {
        return jdbcTemplate.query(
                        cauLenhToaNhaCoBan() + " AND id = ?",
                        (resultSet, rowNum) -> mapToaNha(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public boolean existsByMaToa(String maToa) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM TOA_NHA
                        WHERE ma_toa = ?
                        """,
                Integer.class,
                maToa
        );
        return dem != null && dem > 0;
    }

    public boolean existsByMaToaExceptId(String maToa, Long toaNhaId) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM TOA_NHA
                        WHERE ma_toa = ?
                          AND id <> ?
                        """,
                Integer.class,
                maToa,
                toaNhaId
        );
        return dem != null && dem > 0;
    }

    public Long insert(ToaNha toaNha) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO TOA_NHA (
                            ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                toaNha.maToa(),
                toaNha.ten(),
                toaNha.diaChi(),
                toaNha.soTang(),
                toaNha.ngayChotSo(),
                toaNha.soNgayHanTt(),
                toaNha.tkNganHang(),
                toaNha.nguongThatThoat()
        );
    }

    public void update(ToaNha toaNha) {
        jdbcTemplate.update(
                """
                        UPDATE TOA_NHA
                        SET ma_toa = ?,
                            ten = ?,
                            dia_chi = ?,
                            so_tang = ?,
                            ngay_chot_so = ?,
                            so_ngay_han_tt = ?,
                            tk_ngan_hang = ?,
                            nguong_that_thoat = ?
                        WHERE id = ?
                        """,
                toaNha.maToa(),
                toaNha.ten(),
                toaNha.diaChi(),
                toaNha.soTang(),
                toaNha.ngayChotSo(),
                toaNha.soNgayHanTt(),
                toaNha.tkNganHang(),
                toaNha.nguongThatThoat(),
                toaNha.id()
        );
    }

    public void themPhanQuyenToa(Long nguoiDungId, Long toaNhaId) {
        jdbcTemplate.update(
                """
                        INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id, toa_nha_id)
                        VALUES (?, ?)
                        """,
                nguoiDungId,
                toaNhaId
        );
    }

    public boolean existsPhanQuyenToa(Long nguoiDungId, Long toaNhaId) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM PHAN_QUYEN_TOA
                        WHERE nguoi_dung_id = ? AND toa_nha_id = ?
                        """,
                Integer.class,
                nguoiDungId,
                toaNhaId
        );
        return dem != null && dem > 0;
    }

    private String cauLenhToaNhaCoBan() {
        return """
                SELECT id, ma_toa, ten, dia_chi, so_tang, ngay_chot_so, so_ngay_han_tt, tk_ngan_hang, nguong_that_thoat
                FROM TOA_NHA
                WHERE 1 = 1
                """;
    }

    private ToaNha mapToaNha(java.sql.ResultSet resultSet) throws java.sql.SQLException {
        return new ToaNha(
                resultSet.getLong("id"),
                resultSet.getString("ma_toa"),
                resultSet.getString("ten"),
                resultSet.getString("dia_chi"),
                resultSet.getInt("so_tang"),
                resultSet.getInt("ngay_chot_so"),
                resultSet.getInt("so_ngay_han_tt"),
                resultSet.getString("tk_ngan_hang"),
                resultSet.getBigDecimal("nguong_that_thoat")
        );
    }
}
