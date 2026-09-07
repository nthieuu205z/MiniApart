package com.prj1.ccm.billing;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
class GiaoDichCocRepository {
    private final JdbcTemplate jdbcTemplate;

    GiaoDichCocRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Optional<HopDongTrongPhamVi> timHopDong(Long hopDongId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id AS hop_dong_id, p.toa_nha_id, hd.tien_coc
                                FROM HOP_DONG hd
                                JOIN PHONG p ON p.id = hd.phong_id
                                WHERE hd.id = ?
                                """,
                        (resultSet, rowNum) -> mapHopDongTrongPhamVi(resultSet),
                        hopDongId
                )
                .stream()
                .findFirst();
    }

    Optional<HopDongTrongPhamVi> timHopDongVaKhoa(Long hopDongId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id AS hop_dong_id, p.toa_nha_id, hd.tien_coc
                                FROM HOP_DONG hd
                                JOIN PHONG p ON p.id = hd.phong_id
                                WHERE hd.id = ?
                                FOR UPDATE OF hd
                                """,
                        (resultSet, rowNum) -> mapHopDongTrongPhamVi(resultSet),
                        hopDongId
                )
                .stream()
                .findFirst();
    }

    java.math.BigDecimal tongThuCoc(Long hopDongId) {
        return jdbcTemplate.queryForObject(
                """
                        SELECT COALESCE(SUM(so_tien), CAST(0.00 AS NUMERIC(15,2)))
                        FROM GIAO_DICH_COC
                        WHERE hop_dong_id = ? AND loai = 'THU_COC'
                        """,
                java.math.BigDecimal.class,
                hopDongId
        );
    }

    java.math.BigDecimal tongCongNo(Long hopDongId) {
        return jdbcTemplate.queryForObject("SELECT COALESCE(SUM(GREATEST(tong_tien - da_thu, 0.00)), 0.00) FROM HOA_DON WHERE hop_dong_id = ?", java.math.BigDecimal.class, hopDongId);
    }

    Long taoHoaDonQuyetToan(Long hopDongId, String maHoaDon, LocalDate ngay, LocalDate han, java.math.BigDecimal soTien) {
        return jdbcTemplate.queryForObject("INSERT INTO HOA_DON(ma_hoa_don, ky_id, hop_dong_id, ngay_phat_hanh, han_thanh_toan, tong_tien, da_thu, trang_thai) VALUES (?, NULL, ?, ?, ?, ?, 0.00, 'DA_PHAT_HANH') RETURNING id", Long.class, maHoaDon, hopDongId, Date.valueOf(ngay), Date.valueOf(han), soTien);
    }

    GiaoDichCocDaGhi ghi(GiaoDichCocMoi giaoDichMoi) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO GIAO_DICH_COC(hop_dong_id, loai, so_tien, ngay, nguoi_thu_id, ly_do)
                        VALUES (?, ?, ?, ?, ?, ?)
                        RETURNING id, hop_dong_id, loai, so_tien, ngay, nguoi_thu_id, ma_bien_lai, ly_do
                        """,
                (resultSet, rowNum) -> mapGiaoDich(resultSet),
                giaoDichMoi.hopDongId(),
                giaoDichMoi.loai().name(),
                giaoDichMoi.soTien(),
                Date.valueOf(giaoDichMoi.ngay()),
                giaoDichMoi.nguoiThuId(),
                giaoDichMoi.lyDo()
        );
    }

    List<GiaoDichCocDaGhi> timTheoHopDong(Long hopDongId) {
        return jdbcTemplate.query(
                """
                        SELECT id, hop_dong_id, loai, so_tien, ngay, nguoi_thu_id, ma_bien_lai, ly_do
                        FROM GIAO_DICH_COC
                        WHERE hop_dong_id = ?
                        ORDER BY ngay, id
                        """,
                (resultSet, rowNum) -> mapGiaoDich(resultSet),
                hopDongId
        );
    }

    private HopDongTrongPhamVi mapHopDongTrongPhamVi(ResultSet resultSet) throws SQLException {
        return new HopDongTrongPhamVi(
                resultSet.getLong("hop_dong_id"),
                resultSet.getLong("toa_nha_id"),
                resultSet.getBigDecimal("tien_coc")
        );
    }

    private GiaoDichCocDaGhi mapGiaoDich(ResultSet resultSet) throws SQLException {
        return new GiaoDichCocDaGhi(
                resultSet.getLong("id"),
                resultSet.getLong("hop_dong_id"),
                LoaiGiaoDichCoc.valueOf(resultSet.getString("loai")),
                resultSet.getBigDecimal("so_tien"),
                resultSet.getObject("ngay", LocalDate.class),
                resultSet.getLong("nguoi_thu_id"),
                resultSet.getString("ma_bien_lai"),
                resultSet.getString("ly_do")
        );
    }

    record HopDongTrongPhamVi(Long hopDongId, Long toaNhaId, java.math.BigDecimal tienCoc) {
    }

    record GiaoDichCocMoi(
            Long hopDongId,
            LoaiGiaoDichCoc loai,
            java.math.BigDecimal soTien,
            LocalDate ngay,
            Long nguoiThuId,
            String lyDo
    ) {
    }

    record GiaoDichCocDaGhi(
            Long id,
            Long hopDongId,
            LoaiGiaoDichCoc loai,
            java.math.BigDecimal soTien,
            LocalDate ngay,
            Long nguoiThuId,
            String maBienLai,
            String lyDo
    ) {
    }
}
