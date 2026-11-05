package com.prj1.ccm.publicportal;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public class PublicPortalRepository {
    private final JdbcTemplate jdbcTemplate;

    public PublicPortalRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PublicToaNhaDto> layDanhSachToaNha() {
        String sql = """
                SELECT t.id, t.ma_toa, t.ten, t.dia_chi, t.so_tang,
                       COUNT(p.id) FILTER (WHERE p.trang_thai = 'TRONG') AS so_phong_trong
                FROM TOA_NHA t
                LEFT JOIN PHONG p ON p.toa_nha_id = t.id
                GROUP BY t.id, t.ma_toa, t.ten, t.dia_chi, t.so_tang
                ORDER BY t.id
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new PublicToaNhaDto(
                rs.getLong("id"),
                rs.getString("ma_toa"),
                rs.getString("ten"),
                rs.getString("dia_chi"),
                rs.getInt("so_tang"),
                rs.getInt("so_phong_trong")
        ));
    }

    public List<PublicPhongDto> layDanhSachPhong(
            Long toaNhaId,
            BigDecimal giaTu,
            BigDecimal giaDen,
            String loaiPhong,
            String tuKhoa,
            Boolean chiPhongTrong
    ) {
        StringBuilder sql = new StringBuilder("""
                SELECT p.id, p.toa_nha_id, t.ten AS ten_toa, t.dia_chi AS dia_chi_toa,
                       p.so_phong, p.tang, p.dien_tich, p.suc_chua, p.gia_thue_mac_dinh,
                       p.loai_phong, p.trang_thai, p.tien_ich, p.mo_ta, p.anh_dai_dien
                FROM PHONG p
                JOIN TOA_NHA t ON p.toa_nha_id = t.id
                WHERE 1=1
                """);
        List<Object> params = new ArrayList<>();

        if (chiPhongTrong == null || chiPhongTrong) {
            sql.append(" AND p.trang_thai IN ('TRONG', 'DA_COC')");
        }

        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }

        if (giaTu != null) {
            sql.append(" AND p.gia_thue_mac_dinh >= ?");
            params.add(giaTu);
        }

        if (giaDen != null) {
            sql.append(" AND p.gia_thue_mac_dinh <= ?");
            params.add(giaDen);
        }

        if (loaiPhong != null && !loaiPhong.isBlank()) {
            sql.append(" AND LOWER(p.loai_phong) LIKE ?");
            params.add("%" + loaiPhong.trim().toLowerCase() + "%");
        }

        if (tuKhoa != null && !tuKhoa.isBlank()) {
            sql.append(" AND (LOWER(p.so_phong) LIKE ? OR LOWER(t.ten) LIKE ? OR LOWER(COALESCE(p.tien_ich, '')) LIKE ?)");
            String pattern = "%" + tuKhoa.trim().toLowerCase() + "%";
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }

        sql.append(" ORDER BY p.toa_nha_id, p.tang, p.so_phong");

        List<PublicPhongDto> dsPhong = jdbcTemplate.query(sql.toString(), (rs, rowNum) -> {
            String tienIchStr = rs.getString("tien_ich");
            List<String> tienIchList = parseTienIch(tienIchStr);
            String trangThai = rs.getString("trang_thai");
            String nhanTrangThai = switch (trangThai) {
                case "TRONG" -> "Đang trống · Ở ngay";
                case "DA_COC" -> "Đã giữ cọc";
                case "DANG_THUE" -> "Đang thuê";
                case "DANG_SUA" -> "Đang sửa chữa";
                default -> "Ngừng cho thuê";
            };

            return new PublicPhongDto(
                    rs.getLong("id"),
                    rs.getLong("toa_nha_id"),
                    rs.getString("ten_toa"),
                    rs.getString("dia_chi_toa"),
                    rs.getString("so_phong"),
                    rs.getInt("tang"),
                    rs.getBigDecimal("dien_tich"),
                    rs.getInt("suc_chua"),
                    rs.getBigDecimal("gia_thue_mac_dinh"),
                    rs.getString("loai_phong"),
                    trangThai,
                    nhanTrangThai,
                    tienIchList,
                    rs.getString("mo_ta"),
                    rs.getString("anh_dai_dien"),
                    Collections.emptyList()
            );
        }, params.toArray());

        // Gắn bảng giá dịch vụ cho từng phòng
        Map<Long, List<DichVuCongKhaiDto>> cacheBangGia = new HashMap<>();
        List<PublicPhongDto> ketQua = new ArrayList<>(dsPhong.size());
        for (PublicPhongDto phong : dsPhong) {
            List<DichVuCongKhaiDto> bangGia = cacheBangGia.computeIfAbsent(
                    phong.toaNhaId(),
                    this::layBangGiaDichVuCuaToa
            );
            ketQua.add(new PublicPhongDto(
                    phong.id(), phong.toaNhaId(), phong.tenToaNha(), phong.diaChiToaNha(),
                    phong.soPhong(), phong.tang(), phong.dienTich(), phong.sucChua(),
                    phong.giaThue(), phong.loaiPhong(), phong.trangThai(), phong.nhanTrangThai(),
                    phong.tienIch(), phong.moTa(), phong.anhDaiDien(), bangGia
            ));
        }

        return ketQua;
    }

    public Optional<PublicPhongDto> layChiTietPhong(Long phongId) {
        String sql = """
                SELECT p.id, p.toa_nha_id, t.ten AS ten_toa, t.dia_chi AS dia_chi_toa,
                       p.so_phong, p.tang, p.dien_tich, p.suc_chua, p.gia_thue_mac_dinh,
                       p.loai_phong, p.trang_thai, p.tien_ich, p.mo_ta, p.anh_dai_dien
                FROM PHONG p
                JOIN TOA_NHA t ON p.toa_nha_id = t.id
                WHERE p.id = ?
                """;
        List<PublicPhongDto> ketQua = jdbcTemplate.query(sql, (rs, rowNum) -> {
            String trangThai = rs.getString("trang_thai");
            String nhanTrangThai = switch (trangThai) {
                case "TRONG" -> "Đang trống · Ở ngay";
                case "DA_COC" -> "Đã giữ cọc";
                case "DANG_THUE" -> "Đang thuê";
                case "DANG_SUA" -> "Đang sửa chữa";
                default -> "Ngừng cho thuê";
            };
            Long toaNhaId = rs.getLong("toa_nha_id");
            List<DichVuCongKhaiDto> bangGia = layBangGiaDichVuCuaToa(toaNhaId);

            return new PublicPhongDto(
                    rs.getLong("id"),
                    toaNhaId,
                    rs.getString("ten_toa"),
                    rs.getString("dia_chi_toa"),
                    rs.getString("so_phong"),
                    rs.getInt("tang"),
                    rs.getBigDecimal("dien_tich"),
                    rs.getInt("suc_chua"),
                    rs.getBigDecimal("gia_thue_mac_dinh"),
                    rs.getString("loai_phong"),
                    trangThai,
                    nhanTrangThai,
                    parseTienIch(rs.getString("tien_ich")),
                    rs.getString("mo_ta"),
                    rs.getString("anh_dai_dien"),
                    bangGia
            );
        }, phongId);

        return ketQua.isEmpty() ? Optional.empty() : Optional.of(ketQua.get(0));
    }

    public List<DichVuCongKhaiDto> layBangGiaDichVuCuaToa(Long toaNhaId) {
        String sql = """
                SELECT d.id, d.ten, d.don_vi, d.cach_tinh, d.che_do_gia, bg.don_gia
                FROM DICH_VU d
                LEFT JOIN LATERAL (
                    SELECT don_gia
                    FROM BANG_GIA bg
                    WHERE bg.dich_vu_id = d.id AND bg.ngay_hieu_luc <= CURRENT_DATE
                    ORDER BY bg.ngay_hieu_luc DESC
                    LIMIT 1
                ) bg ON TRUE
                WHERE d.toa_nha_id = ? AND d.dang_su_dung = TRUE
                ORDER BY d.id
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> new DichVuCongKhaiDto(
                rs.getLong("id"),
                rs.getString("ten"),
                rs.getString("don_vi"),
                rs.getBigDecimal("don_gia"),
                rs.getString("cach_tinh"),
                rs.getString("che_do_gia")
        ), toaNhaId);
    }

    public Long luuLichHen(YeuCauDatLichHen yeuCau) {
        String sql = """
                INSERT INTO LICH_HEN_XEM_PHONG (
                    ho_ten, so_dien_thoai, email, phong_id, toa_nha_id, thoi_gian_hen, ghi_chu, trang_thai
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'CHO_XAC_NHAN')
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, yeuCau.hoTen().trim());
            ps.setString(2, yeuCau.soDienThoai().trim());
            ps.setString(3, yeuCau.email() == null ? null : yeuCau.email().trim());
            if (yeuCau.phongId() != null) {
                ps.setLong(4, yeuCau.phongId());
            } else {
                ps.setNull(4, java.sql.Types.BIGINT);
            }
            ps.setLong(5, yeuCau.toaNhaId());
            ps.setTimestamp(6, Timestamp.valueOf(yeuCau.thoiGianHen()));
            ps.setString(7, yeuCau.ghiChu() == null ? null : yeuCau.ghiChu().trim());
            return ps;
        }, keyHolder);

        Map<String, Object> keys = keyHolder.getKeys();
        if (keys != null && keys.containsKey("id")) {
            return ((Number) keys.get("id")).longValue();
        }
        Number key = keyHolder.getKey();
        return key != null ? key.longValue() : 1L;
    }

    public boolean toaNhaTonTai(Long toaNhaId) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject("SELECT EXISTS(SELECT 1 FROM TOA_NHA WHERE id = ?)", Boolean.class, toaNhaId));
    }

    public boolean phongThuocToa(Long phongId, Long toaNhaId) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject("SELECT EXISTS(SELECT 1 FROM PHONG WHERE id = ? AND toa_nha_id = ?)", Boolean.class, phongId, toaNhaId));
    }

    public Optional<Long> timToaNhaCuaPhong(Long id) {
        return jdbcTemplate.query("SELECT toa_nha_id FROM PHONG WHERE id = ?", (rs, row) -> rs.getLong(1), id).stream().findFirst();
    }

    public Optional<Long> timToaNhaCuaLichHen(Long id) {
        return jdbcTemplate.query("SELECT toa_nha_id FROM LICH_HEN_XEM_PHONG WHERE id = ?", (rs, row) -> rs.getLong(1), id).stream().findFirst();
    }

    public List<LichHenXemPhongDto> layDanhSachLichHen(Long toaNhaId, Long nguoiDungId) {
        StringBuilder sql = new StringBuilder("""
                SELECT lh.id, lh.ho_ten, lh.so_dien_thoai, lh.email, lh.phong_id, p.so_phong,
                       lh.toa_nha_id, t.ten AS ten_toa, lh.thoi_gian_hen, lh.ghi_chu, lh.trang_thai, lh.tao_luc
                FROM LICH_HEN_XEM_PHONG lh
                JOIN TOA_NHA t ON lh.toa_nha_id = t.id
                LEFT JOIN PHONG p ON lh.phong_id = p.id
                WHERE EXISTS (SELECT 1 FROM PHAN_QUYEN_TOA pqt WHERE pqt.toa_nha_id = lh.toa_nha_id AND pqt.nguoi_dung_id = ?)
                """);
        List<Object> params = new ArrayList<>();
        params.add(nguoiDungId);
        if (toaNhaId != null) {
            sql.append(" AND lh.toa_nha_id = ?");
            params.add(toaNhaId);
        }
        sql.append(" ORDER BY lh.thoi_gian_hen DESC, lh.tao_luc DESC");

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> new LichHenXemPhongDto(
                rs.getLong("id"),
                rs.getString("ho_ten"),
                rs.getString("so_dien_thoai"),
                rs.getString("email"),
                rs.getObject("phong_id", Long.class),
                rs.getString("so_phong"),
                rs.getLong("toa_nha_id"),
                rs.getString("ten_toa"),
                rs.getTimestamp("thoi_gian_hen").toLocalDateTime(),
                rs.getString("ghi_chu"),
                rs.getString("trang_thai"),
                rs.getTimestamp("tao_luc").toLocalDateTime()
        ), params.toArray());
    }

    public boolean capNhatTrangThaiLichHen(Long id, String trangThaiMoi, Long nguoiDungId) {
        String sql = """
                UPDATE LICH_HEN_XEM_PHONG
                SET trang_thai = ?, cap_nhat_luc = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND EXISTS (SELECT 1 FROM PHAN_QUYEN_TOA pqt WHERE pqt.toa_nha_id = LICH_HEN_XEM_PHONG.toa_nha_id AND pqt.nguoi_dung_id = ?)
                """;
        return jdbcTemplate.update(sql, trangThaiMoi, id, nguoiDungId) > 0;
    }

    private static List<String> parseTienIch(String tienIchStr) {
        if (tienIchStr == null || tienIchStr.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(tienIchStr.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
