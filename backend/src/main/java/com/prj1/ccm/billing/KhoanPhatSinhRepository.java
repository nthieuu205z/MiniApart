package com.prj1.ccm.billing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
class KhoanPhatSinhRepository {
    private final JdbcTemplate jdbcTemplate;

    KhoanPhatSinhRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Optional<HopDongTrongPhamVi> timHopDongTrongPhamVi(Long hopDongId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id AS hop_dong_id, p.toa_nha_id
                                FROM HOP_DONG hd
                                JOIN PHONG p ON p.id = hd.phong_id
                                WHERE hd.id = ?
                                """,
                        (resultSet, rowNum) -> new HopDongTrongPhamVi(
                                resultSet.getLong("hop_dong_id"),
                                resultSet.getLong("toa_nha_id")
                        ),
                        hopDongId
                )
                .stream()
                .findFirst();
    }

    Long tao(KhoanPhatSinhMoi khoanPhatSinhMoi) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO KHOAN_PHAT_SINH (
                            hop_dong_id, nguon_loai, nguon_id, ten_khoan, so_tien, loai, trang_thai, hoa_don_id
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
                        RETURNING id
                        """,
                Long.class,
                khoanPhatSinhMoi.hopDongId(),
                khoanPhatSinhMoi.nguonLoai().name(),
                khoanPhatSinhMoi.nguonId(),
                khoanPhatSinhMoi.tenKhoan(),
                khoanPhatSinhMoi.soTien(),
                khoanPhatSinhMoi.loai().name(),
                TrangThaiKhoanPhatSinh.CHO_TINH.name()
        );
    }

    List<KhoanPhatSinhCuaNguon> timTheoNguonKhoa(
            NguonKhoanPhatSinh nguonLoai,
            Long nguonId
    ) {
        return jdbcTemplate.query(
                """
                        SELECT id, hop_dong_id, so_tien, trang_thai, hoa_don_id
                        FROM KHOAN_PHAT_SINH
                        WHERE nguon_loai = ? AND nguon_id = ?
                        ORDER BY id
                        FOR UPDATE
                        """,
                (resultSet, rowNum) -> new KhoanPhatSinhCuaNguon(
                        resultSet.getLong("id"),
                        resultSet.getLong("hop_dong_id"),
                        resultSet.getBigDecimal("so_tien"),
                        TrangThaiKhoanPhatSinh.valueOf(resultSet.getString("trang_thai")),
                        layLongNullable(resultSet, "hoa_don_id")
                ),
                nguonLoai.name(),
                nguonId
        );
    }

    int capNhatChoTinh(Long id, BigDecimal soTien) {
        return jdbcTemplate.update(
                """
                        UPDATE KHOAN_PHAT_SINH
                        SET so_tien = ?
                        WHERE id = ? AND trang_thai = 'CHO_TINH' AND hoa_don_id IS NULL
                        """,
                soTien,
                id
        );
    }

    int voHieu(Long id) {
        return jdbcTemplate.update(
                """
                        UPDATE KHOAN_PHAT_SINH
                        SET trang_thai = 'VO_HIEU'
                        WHERE id = ? AND trang_thai = 'CHO_TINH' AND hoa_don_id IS NULL
                        """,
                id
        );
    }

    private Long layLongNullable(java.sql.ResultSet resultSet, String column) throws java.sql.SQLException {
        long value = resultSet.getLong(column);
        return resultSet.wasNull() ? null : value;
    }

    record HopDongTrongPhamVi(Long hopDongId, Long toaNhaId) {
    }

    record KhoanPhatSinhMoi(
            Long hopDongId,
            NguonKhoanPhatSinh nguonLoai,
            Long nguonId,
            String tenKhoan,
            java.math.BigDecimal soTien,
            LoaiKhoanPhatSinh loai
    ) {
    }

    record KhoanPhatSinhCuaNguon(
            Long id,
            Long hopDongId,
            BigDecimal soTien,
            TrangThaiKhoanPhatSinh trangThai,
            Long hoaDonId
    ) {
    }
}
