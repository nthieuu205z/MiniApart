package com.prj1.ccm.auth;

import com.prj1.ccm.nguoidung.NguoiDung;
import com.prj1.ccm.nguoidung.TrangThaiNguoiDung;
import com.prj1.ccm.nguoidung.VaiTro;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

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
}
