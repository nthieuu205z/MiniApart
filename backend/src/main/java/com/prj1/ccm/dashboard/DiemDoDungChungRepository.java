package com.prj1.ccm.dashboard;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class DiemDoDungChungRepository {
    private final JdbcTemplate jdbcTemplate;

    public DiemDoDungChungRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DiemDoRecord> findByToaNha(Long toaNhaId) {
        return jdbcTemplate.query(
                """
                SELECT id, toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi,
                       loai_diem_do, khu_vuc, cong_to_cha_id, don_gia_mua, hoat_dong, ngay_lap_dat
                FROM DIEM_DO_DUNG_CHUNG
                WHERE toa_nha_id = ?
                ORDER BY loai_diem_do ASC, khu_vuc ASC, ma_cong_to ASC
                """,
                this::mapDiemDo,
                toaNhaId
        );
    }

    public Optional<DiemDoRecord> findById(Long id) {
        List<DiemDoRecord> list = jdbcTemplate.query(
                """
                SELECT id, toa_nha_id, ma_cong_to, ten_cong_to, loai_dich_vu, don_vi,
                       loai_diem_do, khu_vuc, cong_to_cha_id, don_gia_mua, hoat_dong, ngay_lap_dat
                FROM DIEM_DO_DUNG_CHUNG
                WHERE id = ?
                """,
                this::mapDiemDo,
                id
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<ChiSoDungChungRecord> findChiSoByKy(Long kyId) {
        return jdbcTemplate.query(
                """
                SELECT cs.id, cs.diem_do_id, cs.ky_id, cs.chi_so_dau, cs.chi_so_cuoi, cs.muc_tieu_thu,
                       cs.co_thay_cong_to, cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau_cong_to_moi,
                       cs.nguoi_ghi_id, cs.thoi_diem_ghi, cs.ghi_chu,
                       dd.toa_nha_id, dd.ma_cong_to, dd.ten_cong_to, dd.loai_dich_vu, dd.don_vi,
                       dd.loai_diem_do, dd.khu_vuc, dd.don_gia_mua
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                WHERE cs.ky_id = ?
                ORDER BY dd.loai_diem_do ASC, dd.khu_vuc ASC, dd.ma_cong_to ASC
                """,
                this::mapChiSo,
                kyId
        );
    }

    public List<ChiSoDungChungRecord> findLichSuByDiemDo(Long diemDoId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT cs.id, cs.diem_do_id, cs.ky_id, cs.chi_so_dau, cs.chi_so_cuoi, cs.muc_tieu_thu,
                       cs.co_thay_cong_to, cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau_cong_to_moi,
                       cs.nguoi_ghi_id, cs.thoi_diem_ghi, cs.ghi_chu,
                       dd.toa_nha_id, dd.ma_cong_to, dd.ten_cong_to, dd.loai_dich_vu, dd.don_vi,
                       dd.loai_diem_do, dd.khu_vuc, dd.don_gia_mua
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                JOIN KY_THANH_TOAN k ON k.id = cs.ky_id
                WHERE cs.diem_do_id = ?
                ORDER BY k.nam DESC, k.thang DESC
                LIMIT ?
                """,
                this::mapChiSo,
                diemDoId,
                limit
        );
    }

    public Optional<ChiSoDungChungRecord> findChiSoByDiemDoVaKy(Long diemDoId, Long kyId) {
        List<ChiSoDungChungRecord> list = jdbcTemplate.query(
                """
                SELECT cs.id, cs.diem_do_id, cs.ky_id, cs.chi_so_dau, cs.chi_so_cuoi, cs.muc_tieu_thu,
                       cs.co_thay_cong_to, cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau_cong_to_moi,
                       cs.nguoi_ghi_id, cs.thoi_diem_ghi, cs.ghi_chu,
                       dd.toa_nha_id, dd.ma_cong_to, dd.ten_cong_to, dd.loai_dich_vu, dd.don_vi,
                       dd.loai_diem_do, dd.khu_vuc, dd.don_gia_mua
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                WHERE cs.diem_do_id = ? AND cs.ky_id = ?
                """,
                this::mapChiSo,
                diemDoId,
                kyId
        );
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<ChiSoDungChungRecord> findChiSoCacKyTruoc(Long diemDoId, Long kyId, int limit) {
        return jdbcTemplate.query(
                """
                SELECT cs.id, cs.diem_do_id, cs.ky_id, cs.chi_so_dau, cs.chi_so_cuoi, cs.muc_tieu_thu,
                       cs.co_thay_cong_to, cs.chi_so_cuoi_cong_to_cu, cs.chi_so_dau_cong_to_moi,
                       cs.nguoi_ghi_id, cs.thoi_diem_ghi, cs.ghi_chu,
                       dd.toa_nha_id, dd.ma_cong_to, dd.ten_cong_to, dd.loai_dich_vu, dd.don_vi,
                       dd.loai_diem_do, dd.khu_vuc, dd.don_gia_mua
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN DIEM_DO_DUNG_CHUNG dd ON dd.id = cs.diem_do_id
                JOIN KY_THANH_TOAN k ON k.id = cs.ky_id
                JOIN KY_THANH_TOAN k_cur ON k_cur.id = ?
                WHERE cs.diem_do_id = ?
                  AND (k.nam < k_cur.nam OR (k.nam = k_cur.nam AND k.thang < k_cur.thang))
                ORDER BY k.nam DESC, k.thang DESC
                LIMIT ?
                """,
                this::mapChiSo,
                kyId,
                diemDoId,
                limit
        );
    }

    public Optional<BigDecimal> findChiSoCuoiKyTruoc(Long diemDoId, Long kyId) {
        List<BigDecimal> list = jdbcTemplate.query(
                """
                SELECT cs.chi_so_cuoi
                FROM CHI_SO_DUNG_CHUNG cs
                JOIN KY_THANH_TOAN k ON k.id = cs.ky_id
                JOIN KY_THANH_TOAN k_cur ON k_cur.id = ?
                WHERE cs.diem_do_id = ?
                  AND (k.nam < k_cur.nam OR (k.nam = k_cur.nam AND k.thang < k_cur.thang))
                ORDER BY k.nam DESC, k.thang DESC
                LIMIT 1
                """,
                (rs, rowNum) -> rs.getBigDecimal("chi_so_cuoi"),
                kyId,
                diemDoId
        );
        return list.isEmpty() ? Optional.empty() : Optional.ofNullable(list.get(0));
    }

    public void luuChiSo(
            Long diemDoId,
            Long kyId,
            BigDecimal chiSoDau,
            BigDecimal chiSoCuoi,
            BigDecimal mucTieuThu,
            boolean coThayCongTo,
            BigDecimal chiSoCuoiCongToCu,
            BigDecimal chiSoDauCongToMoi,
            Long nguoiGhiId,
            String ghiChu
    ) {
        jdbcTemplate.update(
                """
                INSERT INTO CHI_SO_DUNG_CHUNG (
                    diem_do_id, ky_id, chi_so_dau, chi_so_cuoi, muc_tieu_thu,
                    co_thay_cong_to, chi_so_cuoi_cong_to_cu, chi_so_dau_cong_to_moi,
                    nguoi_ghi_id, ghi_chu
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (diem_do_id, ky_id) DO UPDATE SET
                    chi_so_dau = EXCLUDED.chi_so_dau,
                    chi_so_cuoi = EXCLUDED.chi_so_cuoi,
                    muc_tieu_thu = EXCLUDED.muc_tieu_thu,
                    co_thay_cong_to = EXCLUDED.co_thay_cong_to,
                    chi_so_cuoi_cong_to_cu = EXCLUDED.chi_so_cuoi_cong_to_cu,
                    chi_so_dau_cong_to_moi = EXCLUDED.chi_so_dau_cong_to_moi,
                    nguoi_ghi_id = EXCLUDED.nguoi_ghi_id,
                    ghi_chu = EXCLUDED.ghi_chu,
                    thoi_diem_ghi = CURRENT_TIMESTAMP
                """,
                diemDoId,
                kyId,
                chiSoDau,
                chiSoCuoi,
                mucTieuThu,
                coThayCongTo,
                chiSoCuoiCongToCu,
                chiSoDauCongToMoi,
                nguoiGhiId,
                ghiChu
        );
    }

    private DiemDoRecord mapDiemDo(ResultSet rs, int rowNum) throws SQLException {
        return new DiemDoRecord(
                rs.getLong("id"),
                rs.getLong("toa_nha_id"),
                rs.getString("ma_cong_to"),
                rs.getString("ten_cong_to"),
                rs.getString("loai_dich_vu"),
                rs.getString("don_vi"),
                rs.getString("loai_diem_do"),
                rs.getString("khu_vuc"),
                rs.getObject("cong_to_cha_id", Long.class),
                rs.getBigDecimal("don_gia_mua"),
                rs.getBoolean("hoat_dong"),
                rs.getObject("ngay_lap_dat", LocalDate.class)
        );
    }

    private ChiSoDungChungRecord mapChiSo(ResultSet rs, int rowNum) throws SQLException {
        return new ChiSoDungChungRecord(
                rs.getLong("id"),
                rs.getLong("diem_do_id"),
                rs.getLong("ky_id"),
                rs.getBigDecimal("chi_so_dau"),
                rs.getBigDecimal("chi_so_cuoi"),
                rs.getBigDecimal("muc_tieu_thu"),
                rs.getBoolean("co_thay_cong_to"),
                rs.getBigDecimal("chi_so_cuoi_cong_to_cu"),
                rs.getBigDecimal("chi_so_dau_cong_to_moi"),
                rs.getLong("nguoi_ghi_id"),
                rs.getString("ghi_chu"),
                rs.getLong("toa_nha_id"),
                rs.getString("ma_cong_to"),
                rs.getString("ten_cong_to"),
                rs.getString("loai_dich_vu"),
                rs.getString("don_vi"),
                rs.getString("loai_diem_do"),
                rs.getString("khu_vuc"),
                rs.getBigDecimal("don_gia_mua")
        );
    }

    public record DiemDoRecord(
            Long id,
            Long toaNhaId,
            String maCongTo,
            String tenCongTo,
            String loaiDichVu,
            String donVi,
            String loaiDiemDo,
            String khuVuc,
            Long congToChaId,
            BigDecimal donGiaMua,
            boolean hoatDong,
            LocalDate ngayLapDat
    ) {}

    public record ChiSoDungChungRecord(
            Long id,
            Long diemDoId,
            Long kyId,
            BigDecimal chiSoDau,
            BigDecimal chiSoCuoi,
            BigDecimal mucTieuThu,
            boolean coThayCongTo,
            BigDecimal chiSoCuoiCongToCu,
            BigDecimal chiSoDauCongToMoi,
            Long nguoiGhiId,
            String ghiChu,
            Long toaNhaId,
            String maCongTo,
            String tenCongTo,
            String loaiDichVu,
            String donVi,
            String loaiDiemDo,
            String khuVuc,
            BigDecimal donGiaMua
    ) {}
}

