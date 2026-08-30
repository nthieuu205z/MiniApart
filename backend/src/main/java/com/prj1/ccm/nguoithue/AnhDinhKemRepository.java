package com.prj1.ccm.nguoithue;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Repository
class AnhDinhKemRepository {
    private final JdbcTemplate jdbcTemplate;

    AnhDinhKemRepository(JdbcTemplate jdbcTemplate) { this.jdbcTemplate = jdbcTemplate; }

    Long insert(AnhDinhKem anh) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO ANH_DINH_KEM(doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc)
                VALUES (?, ?, ?, ?, ?, ?) RETURNING id
                """, Long.class, anh.doiTuongLoai(), anh.doiTuongId(), anh.khoaLuuTru(), anh.ghiChu(), anh.loaiNoiDung(), anh.kichThuoc());
    }

    Optional<AnhDinhKem> findNguoiThueById(Long id) {
        return jdbcTemplate.query("""
                SELECT id, doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc
                FROM ANH_DINH_KEM WHERE id = ? AND doi_tuong_loai = 'NGUOI_THUE'
                """, (resultSet, rowNum) -> mapAnh(resultSet), id).stream().findFirst();
    }

    Optional<AnhDinhKem> findById(Long id) {
        return jdbcTemplate.query("""
                SELECT id, doi_tuong_loai, doi_tuong_id, khoa_luu_tru, ghi_chu, loai_noi_dung, kich_thuoc
                FROM ANH_DINH_KEM
                WHERE id = ?
                """, (resultSet, rowNum) -> mapAnh(resultSet), id).stream().findFirst();
    }

    boolean existsByDoiTuong(String doiTuongLoai, Long doiTuongId) {
        Integer dem = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM ANH_DINH_KEM
                WHERE doi_tuong_loai = ? AND doi_tuong_id = ?
                """, Integer.class, doiTuongLoai, doiTuongId);
        return dem != null && dem > 0;
    }

    Optional<Long> findIdMoiNhatByDoiTuong(String doiTuongLoai, Long doiTuongId) {
        return jdbcTemplate.query("""
                SELECT id
                FROM ANH_DINH_KEM
                WHERE doi_tuong_loai = ? AND doi_tuong_id = ?
                ORDER BY id DESC
                LIMIT 1
                """, (resultSet, rowNum) -> resultSet.getLong("id"), doiTuongLoai, doiTuongId).stream().findFirst();
    }

    private AnhDinhKem mapAnh(ResultSet resultSet) throws SQLException {
        return new AnhDinhKem(resultSet.getLong("id"), resultSet.getString("doi_tuong_loai"), resultSet.getLong("doi_tuong_id"), resultSet.getString("khoa_luu_tru"), resultSet.getString("ghi_chu"), resultSet.getString("loai_noi_dung"), resultSet.getLong("kich_thuoc"));
    }
}
