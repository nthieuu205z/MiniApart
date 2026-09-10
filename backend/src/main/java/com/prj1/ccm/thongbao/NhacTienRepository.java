package com.prj1.ccm.thongbao;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
class NhacTienRepository {
    private final JdbcTemplate jdbcTemplate;

    NhacTienRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    List<Long> timHoaDonDenMoc(LocalDate ngayNghiepVu) {
        return jdbcTemplate.queryForList(
                """
                        SELECT id
                        FROM HOA_DON
                        WHERE han_thanh_toan <= (?::date + 3)
                        ORDER BY id
                        """,
                Long.class,
                Date.valueOf(ngayNghiepVu)
        );
    }

    Optional<HoaDonNhacTien> timHoaDonKhoa(Long hoaDonId) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hd.ma_hoa_don, hd.tong_tien, hd.trang_thai, hd.han_thanh_toan,
                                       hd.hop_dong_id, p.toa_nha_id
                                FROM HOA_DON hd
                                JOIN HOP_DONG hop_dong ON hop_dong.id = hd.hop_dong_id
                                JOIN PHONG p ON p.id = hop_dong.phong_id
                                WHERE hd.id = ?
                                FOR UPDATE OF hd
                                """,
                        (resultSet, rowNum) -> new HoaDonNhacTien(
                                resultSet.getLong("id"),
                                resultSet.getString("ma_hoa_don"),
                                resultSet.getBigDecimal("tong_tien"),
                                resultSet.getString("trang_thai"),
                                resultSet.getObject("han_thanh_toan", LocalDate.class),
                                resultSet.getLong("hop_dong_id"),
                                resultSet.getLong("toa_nha_id")
                        ),
                        hoaDonId
                )
                .stream()
                .findFirst();
    }

    BigDecimal tongDaThu(Long hoaDonId) {
        return jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(so_tien), 0.00) FROM THANH_TOAN WHERE hoa_don_id = ?",
                BigDecimal.class,
                hoaDonId
        );
    }

    Optional<Long> timTaiKhoanNguoiThue(HoaDonNhacTien hoaDon, LocalDate ngayNghiepVu) {
        return jdbcTemplate.query(
                        """
                                SELECT nd.id
                                FROM HOP_DONG hop_dong
                                JOIN NGUOI_DUNG nd ON nd.nguoi_thue_id = hop_dong.nguoi_thue_id
                                WHERE hop_dong.id = ?
                                  AND hop_dong.trang_thai = 'HIEU_LUC'
                                  AND hop_dong.ngay_bat_dau <= ?
                                  AND hop_dong.ngay_ket_thuc >= ?
                                  AND nd.vai_tro = 'NGUOI_THUE'
                                  AND nd.trang_thai = 'HOAT_DONG'
                                ORDER BY nd.id
                                LIMIT 1
                                """,
                        (resultSet, rowNum) -> resultSet.getLong("id"),
                        hoaDon.hopDongId(),
                        Date.valueOf(ngayNghiepVu),
                        Date.valueOf(ngayNghiepVu)
                )
                .stream()
                .findFirst();
    }

    List<Integer> mocDaGui(Long hoaDonId, Long nguoiNhanId) {
        return jdbcTemplate.queryForList(
                "SELECT moc_ngay FROM NHAC_TIEN_MOC WHERE hoa_don_id = ? AND nguoi_nhan_id = ? AND trang_thai = 'DA_GUI' ORDER BY moc_ngay",
                Integer.class,
                hoaDonId,
                nguoiNhanId
        );
    }

    boolean ghiNhanMoc(Long hoaDonId, Long nguoiNhanId, int mocNgay, Instant guiLuc) {
        return jdbcTemplate.update(
                """
                        INSERT INTO NHAC_TIEN_MOC(hoa_don_id, nguoi_nhan_id, moc_ngay, trang_thai, gui_luc)
                        VALUES (?, ?, ?, 'DA_GUI', ?)
                        ON CONFLICT (hoa_don_id, nguoi_nhan_id, moc_ngay) DO NOTHING
                        """,
                hoaDonId,
                nguoiNhanId,
                mocNgay,
                Timestamp.from(guiLuc)
        ) == 1;
    }

    void ghiNhatKyThanhCong(
            Long hoaDonId,
            Long nguoiNhanId,
            int mocNgay,
            LocalDate ngayNghiepVu,
            Instant thoiDiem
    ) {
        jdbcTemplate.update(
                """
                        INSERT INTO NHAT_KY_NHAC_TIEN(
                            hoa_don_id, nguoi_nhan_id, moc_ngay, ngay_nghiep_vu, trang_thai, thoi_diem
                        )
                        VALUES (?, ?, ?, ?, 'THANH_CONG', ?)
                        """,
                hoaDonId,
                nguoiNhanId,
                mocNgay,
                Date.valueOf(ngayNghiepVu),
                Timestamp.from(thoiDiem)
        );
    }

    void ghiNhatKyThatBai(Long hoaDonId, LocalDate ngayNghiepVu, Instant thoiDiem, String loi) {
        jdbcTemplate.update(
                """
                        INSERT INTO NHAT_KY_NHAC_TIEN(
                            hoa_don_id, ngay_nghiep_vu, trang_thai, loi, thoi_diem
                        )
                        VALUES (?, ?, 'THAT_BAI', ?, ?)
                        """,
                hoaDonId,
                Date.valueOf(ngayNghiepVu),
                loi,
                Timestamp.from(thoiDiem)
        );
    }

    record HoaDonNhacTien(
            Long hoaDonId,
            String maHoaDon,
            BigDecimal tongTien,
            String trangThai,
            LocalDate hanThanhToan,
            Long hopDongId,
            Long toaNhaId
    ) {
    }
}
