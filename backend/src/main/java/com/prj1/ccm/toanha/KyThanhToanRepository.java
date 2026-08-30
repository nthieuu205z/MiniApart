package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public class KyThanhToanRepository {
    private final JdbcTemplate jdbcTemplate;

    public KyThanhToanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(KyThanhToan kyThanhToan) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO KY_THANH_TOAN (
                            toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                kyThanhToan.toaNhaId(),
                kyThanhToan.nam(),
                kyThanhToan.thang(),
                kyThanhToan.ngayBatDau(),
                kyThanhToan.ngayKetThuc(),
                kyThanhToan.trangThai().name()
        );
    }

    public List<KyThanhToan> findByToaNhaId(Long toaNhaId) {
        return jdbcTemplate.query(
                """
                        SELECT id, toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ?
                        ORDER BY nam DESC, thang DESC, id DESC
                        """,
                (resultSet, rowNum) -> new KyThanhToan(
                        resultSet.getLong("id"),
                        resultSet.getLong("toa_nha_id"),
                        resultSet.getInt("nam"),
                        resultSet.getInt("thang"),
                        resultSet.getObject("ngay_bat_dau", java.time.LocalDate.class),
                        resultSet.getObject("ngay_ket_thuc", java.time.LocalDate.class),
                        TrangThaiKy.valueOf(resultSet.getString("trang_thai"))
                ),
                toaNhaId
        );
    }

    public Optional<KyThanhToan> findByIdAndToaNhaId(Long id, Long toaNhaId) {
        return jdbcTemplate.query(
                        """
                                SELECT id, toa_nha_id, nam, thang, ngay_bat_dau, ngay_ket_thuc, trang_thai
                                FROM KY_THANH_TOAN
                                WHERE id = ? AND toa_nha_id = ?
                                """,
                        (resultSet, rowNum) -> new KyThanhToan(
                                resultSet.getLong("id"),
                                resultSet.getLong("toa_nha_id"),
                                resultSet.getInt("nam"),
                                resultSet.getInt("thang"),
                                resultSet.getObject("ngay_bat_dau", java.time.LocalDate.class),
                                resultSet.getObject("ngay_ket_thuc", java.time.LocalDate.class),
                                TrangThaiKy.valueOf(resultSet.getString("trang_thai"))
                        ),
                        id,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    public boolean existsByToaNhaIdAndNamThang(Long toaNhaId, int nam, int thang) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ?
                          AND nam = ?
                          AND thang = ?
                        """,
                Integer.class,
                toaNhaId,
                nam,
                thang
        );
        return dem != null && dem > 0;
    }

    public boolean existsDangMoByToaNhaId(Long toaNhaId) {
        Integer dem = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM KY_THANH_TOAN
                        WHERE toa_nha_id = ?
                          AND trang_thai = 'DANG_MO'
                        """,
                Integer.class,
                toaNhaId
        );
        return dem != null && dem > 0;
    }

    public int updateTrangThaiDaChot(Long kyId, Long toaNhaId) {
        return jdbcTemplate.update(
                """
                        UPDATE KY_THANH_TOAN
                        SET trang_thai = 'DA_CHOT'
                        WHERE id = ?
                          AND toa_nha_id = ?
                          AND trang_thai = 'DANG_MO'
                        """,
                kyId,
                toaNhaId
        );
    }
}
