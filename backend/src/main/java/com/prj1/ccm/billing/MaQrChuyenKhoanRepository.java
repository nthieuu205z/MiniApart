package com.prj1.ccm.billing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
class MaQrChuyenKhoanRepository {
    private final JdbcTemplate jdbcTemplate;

    MaQrChuyenKhoanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Optional<DuLieuMaQrChuyenKhoan> timHoaDon(Long toaNhaId, Long kyId, Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT tn.tk_ngan_hang, hd.tong_tien, hd.da_thu, hd.ma_hoa_don
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                                WHERE hd.id = ?
                                  AND hd.ky_id = ?
                                  AND tn.id = ?
                                """,
                        (resultSet, rowNum) -> new DuLieuMaQrChuyenKhoan(
                                resultSet.getString("tk_ngan_hang"),
                                resultSet.getBigDecimal("tong_tien"),
                                resultSet.getBigDecimal("da_thu"),
                                resultSet.getString("ma_hoa_don")
                        ),
                        hoaDonId,
                        kyId,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    record DuLieuMaQrChuyenKhoan(
            String taiKhoanNganHang,
            BigDecimal tongTien,
            BigDecimal daThu,
            String maHoaDon
    ) {
    }
}
