package com.prj1.ccm.taisan;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class TaiSanRepository {
    private final JdbcTemplate jdbcTemplate;

    public TaiSanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<TaiSanPhongDto> layDanhSachTaiSan(Long phongId) {
        String sql = """
                SELECT ts.id, ts.phong_id, p.so_phong, ts.ten_tai_san, ts.loai_tai_san,
                       ts.so_luong, ts.tinh_trang, ts.gia_tri_uoc_tinh, ts.ghi_chu, ts.ngay_lap
                FROM TAI_SAN_PHONG ts
                JOIN PHONG p ON ts.phong_id = p.id
                WHERE ts.phong_id = ?
                ORDER BY ts.id ASC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new TaiSanPhongDto(
                rs.getLong("id"),
                rs.getLong("phong_id"),
                rs.getString("so_phong"),
                rs.getString("ten_tai_san"),
                rs.getString("loai_tai_san"),
                rs.getInt("so_luong"),
                rs.getString("tinh_trang"),
                rs.getBigDecimal("gia_tri_uoc_tinh"),
                rs.getString("ghi_chu"),
                rs.getDate("ngay_lap").toLocalDate()
        ), phongId);
    }

    public Long themTaiSan(Long phongId, YeuCauKhaiBaoTaiSan yeuCau) {
        String sql = """
                INSERT INTO TAI_SAN_PHONG (phong_id, ten_tai_san, loai_tai_san, so_luong, tinh_trang, gia_tri_uoc_tinh, ghi_chu)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, phongId);
            ps.setString(2, yeuCau.tenTaiSan());
            ps.setString(3, yeuCau.loaiTaiSan() != null ? yeuCau.loaiTaiSan() : "KHAC");
            ps.setInt(4, yeuCau.soLuong() != null ? yeuCau.soLuong() : 1);
            ps.setString(5, yeuCau.tinhTrang() != null ? yeuCau.tinhTrang() : "HOAT_DONG_TOT");
            ps.setBigDecimal(6, yeuCau.giaTriUocTinh() != null ? yeuCau.giaTriUocTinh() : BigDecimal.ZERO);
            ps.setString(7, yeuCau.ghiChu());
            return ps;
        }, keyHolder);

        Number key = (Number) keyHolder.getKeys().get("id");
        return key.longValue();
    }

    public boolean xoaTaiSan(Long id) {
        return jdbcTemplate.update("DELETE FROM TAI_SAN_PHONG WHERE id = ?", id) > 0;
    }

    public Optional<Long> layPhongIdTheoHopDong(Long hopDongId) {
        String sql = "SELECT phong_id FROM HOP_DONG WHERE id = ?";
        List<Long> result = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong("phong_id"), hopDongId);
        return result.isEmpty() ? Optional.empty() : Optional.of(result.get(0));
    }

    public Optional<Long> layToaNhaIdTheoPhong(Long phongId) {
        String sql = "SELECT toa_nha_id FROM PHONG WHERE id = ?";
        List<Long> result = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong("toa_nha_id"), phongId);
        return result.isEmpty() ? Optional.empty() : Optional.of(result.get(0));
    }

    public record ThongTinHopDongTaiSan(Long hopDongId, Long phongId, Long toaNhaId, Long nguoiThueId) {}

    public record ThongTinKiemTraBienBan(
            Long id,
            Long hopDongId,
            Long phongId,
            Long toaNhaId,
            String loaiBienBan
    ) {}

    public Optional<ThongTinKiemTraBienBan> layThongTinKiemTraBienBan(Long bienBanId) {
        String sql = """
                SELECT bb.id, bb.hop_dong_id, bb.phong_id, p.toa_nha_id, bb.loai_bien_ban
                FROM BIEN_BAN_BAN_GIAO_TAI_SAN bb
                JOIN PHONG p ON bb.phong_id = p.id
                WHERE bb.id = ?
                """;
        List<ThongTinKiemTraBienBan> list = jdbcTemplate.query(sql, (rs, rowNum) -> new ThongTinKiemTraBienBan(
                rs.getLong("id"),
                rs.getLong("hop_dong_id"),
                rs.getLong("phong_id"),
                rs.getLong("toa_nha_id"),
                rs.getString("loai_bien_ban")
        ), bienBanId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<ThongTinHopDongTaiSan> layThongTinHopDongTaiSan(Long hopDongId) {
        String sql = """
                SELECT hd.id AS hop_dong_id, hd.phong_id, p.toa_nha_id, hd.nguoi_thue_id
                FROM HOP_DONG hd
                JOIN PHONG p ON p.id = hd.phong_id
                WHERE hd.id = ?
                """;
        List<ThongTinHopDongTaiSan> result = jdbcTemplate.query(sql, (rs, rowNum) -> new ThongTinHopDongTaiSan(
                rs.getLong("hop_dong_id"),
                rs.getLong("phong_id"),
                rs.getLong("toa_nha_id"),
                rs.getLong("nguoi_thue_id")
        ), hopDongId);
        return result.isEmpty() ? Optional.empty() : Optional.of(result.get(0));
    }

    public Optional<Long> layToaNhaIdTheoTaiSan(Long taiSanId) {
        String sql = """
                SELECT p.toa_nha_id
                FROM TAI_SAN_PHONG ts
                JOIN PHONG p ON p.id = ts.phong_id
                WHERE ts.id = ?
                """;
        List<Long> result = jdbcTemplate.query(sql, (rs, rowNum) -> rs.getLong("toa_nha_id"), taiSanId);
        return result.isEmpty() ? Optional.empty() : Optional.of(result.get(0));
    }

    public boolean kiemTraNguoiThueDangThuePhong(Long nguoiThueId, Long phongId) {
        String sql = """
                SELECT COUNT(*)
                FROM HOP_DONG
                WHERE nguoi_thue_id = ? AND phong_id = ? AND trang_thai IN ('CHO_KY', 'DA_COC', 'HIEU_LUC')
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, nguoiThueId, phongId);
        return count != null && count > 0;
    }

    public List<BienBanBanGiaoDto> layDanhSachBienBan(Long hopDongId) {
        String sql = """
                SELECT bb.id, bb.hop_dong_id, bb.phong_id, p.so_phong, bb.loai_bien_ban,
                       bb.ngay_thuc_hien, bb.nguoi_lap_id, nd.ho_ten as ten_nguoi_lap,
                       bb.ghi_chu_chung, bb.tong_tien_khau_tru, bb.tao_luc
                FROM BIEN_BAN_BAN_GIAO_TAI_SAN bb
                JOIN PHONG p ON bb.phong_id = p.id
                JOIN NGUOI_DUNG nd ON bb.nguoi_lap_id = nd.id
                WHERE bb.hop_dong_id = ?
                ORDER BY bb.id DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Long bbId = rs.getLong("id");
            List<ChiTietBienBanDto> chiTiet = layChiTietBienBan(bbId);
            return new BienBanBanGiaoDto(
                    bbId,
                    rs.getLong("hop_dong_id"),
                    rs.getLong("phong_id"),
                    rs.getString("so_phong"),
                    rs.getString("loai_bien_ban"),
                    rs.getDate("ngay_thuc_hien").toLocalDate(),
                    rs.getLong("nguoi_lap_id"),
                    rs.getString("ten_nguoi_lap"),
                    rs.getString("ghi_chu_chung"),
                    rs.getBigDecimal("tong_tien_khau_tru"),
                    rs.getTimestamp("tao_luc").toLocalDateTime(),
                    chiTiet
            );
        }, hopDongId);
    }

    public List<ChiTietBienBanDto> layChiTietBienBan(Long bienBanId) {
        String sql = """
                SELECT id, tai_san_id, ten_tai_san, so_luong, tinh_trang_luc_giao,
                       tinh_trang_luc_tra, tien_khau_tru, ly_do_khau_tru, anh_minh_chung
                FROM CHI_TIET_BIEN_BAN_TAI_SAN
                WHERE bien_ban_id = ?
                ORDER BY id ASC
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new ChiTietBienBanDto(
                rs.getLong("id"),
                rs.getObject("tai_san_id", Long.class),
                rs.getString("ten_tai_san"),
                rs.getInt("so_luong"),
                rs.getString("tinh_trang_luc_giao"),
                rs.getString("tinh_trang_luc_tra"),
                rs.getBigDecimal("tien_khau_tru"),
                rs.getString("ly_do_khau_tru"),
                rs.getString("anh_minh_chung")
        ), bienBanId);
    }

    public Long lapBienBan(Long hopDongId, Long phongId, Long nguoiLapId, YeuCauLapBienBan yeuCau) {
        BigDecimal tongKhauTru = BigDecimal.ZERO;
        if (yeuCau.chiTiet() != null) {
            for (YeuCauChiTietBienBan item : yeuCau.chiTiet()) {
                if (item.tienKhauTru() != null) {
                    tongKhauTru = tongKhauTru.add(item.tienKhauTru());
                }
            }
        }

        String sqlBienBan = """
                INSERT INTO BIEN_BAN_BAN_GIAO_TAI_SAN (hop_dong_id, phong_id, loai_bien_ban, ngay_thuc_hien, nguoi_lap_id, ghi_chu_chung, tong_tien_khau_tru)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        BigDecimal finalTongKhauTru = tongKhauTru;
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sqlBienBan, new String[]{"id"});
            ps.setLong(1, hopDongId);
            ps.setLong(2, phongId);
            ps.setString(3, yeuCau.loaiBienBan());
            ps.setDate(4, Date.valueOf(yeuCau.ngayThucHien() != null ? yeuCau.ngayThucHien() : LocalDate.now()));
            ps.setLong(5, nguoiLapId);
            ps.setString(6, yeuCau.ghiChuChung());
            ps.setBigDecimal(7, finalTongKhauTru);
            return ps;
        }, keyHolder);

        Number key = (Number) keyHolder.getKeys().get("id");
        Long bienBanId = key.longValue();

        if (yeuCau.chiTiet() != null && !yeuCau.chiTiet().isEmpty()) {
            String sqlChiTiet = """
                    INSERT INTO CHI_TIET_BIEN_BAN_TAI_SAN (bien_ban_id, tai_san_id, ten_tai_san, so_luong,
                                                          tinh_trang_luc_giao, tinh_trang_luc_tra, tien_khau_tru, ly_do_khau_tru, anh_minh_chung)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """;
            for (YeuCauChiTietBienBan ct : yeuCau.chiTiet()) {
                jdbcTemplate.update(sqlChiTiet,
                        bienBanId,
                        ct.taiSanId(),
                        ct.tenTaiSan(),
                        ct.soLuong() != null ? ct.soLuong() : 1,
                        ct.tinhTrangLucGiao() != null ? ct.tinhTrangLucGiao() : "HOAT_DONG_TOT",
                        ct.tinhTrangLucTra(),
                        ct.tienKhauTru() != null ? ct.tienKhauTru() : BigDecimal.ZERO,
                        ct.lyDoKhauTru(),
                        ct.anhMinhChung()
                );
            }
        }

        return bienBanId;
    }
}
