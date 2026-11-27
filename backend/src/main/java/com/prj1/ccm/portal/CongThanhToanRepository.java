package com.prj1.ccm.portal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
class CongThanhToanRepository {
    private final JdbcTemplate jdbcTemplate;

    CongThanhToanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Toà của hợp đồng HIEU_LUC mới nhất; bank lấy từ TOA_NHA (có mã BIN), tên/chủ TK từ Bên A nếu đã nhập. */
    Optional<ThongTinThanhToanCong> findTheoNguoiThue(Long nguoiThueId) {
        return jdbcTemplate.query(
                """
                        SELECT tn.id, tn.ten, tn.ma_toa, tn.ma_ngan_hang, tn.tk_ngan_hang,
                               NULLIF(btrim(a.ten_ngan_hang), '') AS ten_ngan_hang,
                               NULLIF(btrim(a.chu_tai_khoan), '') AS chu_tai_khoan,
                               p.so_phong
                        FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        JOIN TOA_NHA tn ON tn.id = p.toa_nha_id
                        LEFT JOIN CAU_HINH_BEN_A_TOA_NHA a ON a.toa_nha_id = tn.id
                        WHERE hd.nguoi_thue_id = ? AND hd.trang_thai = 'HIEU_LUC'
                        ORDER BY hd.ngay_bat_dau DESC, hd.id DESC
                        LIMIT 1
                        """,
                (rs, i) -> new ThongTinThanhToanCong(
                        rs.getLong("id"), rs.getString("ten"), rs.getString("ma_ngan_hang"),
                        rs.getString("ten_ngan_hang"), rs.getString("tk_ngan_hang"), rs.getString("chu_tai_khoan"),
                        "Phong " + rs.getString("so_phong") + " " + rs.getString("ma_toa")),
                nguoiThueId).stream().findFirst();
    }

    record HoaDonCuaNguoiThue(String maHoaDon, String soPhong, Long toaNhaId, boolean conNo) {
    }

    Optional<HoaDonCuaNguoiThue> findHoaDon(Long hoaDonId, Long nguoiThueId) {
        return jdbcTemplate.query(
                """
                        SELECT hd.ma_hoa_don, p.so_phong, p.toa_nha_id, hd.tong_tien > hd.da_thu AS con_no
                        FROM HOA_DON hd
                        JOIN HOP_DONG h ON h.id = hd.hop_dong_id
                        JOIN PHONG p ON p.id = h.phong_id
                        WHERE hd.id = ? AND h.nguoi_thue_id = ? AND hd.trang_thai NOT IN ('NHAP', 'DA_HUY')
                        """,
                (rs, i) -> new HoaDonCuaNguoiThue(rs.getString(1), rs.getString(2), rs.getLong(3), rs.getBoolean(4)),
                hoaDonId, nguoiThueId).stream().findFirst();
    }

    /** @return true nếu vừa tạo mới, false nếu đã báo trước đó. */
    boolean themBao(Long hoaDonId, Long nguoiThueId) {
        return jdbcTemplate.update(
                "INSERT INTO BAO_DA_CHUYEN(hoa_don_id, nguoi_thue_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                hoaDonId, nguoiThueId) == 1;
    }

    Instant baoLuc(Long hoaDonId) {
        List<Timestamp> ds = jdbcTemplate.queryForList("SELECT bao_luc FROM BAO_DA_CHUYEN WHERE hoa_don_id = ?", Timestamp.class, hoaDonId);
        return ds.get(0).toInstant();
    }
}
