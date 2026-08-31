package com.prj1.ccm.hopdong;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

@Repository
public class NguoiOCungRepository {
    private final JdbcTemplate jdbcTemplate;

    public NguoiOCungRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    Long insert(NguoiOCung nguoiOCung) {
        return jdbcTemplate.queryForObject(
                """
                        INSERT INTO NGUOI_O_CUNG(hop_dong_id, nguoi_thue_id, quan_he, tu_ngay, den_ngay)
                        VALUES (?, ?, ?, ?, ?)
                        RETURNING id
                        """,
                Long.class,
                nguoiOCung.hopDongId(),
                nguoiOCung.nguoiThueId(),
                nguoiOCung.quanHe(),
                Date.valueOf(nguoiOCung.tuNgay()),
                nguoiOCung.denNgay() == null ? null : Date.valueOf(nguoiOCung.denNgay())
        );
    }

    List<NguoiOCung> findByHopDongId(Long hopDongId) {
        return jdbcTemplate.query(
                """
                        SELECT noc.id, noc.hop_dong_id, noc.nguoi_thue_id, nt.ho_ten,
                               noc.quan_he, noc.tu_ngay, noc.den_ngay
                        FROM NGUOI_O_CUNG noc
                        JOIN NGUOI_THUE nt ON nt.id = noc.nguoi_thue_id
                        WHERE noc.hop_dong_id = ?
                        ORDER BY noc.tu_ngay, noc.id
                        """,
                (resultSet, rowNum) -> mapNguoiOCung(resultSet),
                hopDongId
        );
    }

    List<NguoiOCung> findDangODeGiaHan(Long hopDongId, LocalDate ngayKetThucHopDongCu) {
        return jdbcTemplate.query(
                """
                        SELECT noc.id, noc.hop_dong_id, noc.nguoi_thue_id, nt.ho_ten,
                               noc.quan_he, noc.tu_ngay, noc.den_ngay
                        FROM NGUOI_O_CUNG noc
                        JOIN NGUOI_THUE nt ON nt.id = noc.nguoi_thue_id
                        WHERE noc.hop_dong_id = ?
                          AND noc.tu_ngay <= ?
                          AND (noc.den_ngay IS NULL OR noc.den_ngay > ?)
                        ORDER BY noc.tu_ngay, noc.id
                        """,
                (resultSet, rowNum) -> mapNguoiOCung(resultSet),
                hopDongId,
                Date.valueOf(ngayKetThucHopDongCu),
                Date.valueOf(ngayKetThucHopDongCu)
        );
    }

    int countByPhongIdAndNgay(Long phongId, LocalDate ngay) {
        Integer soNguoi = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM NGUOI_O_CUNG noc
                        JOIN HOP_DONG hd ON hd.id = noc.hop_dong_id
                        WHERE hd.phong_id = ?
                          AND hd.ngay_bat_dau <= ?
                          AND hd.ngay_ket_thuc >= ?
                          AND noc.tu_ngay <= ?
                          AND (noc.den_ngay IS NULL OR noc.den_ngay >= ?)
                        """,
                Integer.class,
                phongId,
                Date.valueOf(ngay),
                Date.valueOf(ngay),
                Date.valueOf(ngay),
                Date.valueOf(ngay)
        );
        return soNguoi == null ? 0 : soNguoi;
    }

    public List<SoNguoiOTrongKy> findSoNguoiOChotKy(Long toaNhaId, LocalDate ngayBatDau, LocalDate ngayKetThuc) {
        return jdbcTemplate.query(
                """
                        SELECT hd.phong_id,
                               CASE WHEN COUNT(noc.id) = 0 THEN NULL
                                    ELSE COUNT(noc.id) FILTER (
                                        WHERE noc.tu_ngay <= ?
                                          AND (noc.den_ngay IS NULL OR noc.den_ngay >= ?)
                                    )::INTEGER
                               END AS so_nguoi
                        FROM HOP_DONG hd
                        JOIN PHONG p ON p.id = hd.phong_id
                        LEFT JOIN NGUOI_O_CUNG noc ON noc.hop_dong_id = hd.id
                        WHERE p.toa_nha_id = ?
                          AND hd.trang_thai = 'HIEU_LUC'
                          AND daterange(hd.ngay_bat_dau, hd.ngay_ket_thuc, '[]')
                              && daterange(?, ?, '[]')
                        GROUP BY hd.phong_id
                        ORDER BY hd.phong_id
                        """,
                (resultSet, rowNum) -> new SoNguoiOTrongKy(
                        resultSet.getLong("phong_id"),
                        resultSet.getObject("so_nguoi", Integer.class)
                ),
                Date.valueOf(ngayKetThuc),
                Date.valueOf(ngayKetThuc),
                toaNhaId,
                Date.valueOf(ngayBatDau),
                Date.valueOf(ngayKetThuc)
        );
    }

    public record SoNguoiOTrongKy(Long phongId, Integer soNguoi) {
    }

    private NguoiOCung mapNguoiOCung(ResultSet resultSet) throws SQLException {
        return new NguoiOCung(
                resultSet.getLong("id"),
                resultSet.getLong("hop_dong_id"),
                resultSet.getLong("nguoi_thue_id"),
                resultSet.getString("ho_ten"),
                resultSet.getString("quan_he"),
                resultSet.getObject("tu_ngay", LocalDate.class),
                resultSet.getObject("den_ngay", LocalDate.class)
        );
    }
}
