package com.prj1.ccm.billing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

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
}
