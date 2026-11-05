package com.prj1.ccm.toanha;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public class CauHinhBenARepository {
    private final JdbcTemplate jdbcTemplate;

    public CauHinhBenARepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<CauHinhBenA> findByToaNhaId(Long toaNhaId) {
        String sql = """
                SELECT id, toa_nha_id, loai_chu_the, ten_chu_the, ma_so_dinh_danh, dia_chi_lien_he,
                       so_dien_thoai, email, ho_ten_nguoi_ky, chuc_vu_nguoi_ky, tu_cach_ky,
                       can_cu_uy_quyen, thong_tin_don_vi_quan_ly, so_tai_khoan, ten_ngan_hang,
                       chu_tai_khoan, cap_nhat_luc
                FROM CAU_HINH_BEN_A_TOA_NHA
                WHERE toa_nha_id = ?
                """;
        try {
            CauHinhBenA row = jdbcTemplate.queryForObject(sql, this::mapRow, toaNhaId);
            return Optional.ofNullable(row);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void upsert(Long toaNhaId, YeuCauCauHinhBenA req) {
        String sql = """
                INSERT INTO CAU_HINH_BEN_A_TOA_NHA (
                    toa_nha_id, loai_chu_the, ten_chu_the, ma_so_dinh_danh, dia_chi_lien_he,
                    so_dien_thoai, email, ho_ten_nguoi_ky, chuc_vu_nguoi_ky, tu_cach_ky,
                    can_cu_uy_quyen, thong_tin_don_vi_quan_ly, so_tai_khoan, ten_ngan_hang,
                    chu_tai_khoan, cap_nhat_luc
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT (toa_nha_id) DO UPDATE SET
                    loai_chu_the = EXCLUDED.loai_chu_the,
                    ten_chu_the = EXCLUDED.ten_chu_the,
                    ma_so_dinh_danh = EXCLUDED.ma_so_dinh_danh,
                    dia_chi_lien_he = EXCLUDED.dia_chi_lien_he,
                    so_dien_thoai = EXCLUDED.so_dien_thoai,
                    email = EXCLUDED.email,
                    ho_ten_nguoi_ky = EXCLUDED.ho_ten_nguoi_ky,
                    chuc_vu_nguoi_ky = EXCLUDED.chuc_vu_nguoi_ky,
                    tu_cach_ky = EXCLUDED.tu_cach_ky,
                    can_cu_uy_quyen = EXCLUDED.can_cu_uy_quyen,
                    thong_tin_don_vi_quan_ly = EXCLUDED.thong_tin_don_vi_quan_ly,
                    so_tai_khoan = EXCLUDED.so_tai_khoan,
                    ten_ngan_hang = EXCLUDED.ten_ngan_hang,
                    chu_tai_khoan = EXCLUDED.chu_tai_khoan,
                    cap_nhat_luc = CURRENT_TIMESTAMP
                """;
        jdbcTemplate.update(
                sql,
                toaNhaId,
                req.loaiChuThe() != null ? req.loaiChuThe() : "CA_NHAN",
                req.tenChuThe(),
                req.maSoDinhDanh(),
                req.diaChiLienHe(),
                req.soDienThoai(),
                req.email(),
                req.hoTenNguoiKy(),
                req.chucVuNguoiKy(),
                req.tuCachKy() != null ? req.tuCachKy() : "CHU_SO_HUU",
                req.canCuUyQuyen(),
                req.thongTinDonViQuanLy(),
                req.soTaiKhoan(),
                req.tenNganHang(),
                req.chuTaiKhoan()
        );
    }

    private CauHinhBenA mapRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp ts = rs.getTimestamp("cap_nhat_luc");
        LocalDateTime capNhatLuc = ts != null ? ts.toLocalDateTime() : null;
        return new CauHinhBenA(
                rs.getLong("id"),
                rs.getLong("toa_nha_id"),
                rs.getString("loai_chu_the"),
                rs.getString("ten_chu_the"),
                rs.getString("ma_so_dinh_danh"),
                rs.getString("dia_chi_lien_he"),
                rs.getString("so_dien_thoai"),
                rs.getString("email"),
                rs.getString("ho_ten_nguoi_ky"),
                rs.getString("chuc_vu_nguoi_ky"),
                rs.getString("tu_cach_ky"),
                rs.getString("can_cu_uy_quyen"),
                rs.getString("thong_tin_don_vi_quan_ly"),
                rs.getString("so_tai_khoan"),
                rs.getString("ten_ngan_hang"),
                rs.getString("chu_tai_khoan"),
                capNhatLuc
        );
    }
}

