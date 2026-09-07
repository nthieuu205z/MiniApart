package com.prj1.ccm.billing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
class ThanhToanPdfRepository {
    private final JdbcTemplate jdbcTemplate;

    ThanhToanPdfRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Optional<BienLaiPdfDuLieu> find(Long thanhToanId) {
        return jdbcTemplate.query(
                        """
                                SELECT tt.id, tt.ma_bien_lai, tt.so_tien, tt.loai, tt.hinh_thuc, tt.ngay_thu,
                                       tt.thoi_diem_tao, tt.ly_do,
                                       hd.ma_hoa_don, hop_dong.nguoi_thue_id, p.toa_nha_id, nd.ho_ten AS nguoi_thu
                                FROM THANH_TOAN tt
                                JOIN HOA_DON hd ON hd.id = tt.hoa_don_id
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                LEFT JOIN NGUOI_DUNG nd ON nd.id = tt.nguoi_thu_id
                                WHERE tt.id = ?
                                """,
                        (resultSet, rowNum) -> new BienLaiPdfDuLieu(
                                resultSet.getLong("id"),
                                resultSet.getString("ma_bien_lai"),
                                resultSet.getString("ma_hoa_don"),
                                resultSet.getLong("nguoi_thue_id"),
                                resultSet.getLong("toa_nha_id"),
                                resultSet.getBigDecimal("so_tien"),
                                resultSet.getString("loai"),
                                resultSet.getString("hinh_thuc"),
                                resultSet.getObject("ngay_thu", LocalDate.class),
                                resultSet.getObject("thoi_diem_tao", LocalDateTime.class),
                                resultSet.getString("nguoi_thu"),
                                resultSet.getString("ly_do")
                        ),
                        thanhToanId
                )
                .stream()
                .findFirst();
    }
}

record BienLaiPdfDuLieu(
        Long thanhToanId,
        String maBienLai,
        String maHoaDon,
        Long nguoiThueId,
        Long toaNhaId,
        BigDecimal soTien,
        String loai,
        String hinhThuc,
        LocalDate ngayThu,
        LocalDateTime thoiDiemTao,
        String nguoiThu,
        String lyDo
) {
}
