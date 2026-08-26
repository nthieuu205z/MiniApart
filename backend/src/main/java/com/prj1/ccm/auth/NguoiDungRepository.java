package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

@Repository
public class NguoiDungRepository {
    private final JdbcTemplate jdbcTemplate;

    public NguoiDungRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<NguoiDung> findBySoDienThoai(String soDienThoai) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token
                                FROM NGUOI_DUNG
                                WHERE so_dien_thoai = ?
                                """,
                        (resultSet, rowNum) -> new NguoiDung(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token")
                        ),
                        soDienThoai
                )
                .stream()
                .findFirst();
    }

    public Optional<NguoiDung> findById(Long id) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token
                                FROM NGUOI_DUNG
                                WHERE id = ?
                                """,
                        (resultSet, rowNum) -> new NguoiDung(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token")
                        ),
                        id
                )
                .stream()
                .findFirst();
    }

    public Optional<NguoiDungDangNhap> findBySoDienThoaiChoDangNhap(String soDienThoai) {
        return jdbcTemplate.query(
                        """
                                SELECT id, ho_ten, so_dien_thoai, mat_khau_hash, vai_tro, trang_thai, phien_ban_token,
                                       so_lan_sai, lan_sai_dau_tien, khoa_den
                                FROM NGUOI_DUNG
                                WHERE so_dien_thoai = ?
                                FOR UPDATE
                                """,
                        (resultSet, rowNum) -> new NguoiDungDangNhap(
                                resultSet.getLong("id"),
                                resultSet.getString("ho_ten"),
                                resultSet.getString("so_dien_thoai"),
                                resultSet.getString("mat_khau_hash"),
                                VaiTro.valueOf(resultSet.getString("vai_tro")),
                                TrangThaiNguoiDung.valueOf(resultSet.getString("trang_thai")),
                                resultSet.getInt("phien_ban_token"),
                                resultSet.getInt("so_lan_sai"),
                                toInstant(resultSet.getTimestamp("lan_sai_dau_tien")),
                                toInstant(resultSet.getTimestamp("khoa_den"))
                        ),
                        soDienThoai
                )
                .stream()
                .findFirst();
    }

    public void xoaLanDangNhapSaiTruoc(Long nguoiDungId, Instant mocThoiGian) {
        jdbcTemplate.update(
                "DELETE FROM LAN_DANG_NHAP_SAI WHERE nguoi_dung_id = ? AND thoi_diem < ?",
                nguoiDungId,
                Timestamp.from(mocThoiGian)
        );
    }

    public void ghiNhanLanDangNhapSai(Long nguoiDungId, Instant thoiDiem) {
        jdbcTemplate.update(
                "INSERT INTO LAN_DANG_NHAP_SAI(nguoi_dung_id, thoi_diem) VALUES (?, ?)",
                nguoiDungId,
                Timestamp.from(thoiDiem)
        );
    }

    public int demLanDangNhapSaiTu(Long nguoiDungId, Instant mocThoiGian) {
        Integer soLanSai = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LAN_DANG_NHAP_SAI WHERE nguoi_dung_id = ? AND thoi_diem >= ?",
                Integer.class,
                nguoiDungId,
                Timestamp.from(mocThoiGian)
        );
        return soLanSai == null ? 0 : soLanSai;
    }

    public Instant timLanDangNhapSaiSomNhatTu(Long nguoiDungId, Instant mocThoiGian) {
        Timestamp thoiDiem = jdbcTemplate.queryForObject(
                "SELECT MIN(thoi_diem) FROM LAN_DANG_NHAP_SAI WHERE nguoi_dung_id = ? AND thoi_diem >= ?",
                Timestamp.class,
                nguoiDungId,
                Timestamp.from(mocThoiGian)
        );
        return toInstant(thoiDiem);
    }

    public void capNhatDangNhapSai(Long nguoiDungId, int soLanSai, Instant lanSaiDauTien) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET so_lan_sai = ?, lan_sai_dau_tien = ?, khoa_den = NULL
                        WHERE id = ?
                        """,
                soLanSai,
                Timestamp.from(lanSaiDauTien),
                nguoiDungId
        );
    }

    public void khoaTamDangNhap(Long nguoiDungId, int soLanSai, Instant lanSaiDauTien, Instant khoaDen) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET so_lan_sai = ?,
                            lan_sai_dau_tien = ?,
                            khoa_den = ?,
                            phien_ban_token = phien_ban_token + 1
                        WHERE id = ?
                        """,
                soLanSai,
                Timestamp.from(lanSaiDauTien),
                Timestamp.from(khoaDen),
                nguoiDungId
        );
    }

    public void datLaiTrangThaiDangNhap(Long nguoiDungId) {
        jdbcTemplate.update(
                """
                        UPDATE NGUOI_DUNG
                        SET so_lan_sai = 0, lan_sai_dau_tien = NULL, khoa_den = NULL
                        WHERE id = ?
                        """,
                nguoiDungId
        );
        jdbcTemplate.update("DELETE FROM LAN_DANG_NHAP_SAI WHERE nguoi_dung_id = ?", nguoiDungId);
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }
}
