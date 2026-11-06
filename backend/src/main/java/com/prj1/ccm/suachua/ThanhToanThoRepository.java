package com.prj1.ccm.suachua;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class ThanhToanThoRepository {
    private final JdbcTemplate jdbcTemplate;

    public ThanhToanThoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String sinhMaThanhToan() {
        Long seq = jdbcTemplate.queryForObject("SELECT nextval('thanh_toan_tho_ma_seq')", Long.class);
        return String.format("TTT-%06d", seq != null ? seq : System.currentTimeMillis() % 1000000);
    }

    public Long insert(ThanhToanTho tt) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO THANH_TOAN_THO (
                    ma_thanh_toan, yeu_cau_id, bao_gia_id, so_tien, phuong_thuc,
                    ma_tham_chieu, nguoi_xac_nhan_id, xac_nhan_luc, ghi_chu, fixture_key
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                tt.maThanhToan(),
                tt.yeuCauId(),
                tt.baoGiaId(),
                tt.soTien(),
                tt.phuongThuc().name(),
                tt.maThamChieu(),
                tt.nguoiXacNhanId(),
                Timestamp.from(tt.xacNhanLuc()),
                tt.ghiChu(),
                tt.fixtureKey()
        );
    }

    public List<ThanhToanTho> findByYeuCauId(Long yeuCauId) {
        return jdbcTemplate.query(
                "SELECT * FROM THANH_TOAN_THO WHERE yeu_cau_id = ? ORDER BY xac_nhan_luc ASC, id ASC",
                (rs, rowNum) -> mapThanhToan(rs),
                yeuCauId
        );
    }

    public BigDecimal tinhTongDaThanhToan(Long yeuCauId) {
        BigDecimal sum = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(so_tien), 0) FROM THANH_TOAN_THO WHERE yeu_cau_id = ?",
                BigDecimal.class,
                yeuCauId
        );
        return sum != null ? sum : BigDecimal.ZERO;
    }

    public BigDecimal tinhTongTienNhanCuaTho(Long thoId, Instant tuLuc, Instant denLuc, Long toaNhaId) {
        StringBuilder sql = new StringBuilder("""
                SELECT COALESCE(SUM(tt.so_tien), 0)
                FROM THANH_TOAN_THO tt
                JOIN YEU_CAU_SUA_CHUA yc ON yc.id = tt.yeu_cau_id
                JOIN PHONG p ON p.id = yc.phong_id
                WHERE yc.nguoi_xu_ly_id = ?
                """);
        var params = new java.util.ArrayList<Object>();
        params.add(thoId);

        if (tuLuc != null) {
            sql.append(" AND tt.xac_nhan_luc >= ?");
            params.add(Timestamp.from(tuLuc));
        }
        if (denLuc != null) {
            sql.append(" AND tt.xac_nhan_luc <= ?");
            params.add(Timestamp.from(denLuc));
        }
        if (toaNhaId != null) {
            sql.append(" AND p.toa_nha_id = ?");
            params.add(toaNhaId);
        }

        BigDecimal res = jdbcTemplate.queryForObject(sql.toString(), BigDecimal.class, params.toArray());
        return res != null ? res : BigDecimal.ZERO;
    }

    private ThanhToanTho mapThanhToan(ResultSet rs) throws SQLException {
        Timestamp xacNhan = rs.getTimestamp("xac_nhan_luc");
        long bgId = rs.getLong("bao_gia_id");
        Long baoGiaId = rs.wasNull() ? null : bgId;

        return new ThanhToanTho(
                rs.getLong("id"),
                rs.getString("ma_thanh_toan"),
                rs.getLong("yeu_cau_id"),
                baoGiaId,
                rs.getBigDecimal("so_tien"),
                PhuongThucThanhToanTho.valueOf(rs.getString("phuong_thuc")),
                rs.getString("ma_tham_chieu"),
                rs.getLong("nguoi_xac_nhan_id"),
                xacNhan != null ? xacNhan.toInstant() : Instant.EPOCH,
                rs.getString("ghi_chu"),
                rs.getString("fixture_key")
        );
    }
}
