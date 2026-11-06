package com.prj1.ccm.suachua;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class BaoGiaSuaChuaRepository {
    private final JdbcTemplate jdbcTemplate;

    public BaoGiaSuaChuaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String sinhMaBaoGia(Long yeuCauId, int phienBan) {
        Long seq = jdbcTemplate.queryForObject("SELECT nextval('bao_gia_sua_chua_ma_seq')", Long.class);
        return String.format("BG-%06d-v%d", seq != null ? seq : System.currentTimeMillis() % 1000000, phienBan);
    }

    public int layPhienBanTiepTheo(Long yeuCauId) {
        Integer maxVersion = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(phien_ban), 0) FROM BAO_GIA_SUA_CHUA WHERE yeu_cau_id = ?",
                Integer.class, yeuCauId
        );
        return (maxVersion != null ? maxVersion : 0) + 1;
    }

    public Long insertBaoGia(BaoGiaSuaChua bg) {
        Long id = jdbcTemplate.queryForObject(
                """
                INSERT INTO BAO_GIA_SUA_CHUA (
                    ma_bao_gia, yeu_cau_id, phien_ban, trang_thai, tong_tien,
                    mo_ta, ghi_chu, ly_do_tu_choi, nguoi_tao_id, tao_luc,
                    nguoi_duyet_id, duyet_luc, fixture_key
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                bg.maBaoGia(),
                bg.yeuCauId(),
                bg.phienBan(),
                bg.trangThai().name(),
                bg.tongTien(),
                bg.moTa(),
                bg.ghiChu(),
                bg.lyDoTuChoi(),
                bg.nguoiTaoId(),
                Timestamp.from(bg.taoLuc()),
                bg.nguoiDuyetId(),
                bg.duyetLuc() != null ? Timestamp.from(bg.duyetLuc()) : null,
                bg.fixtureKey()
        );

        if (bg.dongBaoGia() != null && !bg.dongBaoGia().isEmpty() && id != null) {
            insertDongBaoGia(id, bg.dongBaoGia());
        }
        return id;
    }

    public void insertDongBaoGia(Long baoGiaId, List<DongBaoGia> danhSachDong) {
        for (int i = 0; i < danhSachDong.size(); i++) {
            DongBaoGia dong = danhSachDong.get(i);
            jdbcTemplate.update(
                    """
                    INSERT INTO DONG_BAO_GIA_SUA_CHUA (
                        bao_gia_id, thu_tu, ten_hang_muc, so_luong, don_vi, don_gia, thanh_tien
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    baoGiaId,
                    dong.thuTu() > 0 ? dong.thuTu() : (i + 1),
                    dong.tenHangMuc(),
                    dong.soLuong(),
                    dong.donVi(),
                    dong.donGia(),
                    dong.thanhTien()
            );
        }
    }

    public Optional<BaoGiaSuaChua> findById(Long id) {
        List<BaoGiaSuaChua> list = jdbcTemplate.query(
                "SELECT * FROM BAO_GIA_SUA_CHUA WHERE id = ?",
                (rs, rowNum) -> mapBaoGia(rs),
                id
        );
        if (list.isEmpty()) {
            return Optional.empty();
        }
        BaoGiaSuaChua bg = list.getFirst();
        List<DongBaoGia> dong = findDongByBaoGiaId(bg.id());
        return Optional.of(new BaoGiaSuaChua(
                bg.id(), bg.maBaoGia(), bg.yeuCauId(), bg.phienBan(), bg.trangThai(),
                bg.tongTien(), bg.moTa(), bg.ghiChu(), bg.lyDoTuChoi(),
                bg.nguoiTaoId(), bg.taoLuc(), bg.nguoiDuyetId(), bg.duyetLuc(),
                bg.fixtureKey(), dong
        ));
    }

    public List<BaoGiaSuaChua> findByYeuCauId(Long yeuCauId) {
        List<BaoGiaSuaChua> list = jdbcTemplate.query(
                "SELECT * FROM BAO_GIA_SUA_CHUA WHERE yeu_cau_id = ? ORDER BY phien_ban ASC",
                (rs, rowNum) -> mapBaoGia(rs),
                yeuCauId
        );
        List<BaoGiaSuaChua> ketQua = new ArrayList<>(list.size());
        for (BaoGiaSuaChua bg : list) {
            ketQua.add(new BaoGiaSuaChua(
                    bg.id(), bg.maBaoGia(), bg.yeuCauId(), bg.phienBan(), bg.trangThai(),
                    bg.tongTien(), bg.moTa(), bg.ghiChu(), bg.lyDoTuChoi(),
                    bg.nguoiTaoId(), bg.taoLuc(), bg.nguoiDuyetId(), bg.duyetLuc(),
                    bg.fixtureKey(), findDongByBaoGiaId(bg.id())
            ));
        }
        return ketQua;
    }

    public Optional<BaoGiaSuaChua> findBaoGiaHieuLuc(Long yeuCauId) {
        List<BaoGiaSuaChua> list = jdbcTemplate.query(
                "SELECT * FROM BAO_GIA_SUA_CHUA WHERE yeu_cau_id = ? AND trang_thai = 'DA_DUYET' LIMIT 1",
                (rs, rowNum) -> mapBaoGia(rs),
                yeuCauId
        );
        if (list.isEmpty()) {
            return Optional.empty();
        }
        BaoGiaSuaChua bg = list.getFirst();
        return Optional.of(new BaoGiaSuaChua(
                bg.id(), bg.maBaoGia(), bg.yeuCauId(), bg.phienBan(), bg.trangThai(),
                bg.tongTien(), bg.moTa(), bg.ghiChu(), bg.lyDoTuChoi(),
                bg.nguoiTaoId(), bg.taoLuc(), bg.nguoiDuyetId(), bg.duyetLuc(),
                bg.fixtureKey(), findDongByBaoGiaId(bg.id())
        ));
    }

    public List<DongBaoGia> findDongByBaoGiaId(Long baoGiaId) {
        return jdbcTemplate.query(
                "SELECT * FROM DONG_BAO_GIA_SUA_CHUA WHERE bao_gia_id = ? ORDER BY thu_tu ASC, id ASC",
                (rs, rowNum) -> new DongBaoGia(
                        rs.getLong("id"),
                        rs.getLong("bao_gia_id"),
                        rs.getInt("thu_tu"),
                        rs.getString("ten_hang_muc"),
                        rs.getBigDecimal("so_luong"),
                        rs.getString("don_vi"),
                        rs.getBigDecimal("don_gia"),
                        rs.getBigDecimal("thanh_tien")
                ),
                baoGiaId
        );
    }

    public int capNhatTrangThai(Long baoGiaId, TrangThaiBaoGia trangThai) {
        return jdbcTemplate.update(
                "UPDATE BAO_GIA_SUA_CHUA SET trang_thai = ? WHERE id = ?",
                trangThai.name(), baoGiaId
        );
    }

    public void duyetBaoGia(Long baoGiaId, Long yeuCauId, Long nguoiDuyetId, Instant duyetLuc) {
        // Mark any prior active or pending quote as BI_THAY_THE
        jdbcTemplate.update(
                """
                UPDATE BAO_GIA_SUA_CHUA
                SET trang_thai = 'BI_THAY_THE'
                WHERE yeu_cau_id = ? AND id <> ? AND trang_thai IN ('DA_DUYET', 'CHO_DUYET')
                """,
                yeuCauId, baoGiaId
        );
        // Approve this version
        jdbcTemplate.update(
                """
                UPDATE BAO_GIA_SUA_CHUA
                SET trang_thai = 'DA_DUYET', nguoi_duyet_id = ?, duyet_luc = ?
                WHERE id = ?
                """,
                nguoiDuyetId, Timestamp.from(duyetLuc), baoGiaId
        );
    }

    public void tuChoiBaoGia(Long baoGiaId, String lyDo, Long nguoiDuyetId, Instant duyetLuc) {
        jdbcTemplate.update(
                """
                UPDATE BAO_GIA_SUA_CHUA
                SET trang_thai = 'TU_CHOI', ly_do_tu_choi = ?, nguoi_duyet_id = ?, duyet_luc = ?
                WHERE id = ?
                """,
                lyDo, nguoiDuyetId, Timestamp.from(duyetLuc), baoGiaId
        );
    }

    private BaoGiaSuaChua mapBaoGia(ResultSet rs) throws SQLException {
        Timestamp taoLuc = rs.getTimestamp("tao_luc");
        Timestamp duyetLuc = rs.getTimestamp("duyet_luc");
        long nguoiDuyet = rs.getLong("nguoi_duyet_id");
        Long nguoiDuyetId = rs.wasNull() ? null : nguoiDuyet;

        return new BaoGiaSuaChua(
                rs.getLong("id"),
                rs.getString("ma_bao_gia"),
                rs.getLong("yeu_cau_id"),
                rs.getInt("phien_ban"),
                TrangThaiBaoGia.valueOf(rs.getString("trang_thai")),
                rs.getBigDecimal("tong_tien"),
                rs.getString("mo_ta"),
                rs.getString("ghi_chu"),
                rs.getString("ly_do_tu_choi"),
                rs.getLong("nguoi_tao_id"),
                taoLuc != null ? taoLuc.toInstant() : Instant.EPOCH,
                nguoiDuyetId,
                duyetLuc != null ? duyetLuc.toInstant() : null,
                rs.getString("fixture_key"),
                List.of()
        );
    }
}
