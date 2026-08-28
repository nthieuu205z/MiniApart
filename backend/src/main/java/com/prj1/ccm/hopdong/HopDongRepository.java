package com.prj1.ccm.hopdong;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
class HopDongRepository {
    private final JdbcTemplate jdbcTemplate;

    HopDongRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Long insert(HopDong hopDong) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO HOP_DONG (
                            phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                hopDong.phongId(),
                hopDong.nguoiThueId(),
                Date.valueOf(hopDong.ngayBatDau()),
                Date.valueOf(hopDong.ngayKetThuc()),
                hopDong.giaThue(),
                hopDong.tienCoc(),
                hopDong.soNgayBaoTruoc(),
                hopDong.trangThai().name()
        );
    }

    public void insertDichVuApDung(List<HopDongDichVu> dichVuApDung) {
        jdbcTemplate.batchUpdate(
                """
                        INSERT INTO HOP_DONG_DICH_VU (hop_dong_id, dich_vu_id, don_gia_ap_dung)
                        VALUES (?, ?, ?)
                        """,
                dichVuApDung,
                dichVuApDung.size(),
                (preparedStatement, item) -> {
                    preparedStatement.setLong(1, item.hopDongId());
                    preparedStatement.setLong(2, item.dichVuId());
                    preparedStatement.setBigDecimal(3, item.donGiaApDung());
                }
        );
    }

    public Optional<HopDong> findById(Long id) {
        return jdbcTemplate.query(
                        """
                                SELECT id, phong_id, nguoi_thue_id, ngay_bat_dau, ngay_ket_thuc, gia_thue, tien_coc, so_ngay_bao_truoc, trang_thai
                                FROM HOP_DONG
                                WHERE id = ?
                                """,
                        (resultSet, rowNum) -> mapHopDong(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public List<HopDongView> findByToaNhaId(Long toaNhaId, TrangThaiHopDong trangThai) {
        String sql = """
                SELECT hd.id, hd.phong_id, p.toa_nha_id, p.so_phong, hd.nguoi_thue_id, nt.ho_ten,
                       hd.ngay_bat_dau, hd.ngay_ket_thuc, hd.gia_thue, hd.tien_coc, hd.so_ngay_bao_truoc, hd.trang_thai
                FROM HOP_DONG hd
                JOIN PHONG p ON p.id = hd.phong_id
                JOIN NGUOI_THUE nt ON nt.id = hd.nguoi_thue_id
                WHERE p.toa_nha_id = ?
                """;
        if (trangThai != null) {
            sql += " AND hd.trang_thai = ?";
            return jdbcTemplate.query(
                    sql + " ORDER BY hd.ngay_ket_thuc DESC, hd.id DESC",
                    (resultSet, rowNum) -> mapHopDongView(resultSet),
                    toaNhaId,
                    trangThai.name()
            );
        }
        return jdbcTemplate.query(
                sql + " ORDER BY hd.ngay_ket_thuc DESC, hd.id DESC",
                (resultSet, rowNum) -> mapHopDongView(resultSet),
                toaNhaId
        );
    }

    public Optional<HopDongView> findViewById(Long id) {
        return jdbcTemplate.query(
                        """
                                SELECT hd.id, hd.phong_id, p.toa_nha_id, p.so_phong, hd.nguoi_thue_id, nt.ho_ten,
                                       hd.ngay_bat_dau, hd.ngay_ket_thuc, hd.gia_thue, hd.tien_coc, hd.so_ngay_bao_truoc, hd.trang_thai
                                FROM HOP_DONG hd
                                JOIN PHONG p ON p.id = hd.phong_id
                                JOIN NGUOI_THUE nt ON nt.id = hd.nguoi_thue_id
                                WHERE hd.id = ?
                                """,
                        (resultSet, rowNum) -> mapHopDongView(resultSet),
                        id
                )
                .stream()
                .findFirst();
    }

    public List<ThongTinHopDongDichVu> findDichVuApDungByHopDongId(Long hopDongId) {
        return jdbcTemplate.query(
                """
                        SELECT dv.id, dv.ten, hddv.don_gia_ap_dung
                        FROM HOP_DONG_DICH_VU hddv
                        JOIN DICH_VU dv ON dv.id = hddv.dich_vu_id
                        WHERE hddv.hop_dong_id = ?
                        ORDER BY hddv.dich_vu_id
                        """,
                (resultSet, rowNum) -> ThongTinHopDongDichVu.tao(
                        resultSet.getLong("id"),
                        resultSet.getString("ten"),
                        resultSet.getBigDecimal("don_gia_ap_dung")
                ),
                hopDongId
        );
    }

    public void updateTrangThai(Long hopDongId, TrangThaiHopDong trangThai) {
        jdbcTemplate.update(
                """
                        UPDATE HOP_DONG
                        SET trang_thai = ?
                        WHERE id = ?
                        """,
                trangThai.name(),
                hopDongId
        );
    }

    private HopDong mapHopDong(ResultSet resultSet) throws SQLException {
        return new HopDong(
                resultSet.getLong("id"),
                resultSet.getLong("phong_id"),
                resultSet.getLong("nguoi_thue_id"),
                resultSet.getObject("ngay_bat_dau", LocalDate.class),
                resultSet.getObject("ngay_ket_thuc", LocalDate.class),
                resultSet.getBigDecimal("gia_thue"),
                resultSet.getBigDecimal("tien_coc"),
                resultSet.getInt("so_ngay_bao_truoc"),
                TrangThaiHopDong.valueOf(resultSet.getString("trang_thai"))
        );
    }

    private HopDongView mapHopDongView(ResultSet resultSet) throws SQLException {
        HopDong hopDong = new HopDong(
                resultSet.getLong("id"),
                resultSet.getLong("phong_id"),
                resultSet.getLong("nguoi_thue_id"),
                resultSet.getObject("ngay_bat_dau", LocalDate.class),
                resultSet.getObject("ngay_ket_thuc", LocalDate.class),
                resultSet.getBigDecimal("gia_thue"),
                resultSet.getBigDecimal("tien_coc"),
                resultSet.getInt("so_ngay_bao_truoc"),
                TrangThaiHopDong.valueOf(resultSet.getString("trang_thai"))
        );
        return new HopDongView(
                hopDong,
                resultSet.getLong("toa_nha_id"),
                resultSet.getString("so_phong"),
                resultSet.getString("ho_ten")
        );
    }

    record HopDongView(
            HopDong hopDong,
            Long toaNhaId,
            String soPhong,
            String hoTenNguoiThue
    ) {
    }
}
