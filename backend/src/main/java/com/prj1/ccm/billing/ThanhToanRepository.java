package com.prj1.ccm.billing;

import com.prj1.ccm.billing.calc.TrangThaiHoaDon;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
class ThanhToanRepository {
    private final JdbcTemplate jdbcTemplate;

    ThanhToanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Optional<HoaDonThanhToan> timHoaDon(
            Long toaNhaId,
            Long kyId,
            Long hoaDonId,
            boolean khoa
    ) {
        String sql = """
                SELECT hd.id, hd.tong_tien, hd.trang_thai, hd.han_thanh_toan
                FROM HOA_DON hd
                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                JOIN PHONG p ON p.id = hop_dong.phong_id
                WHERE hd.id = ?
                  AND hd.ky_id = ?
                  AND p.toa_nha_id = ?
                """;
        if (khoa) {
            sql += " FOR UPDATE";
        }
        return jdbcTemplate.query(
                        sql,
                        (resultSet, rowNum) -> new HoaDonThanhToan(
                                resultSet.getLong("id"),
                                resultSet.getBigDecimal("tong_tien"),
                                TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getObject("han_thanh_toan", LocalDate.class)
                        ),
                        hoaDonId,
                        kyId,
                        toaNhaId
                )
                .stream()
                .findFirst();
    }

    Optional<ThanhToanCanDoiUng> timThanhToanCanDoiUng(Long thanhToanId, boolean khoaHoaDon) {
        String sql = """
                SELECT tt.id AS thanh_toan_id, tt.loai, tt.thoi_diem_tao,
                       hd.id AS hoa_don_id, hd.tong_tien, hd.trang_thai, hd.han_thanh_toan,
                       p.toa_nha_id
                FROM THANH_TOAN tt
                JOIN HOA_DON hd ON hd.id = tt.hoa_don_id
                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                JOIN PHONG p ON p.id = hop_dong.phong_id
                WHERE tt.id = ?
                """;
        if (khoaHoaDon) {
            sql += " FOR UPDATE OF hd";
        }
        return jdbcTemplate.query(
                        sql,
                        (resultSet, rowNum) -> new ThanhToanCanDoiUng(
                                resultSet.getLong("thanh_toan_id"),
                                resultSet.getString("loai"),
                                resultSet.getObject("thoi_diem_tao", LocalDateTime.class),
                                resultSet.getLong("hoa_don_id"),
                                resultSet.getLong("toa_nha_id"),
                                resultSet.getBigDecimal("tong_tien"),
                                TrangThaiHoaDon.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getObject("han_thanh_toan", LocalDate.class)
                        ),
                        thanhToanId
                )
                .stream()
                .findFirst();
    }

    List<BigDecimal> layCacSoTien(Long hoaDonId) {
        return jdbcTemplate.queryForList(
                "SELECT so_tien FROM THANH_TOAN WHERE hoa_don_id = ? ORDER BY id",
                BigDecimal.class,
                hoaDonId
        );
    }

    ThanhToanDaGhi ghiNhan(ThanhToanMoi thanhToan) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO THANH_TOAN (
                            hoa_don_id, so_tien, loai, hinh_thuc, ngay_thu, nguoi_thu_id
                        )
                        VALUES (?, ?, 'THU', ?, ?, ?)
                        RETURNING id, ma_bien_lai
                        """,
                (resultSet, rowNum) -> new ThanhToanDaGhi(
                        resultSet.getLong("id"),
                        resultSet.getString("ma_bien_lai")
                ),
                thanhToan.hoaDonId(),
                thanhToan.soTien(),
                thanhToan.hinhThuc().name(),
                java.sql.Date.valueOf(thanhToan.ngayThu()),
                thanhToan.nguoiThuId()
        );
    }

    ThanhToanDaGhi ghiNhanDoiUng(ThanhToanDoiUngMoi thanhToan) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO THANH_TOAN (hoa_don_id, so_tien, loai, dieu_chinh_cho_id, ly_do, nguoi_thu_id)
                        VALUES (?, ?, 'DOI_UNG', ?, ?, ?)
                        RETURNING id, ma_bien_lai
                        """,
                (resultSet, rowNum) -> new ThanhToanDaGhi(
                        resultSet.getLong("id"),
                        resultSet.getString("ma_bien_lai")
                ),
                thanhToan.hoaDonId(),
                thanhToan.soTien(),
                thanhToan.dieuChinhChoId(),
                thanhToan.lyDo(),
                thanhToan.nguoiThuId()
        );
    }

    void capNhatDaThu(Long hoaDonId, BigDecimal daThu) {
        int soDongCapNhat = jdbcTemplate.update(
                "UPDATE HOA_DON SET da_thu = ? WHERE id = ?",
                daThu,
                hoaDonId
        );
        if (soDongCapNhat != 1) {
            throw new IllegalStateException("Khong cap nhat duoc so tien da thu cua hoa don");
        }
    }

    void capNhatTrangThai(Long hoaDonId, TrangThaiHoaDon trangThai) {
        int soDongCapNhat = jdbcTemplate.update(
                "UPDATE HOA_DON SET trang_thai = ? WHERE id = ?",
                trangThai.name(),
                hoaDonId
        );
        if (soDongCapNhat != 1) {
            throw new IllegalStateException("Khong cap nhat duoc trang thai hoa don");
        }
    }

    record HoaDonThanhToan(
            Long hoaDonId,
            BigDecimal tongTien,
            TrangThaiHoaDon trangThaiLuu,
            LocalDate hanThanhToan
    ) {
    }

    record ThanhToanMoi(
            Long hoaDonId,
            BigDecimal soTien,
            HinhThucThanhToan hinhThuc,
            LocalDate ngayThu,
            Long nguoiThuId
    ) {
    }

    record ThanhToanDaGhi(Long thanhToanId, String maBienLai) {
    }

    record ThanhToanDoiUngMoi(
            Long hoaDonId,
            BigDecimal soTien,
            Long dieuChinhChoId,
            String lyDo,
            Long nguoiThuId
    ) {
    }

    record ThanhToanCanDoiUng(
            Long thanhToanId,
            String loai,
            LocalDateTime thoiDiemTao,
            Long hoaDonId,
            Long toaNhaId,
            BigDecimal tongTien,
            TrangThaiHoaDon trangThaiLuu,
            LocalDate hanThanhToan
    ) {
    }
}
