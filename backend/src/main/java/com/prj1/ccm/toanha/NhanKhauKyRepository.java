package com.prj1.ccm.toanha;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
class NhanKhauKyRepository {
    private final JdbcTemplate jdbcTemplate;

    NhanKhauKyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    void insertAll(Long kyId, List<NhanKhauKy> nhanKhauTrongKy, Instant thoiDiemChot) {
        jdbcTemplate.batchUpdate(
                """
                        INSERT INTO NHAN_KHAU_KY (ky_id, phong_id, so_nguoi, thoi_diem_chot)
                        VALUES (?, ?, ?, ?)
                        """,
                nhanKhauTrongKy,
                nhanKhauTrongKy.size(),
                (preparedStatement, nhanKhauKy) -> {
                    preparedStatement.setLong(1, kyId);
                    preparedStatement.setLong(2, nhanKhauKy.phongId());
                    if (nhanKhauKy.soNguoi() == null) {
                        preparedStatement.setNull(3, java.sql.Types.INTEGER);
                    } else {
                        preparedStatement.setInt(3, nhanKhauKy.soNguoi());
                    }
                    preparedStatement.setTimestamp(4, Timestamp.from(thoiDiemChot));
                }
        );
    }

    Optional<Integer> findSoNguoiByKyIdAndPhongId(Long kyId, Long phongId) {
        return jdbcTemplate.query(
                        """
                                SELECT so_nguoi
                                FROM NHAN_KHAU_KY
                                WHERE ky_id = ?
                                  AND phong_id = ?
                                """,
                        (resultSet, rowNum) -> resultSet.getObject("so_nguoi", Integer.class),
                        kyId,
                        phongId
                )
                .stream()
                .findFirst();
    }

    record NhanKhauKy(Long phongId, Integer soNguoi) {
    }
}
